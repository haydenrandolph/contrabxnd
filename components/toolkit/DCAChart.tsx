'use client';

import { useState, useRef, useCallback, useMemo } from 'react';

interface DCAChartProps {
  dataPoints: Array<{ date: string; invested: number; value: number }>;
  isLightMode: boolean;
}

function downsample<T>(data: T[], target: number): T[] {
  if (data.length <= target) return data;
  const step = (data.length - 1) / (target - 1);
  const result: T[] = [];
  for (let i = 0; i < target; i++) {
    result.push(data[Math.round(i * step)]);
  }
  return result;
}

export default function DCAChart({ dataPoints, isLightMode }: DCAChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const displayPoints = useMemo(
    () => (dataPoints.length > 500 ? downsample(dataPoints, 300) : dataPoints),
    [dataPoints],
  );

  // Chart dimensions & padding
  const W = 800;
  const H = 400;
  const PL = 70; // padding-left (y-axis labels)
  const PR = 20;
  const PT = 20;
  const PB = 40; // padding-bottom (x-axis labels)

  const chartW = W - PL - PR;
  const chartH = H - PT - PB;

  // Compute scales
  const maxVal = useMemo(() => {
    let m = 0;
    for (const p of displayPoints) {
      if (p.invested > m) m = p.invested;
      if (p.value > m) m = p.value;
    }
    return m * 1.1 || 1; // 10% headroom
  }, [displayPoints]);

  const toX = useCallback(
    (i: number) => PL + (i / Math.max(displayPoints.length - 1, 1)) * chartW,
    [displayPoints.length, chartW],
  );

  const toY = useCallback(
    (v: number) => PT + chartH - (v / maxVal) * chartH,
    [maxVal, chartH],
  );

  // Build path strings
  const investedPath = useMemo(() => {
    if (!displayPoints.length) return '';
    return displayPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p.invested).toFixed(2)}`)
      .join(' ');
  }, [displayPoints, toX, toY]);

  const valuePath = useMemo(() => {
    if (!displayPoints.length) return '';
    return displayPoints
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(2)},${toY(p.value).toFixed(2)}`)
      .join(' ');
  }, [displayPoints, toX, toY]);

  const valueFillPath = useMemo(() => {
    if (!displayPoints.length) return '';
    const last = displayPoints.length - 1;
    return (
      valuePath +
      ` L${toX(last).toFixed(2)},${toY(0).toFixed(2)} L${toX(0).toFixed(2)},${toY(0).toFixed(2)} Z`
    );
  }, [displayPoints, valuePath, toX, toY]);

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const count = 5;
    const ticks: number[] = [];
    for (let i = 0; i <= count; i++) {
      ticks.push((maxVal / count) * i);
    }
    return ticks;
  }, [maxVal]);

  // X-axis date labels (~6 evenly spaced)
  const xLabels = useMemo(() => {
    const count = Math.min(6, displayPoints.length);
    if (count < 2) return displayPoints.map((p, i) => ({ label: p.date, index: i }));
    const labels: { label: string; index: number }[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.round((i / (count - 1)) * (displayPoints.length - 1));
      labels.push({ label: displayPoints[idx].date, index: idx });
    }
    return labels;
  }, [displayPoints]);

  const formatUSD = (v: number) => {
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  // Hover handling
  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg || !displayPoints.length) return;
      const rect = svg.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * W;
      // Find nearest data index
      const ratio = (mouseX - PL) / chartW;
      const idx = Math.round(ratio * (displayPoints.length - 1));
      if (idx >= 0 && idx < displayPoints.length) {
        setHoverIndex(idx);
      }
    },
    [displayPoints.length, chartW],
  );

  const handlePointerLeave = useCallback(() => setHoverIndex(null), []);

  const gridColor = isLightMode ? '#e0dcd4' : '#1a1a1a';
  const axisColor = isLightMode ? '#5a5a5a' : '#5a5a5a';
  const tooltipBg = isLightMode ? '#ffffff' : '#141414';
  const tooltipBorder = isLightMode ? '#d0ccc4' : '#3a3a3a';
  const tooltipText = isLightMode ? '#0a0a0a' : '#e8e4dc';

  const gradientId = 'dca-value-gradient';

  return (
    <>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: '100%', display: 'block', userSelect: 'none' }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(247,147,26,0.2)" />
            <stop offset="100%" stopColor="rgba(247,147,26,0)" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={PL}
            y1={toY(tick)}
            x2={W - PR}
            y2={toY(tick)}
            stroke={gridColor}
            strokeWidth={0.5}
          />
        ))}

        {/* Y-axis labels */}
        {yTicks.map((tick, i) => (
          <text
            key={`y-${i}`}
            x={PL - 8}
            y={toY(tick) + 3}
            textAnchor="end"
            fill={axisColor}
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px' }}
          >
            {formatUSD(tick)}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map(({ label, index }, i) => (
          <text
            key={`x-${i}`}
            x={toX(index)}
            y={H - PB + 20}
            textAnchor="middle"
            fill={axisColor}
            style={{ fontFamily: "'Space Mono', monospace", fontSize: '9px' }}
          >
            {label}
          </text>
        ))}

        {/* Value fill area */}
        {valueFillPath && (
          <path d={valueFillPath} fill={`url(#${gradientId})`} />
        )}

        {/* Invested line */}
        {investedPath && (
          <path d={investedPath} fill="none" stroke="#8a8a8a" strokeWidth={1.5} />
        )}

        {/* Value line */}
        {valuePath && (
          <path d={valuePath} fill="none" stroke="#F7931A" strokeWidth={2} />
        )}

        {/* Hover crosshair + tooltip */}
        {hoverIndex !== null && hoverIndex < displayPoints.length && (() => {
          const pt = displayPoints[hoverIndex];
          const cx = toX(hoverIndex);
          const tooltipW = 170;
          const tooltipH = 64;
          let tx = cx + 12;
          if (tx + tooltipW > W - PR) tx = cx - tooltipW - 12;
          const ty = PT + 10;

          return (
            <g>
              <line
                x1={cx}
                y1={PT}
                x2={cx}
                y2={H - PB}
                stroke={isLightMode ? '#b0ada6' : '#3a3a3a'}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <circle cx={cx} cy={toY(pt.value)} r={4} fill="#F7931A" />
              <circle cx={cx} cy={toY(pt.invested)} r={3} fill="#8a8a8a" />

              {/* Tooltip */}
              <rect
                x={tx}
                y={ty}
                width={tooltipW}
                height={tooltipH}
                rx={4}
                fill={tooltipBg}
                stroke={tooltipBorder}
                strokeWidth={1}
              />
              <text
                x={tx + 10}
                y={ty + 16}
                fill={tooltipText}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: '11px' }}
              >
                {pt.date}
              </text>
              <text
                x={tx + 10}
                y={ty + 34}
                fill="#8a8a8a"
                style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px' }}
              >
                Invested: {formatUSD(pt.invested)}
              </text>
              <text
                x={tx + 10}
                y={ty + 52}
                fill="#F7931A"
                style={{ fontFamily: "'Space Mono', monospace", fontSize: '10px' }}
              >
                Value: {formatUSD(pt.value)}
              </text>
            </g>
          );
        })()}
      </svg>
    </>
  );
}
