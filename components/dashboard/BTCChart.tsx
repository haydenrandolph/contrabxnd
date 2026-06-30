'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChartInterval, OHLCCandle } from '@/lib/chart/candles';

const INTERVALS: { id: ChartInterval; label: string }[] = [
  { id: '1m', label: '1M' },
  { id: '15m', label: '15M' },
  { id: '1h', label: '1H' },
  { id: '4h', label: '4H' },
  { id: '1d', label: '1D' },
  { id: '1w', label: '1W' },
];

// Seconds per candle for each interval (matches candles.ts GRANULARITY)
const BUCKET_SECONDS: Record<ChartInterval, number> = {
  '1m': 60,
  '15m': 900,
  '1h': 3600,
  '4h': 21600,
  '1d': 86400,
  '1w': 604800,
};

interface BTCChartProps {
  isLightMode: boolean;
  onPriceTick?: (price: number) => void;
}

export default function BTCChart({ isLightMode, onPriceTick }: BTCChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chartInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const volumeSeriesRef = useRef<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const currentCandleRef = useRef<OHLCCandle | null>(null);
  const intervalRef = useRef<ChartInterval>('1d');
  const [interval, setInterval] = useState<ChartInterval>('1d');
  const [isLoading, setIsLoading] = useState(true);

  intervalRef.current = interval;

  const colors = {
    bg: isLightMode ? '#f7f7f8' : '#0a0a0a',
    text: isLightMode ? '#8a8a8a' : '#5a5a5a',
    border: isLightMode ? '#e5e5e6' : '#1a1a1a',
    up: '#22c55e',
    down: '#ef4444',
  };

  const isLightRef = useRef(isLightMode);
  isLightRef.current = isLightMode;

  const onPriceTickRef = useRef(onPriceTick);
  onPriceTickRef.current = onPriceTick;

  function getCandleBucket(timestampSec: number, itv: ChartInterval): number {
    const bucket = BUCKET_SECONDS[itv];
    return Math.floor(timestampSec / bucket) * bucket;
  }

  const initChart = useCallback(async () => {
    if (!containerRef.current) return;

    const lc = await import('lightweight-charts');

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
    }

    const chart = lc.createChart(containerRef.current, {
      layout: {
        background: { type: lc.ColorType.Solid, color: colors.bg },
        textColor: colors.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: colors.border },
        horzLines: { color: colors.border },
      },
      crosshair: {
        mode: lc.CrosshairMode.Normal,
        vertLine: {
          color: isLightMode ? '#c0c0c1' : '#2a2a2a',
          width: 1,
          style: 3,
          labelBackgroundColor: isLightMode ? '#0a0a0a' : '#e8e4dc',
        },
        horzLine: {
          color: isLightMode ? '#c0c0c1' : '#2a2a2a',
          width: 1,
          style: 3,
          labelBackgroundColor: isLightMode ? '#0a0a0a' : '#e8e4dc',
        },
      },
      rightPriceScale: {
        borderColor: colors.border,
        scaleMargins: { top: 0.05, bottom: 0.2 },
      },
      timeScale: {
        borderColor: colors.border,
        timeVisible: interval === '1m' || interval === '15m' || interval === '1h' || interval === '4h',
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candleSeries = chart.addSeries(lc.CandlestickSeries, {
      upColor: colors.up,
      downColor: colors.down,
      wickUpColor: colors.up,
      wickDownColor: colors.down,
      borderVisible: false,
    });

    const volumeSeries = chart.addSeries(lc.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Remove TradingView attribution logo
    requestAnimationFrame(() => {
      containerRef.current?.querySelector('#tv-attr-logo')?.remove();
    });

    const handleResize = () => {
      if (containerRef.current && chartInstanceRef.current) {
        chartInstanceRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.remove();
      chartInstanceRef.current = null;
    };
  }, [isLightMode, interval]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chart?interval=${interval}`);
      if (!res.ok) return;
      const { candles } = await res.json() as { candles: OHLCCandle[] };

      if (candleSeriesRef.current && volumeSeriesRef.current && candles.length > 0) {
        candleSeriesRef.current.setData(
          candles.map((c: OHLCCandle) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );

        volumeSeriesRef.current.setData(
          candles.map((c: OHLCCandle) => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open
              ? (isLightMode ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.2)')
              : (isLightMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.2)'),
          }))
        );

        chartInstanceRef.current?.timeScale().fitContent();

        // Seed current candle from the last historical candle
        const last = candles[candles.length - 1];
        currentCandleRef.current = { ...last };
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, [interval, isLightMode]);

  // Chart init + data load
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      cleanup = await initChart();
      await loadData();
    })();

    return () => cleanup?.();
  }, [initChart, loadData]);

  // Real-time WebSocket ticks
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      ws = new WebSocket('wss://ws-feed.exchange.coinbase.com');
      wsRef.current = ws;

      ws.onopen = () => {
        ws?.send(JSON.stringify({
          type: 'subscribe',
          product_ids: ['BTC-USD'],
          channels: ['ticker'],
        }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type !== 'ticker') return;

          const price = parseFloat(msg.price);
          const size = parseFloat(msg.last_size || '0');
          const tickTime = Math.floor(new Date(msg.time).getTime() / 1000);
          if (isNaN(price) || price === 0) return;

          onPriceTickRef.current?.(price);

          const itv = intervalRef.current;
          const bucket = getCandleBucket(tickTime, itv);
          const light = isLightRef.current;

          let candle = currentCandleRef.current;

          if (!candle || bucket > candle.time) {
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
              time: candle.time,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
            });
          }

          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update({
              time: candle.time,
              value: candle.volume,
              color: candle.close >= candle.open
                ? (light ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.2)')
                : (light ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.2)'),
            });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  // Reset current candle when interval changes
  useEffect(() => {
    currentCandleRef.current = null;
  }, [interval]);

  // Theme update
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.applyOptions({
      layout: {
        background: { type: 'solid', color: colors.bg },
        textColor: colors.text,
      },
      grid: {
        vertLines: { color: colors.border },
        horzLines: { color: colors.border },
      },
    });
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
          gap: 0;
          background: ${colors.bg};
          border-bottom: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
        }

        .chart-toolbar-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 10px 20px;
          color: ${isLightMode ? '#0a0a0a' : '#e8e4dc'};
          border-right: 1px solid ${isLightMode ? '#d0d0d1' : '#1a1a1a'};
          flex-shrink: 0;
        }

        .interval-btn {
          font-family: 'JetBrains Mono', monospace;
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
          font-family: 'JetBrains Mono', monospace;
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
