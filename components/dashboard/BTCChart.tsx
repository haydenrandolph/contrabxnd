'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { candleBucket } from '@/lib/chart/candles';
import type { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts';
import type { ChartInterval, OHLCCandle } from '@/lib/chart/candles';

const INTERVALS: { id: ChartInterval; label: string }[] = [
  { id: '1m', label: '1M' },
  { id: '15m', label: '15M' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
];

interface BTCChartProps {
  isLightMode: boolean;
  onPriceTick?: (price: number) => void;
}

export default function BTCChart({ isLightMode, onPriceTick }: BTCChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const currentCandleRef = useRef<OHLCCandle | null>(null);
  const intervalRef = useRef<ChartInterval>('1d');
  const [interval, setInterval] = useState<ChartInterval>('1d');
  const [isLoading, setIsLoading] = useState(true);
  const [chartReady, setChartReady] = useState(false);

  const colors = {
    bg: isLightMode ? '#f7f7f8' : '#0a0a0a',
    text: isLightMode ? '#8a8a8a' : '#5a5a5a',
    border: isLightMode ? '#e5e5e6' : '#1a1a1a',
  };

  const applyTheme = useEffectEvent(() => {
    chartInstanceRef.current?.applyOptions({
      layout: { background: { color: colors.bg }, textColor: colors.text },
      grid: { vertLines: { color: colors.border }, horzLines: { color: colors.border } },
      rightPriceScale: { borderColor: colors.border },
      timeScale: { borderColor: colors.border },
      crosshair: {
        vertLine: { color: isLightMode ? '#c0c0c1' : '#2a2a2a', labelBackgroundColor: isLightMode ? '#0a0a0a' : '#e8e4dc' },
        horzLine: { color: isLightMode ? '#c0c0c1' : '#2a2a2a', labelBackgroundColor: isLightMode ? '#0a0a0a' : '#e8e4dc' },
      },
    });
  });

  useEffect(() => {
    let cancelled = false;
    let chart: IChartApi | undefined;
    let observer: ResizeObserver | undefined;
    const init = async () => {
      const lc = await import('lightweight-charts');
      await document.fonts.ready;
      if (cancelled || !containerRef.current) return;
      const fontFamily = getComputedStyle(containerRef.current).getPropertyValue('--cb-font-mono').trim() || 'monospace';
      chart = lc.createChart(containerRef.current, {
        layout: {
          background: { type: lc.ColorType.Solid },
          fontFamily,
          fontSize: 10,
        },
        crosshair: {
          mode: lc.CrosshairMode.Normal,
          vertLine: { width: 1, style: 3 },
          horzLine: { width: 1, style: 3 },
        },
        rightPriceScale: { scaleMargins: { top: 0.05, bottom: 0.2 } },
        timeScale: { timeVisible: false, secondsVisible: false },
        handleScroll: true,
        handleScale: true,
      });

      const candleSeries = chart.addSeries(lc.CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
        borderVisible: false,
      });

      const volumeSeries = chart.addSeries(lc.HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'volume',
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });

      chartInstanceRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

      const handleResize = () => {
        if (containerRef.current && chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };

      observer = new ResizeObserver(handleResize);
      observer.observe(containerRef.current);
      applyTheme();
      setChartReady(true);
    };
    void init().catch(() => { if (!cancelled) setIsLoading(false); });
    return () => {
      cancelled = true;
      observer?.disconnect();
      chart?.remove();
      chartInstanceRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    intervalRef.current = interval;
    currentCandleRef.current = null;
    if (!chartReady) return;
    const controller = new AbortController();
    candleSeriesRef.current?.setData([]);
    volumeSeriesRef.current?.setData([]);
    chartInstanceRef.current?.applyOptions({ timeScale: { timeVisible: interval !== '1d' && interval !== '1w' } });
    const loadData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/chart?interval=${interval}`, { signal: controller.signal });
        if (!res.ok) return;
        const { candles } = await res.json() as { candles: OHLCCandle[] };
        if (controller.signal.aborted) return;

        if (candleSeriesRef.current && volumeSeriesRef.current && candles.length > 0) {
          candleSeriesRef.current.setData(
            candles.map(c => ({
              time: c.time as UTCTimestamp,
              open: c.open,
              high: c.high,
              low: c.low,
              close: c.close,
            }))
          );
          volumeSeriesRef.current.setData(
            candles.map(c => ({
              time: c.time as UTCTimestamp,
              value: c.volume,
              color: c.close >= c.open ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
            }))
          );
          chartInstanceRef.current?.timeScale().fitContent();
          currentCandleRef.current = { ...candles[candles.length - 1] };
        }
      } catch {
        // Keep live updates paused until history is available.
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    };
    void loadData();
    return () => controller.abort();
  }, [interval, chartReady]);

  const reportPrice = useEffectEvent((price: number) => onPriceTick?.(price));

  // Real-time WebSocket ticks
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;
    let disposed = false;

    function connect() {
      if (disposed) return;
      try {
        ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        ws?.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-USD'],
          channels: ['ticker'],
        }));
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== 'ticker') return;

          const price = parseFloat(msg.price);
          const size = parseFloat(msg.last_size || '0');
          const tickTime = Math.floor(new Date(msg.time).getTime() / 1000);
          if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(tickTime) || !Number.isFinite(size) || size < 0) return;

          reportPrice(price);

          const itv = intervalRef.current;
          const bucket = candleBucket(tickTime, itv);
          let candle = currentCandleRef.current;
          if (!candle) return;

          if (bucket > candle.time) {
            // New candle period
            candle = {
              time: bucket,
              open: price,
              high: price,
              low: price,
              close: price,
              volume: size,
            };
            currentCandleRef.current = candle;
          } else if (bucket === candle.time) {
            // Update current candle
            candle.high = Math.max(candle.high, price);
            candle.low = Math.min(candle.low, price);
            candle.close = price;
            candle.volume += size;
          } else {
            // Tick is older than current candle — ignore
            return;
          }

          // Push update to chart
          if (candleSeriesRef.current) {
            candleSeriesRef.current.update({
              time: candle.time as UTCTimestamp,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
            });
          }

          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
              time: candle.time as UTCTimestamp,
              value: candle.volume,
              color: candle.close >= candle.open
                ? 'rgba(34,197,94,0.2)'
                : 'rgba(239,68,68,0.2)',
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (!disposed) reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      disposed = true;
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Theme update
  useEffect(() => {
    applyTheme();
  }, [isLightMode]);

  return (
    <>
      <style jsx>{`
        .btc-chart-wrap {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
        }

        .chart-toolbar {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0;
          background: ${colors.bg};
          border-bottom: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
        }

        .chart-toolbar-label {
          font-family: var(--cb-font-mono);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 20px;
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
          border-right: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
          flex-shrink: 0;
        }

        .interval-btn {
          font-family: var(--cb-font-mono);
          min-height: 44px;
          flex-shrink: 0;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 16px;
          background: transparent;
          border: none;
          border-right: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
          color: ${isLightMode ? '#8a8a8a' : '#5a5a5a'};
          cursor: pointer;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .interval-btn:hover {
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
        }

        .interval-btn:focus-visible { outline: 2px solid var(--cb-accent); outline-offset: -3px; }

        .interval-btn.active {
          color: #F7931A;
          background: ${isLightMode ? '#f0f0f1' : '#141414'};
        }

        .chart-canvas-area {
          flex: 1;
          position: relative;
          min-height: 0;
        }

        .chart-canvas-area :global(#tv-attr-logo) {
          display: none !important;
        }

        .chart-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: var(--cb-font-mono);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: ${isLightMode ? '#8a8a8a' : '#5a5a5a'};
          z-index: 5;
        }
      `}</style>

      <div className="btc-chart-wrap">
        <div className="chart-toolbar">
          <span className="chart-toolbar-label">BTC / USD</span>
          {INTERVALS.map(i => (
            <button
              key={i.id}
              className={`interval-btn ${interval === i.id ? 'active' : ''}`}
              aria-pressed={interval === i.id}
              aria-label={`${i.label} candle interval`}
              onClick={() => setInterval(i.id)}
            >
              {i.label}
            </button>
          ))}
        </div>
        <div className="chart-canvas-area" ref={containerRef}>
          {isLoading && <div className="chart-loading">Loading...</div>}
        </div>
      </div>
    </>
  );
}
