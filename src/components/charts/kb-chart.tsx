import { useEffect, useId, useMemo, useRef, useState } from "react";

type ChartKind = "area" | "bar" | "line";

type KbChartProps<Row extends Record<string, unknown>> = {
  kind: ChartKind;
  data: Row[];
  xKey: keyof Row & string;
  yKey: keyof Row & string;
  /** Nome da série exibido no tooltip. */
  seriesLabel: string;
  formatValue?: (value: number) => string;
  formatAxis?: (value: number) => string;
  /** Prefixo do rótulo no tooltip, ex.: "Dia". */
  labelPrefix?: string;
  hideYAxis?: boolean;
  className?: string;
};

const defaultFormat = (value: number) => new Intl.NumberFormat("pt-BR").format(value);

/**
 * Gráfico SVG autoral e responsivo (área, barras ou linha), com animação
 * de entrada, grade suave e tooltip por coluna — sem bibliotecas externas.
 */
export function KbChart<Row extends Record<string, unknown>>({
  kind,
  data,
  xKey,
  yKey,
  seriesLabel,
  formatValue = defaultFormat,
  formatAxis,
  labelPrefix,
  hideYAxis = false,
  className,
}: KbChartProps<Row>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [active, setActive] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const update = () =>
      setSize({ width: element.clientWidth, height: Math.max(element.clientHeight, 120) });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const values = useMemo(() => data.map((row) => Number(row[yKey]) || 0), [data, yKey]);
  const labels = useMemo(() => data.map((row) => String(row[xKey] ?? "")), [data, xKey]);
  const axisFormat = formatAxis ?? compactFormatter(formatValue);
  const ticks = useMemo(() => niceTicks(Math.max(...values, 0)), [values]);
  const maxTick = ticks[ticks.length - 1] || 1;

  const longestTick = Math.max(...ticks.map((tick) => axisFormat(tick).length), 1);
  const padding = {
    top: 14,
    right: 10,
    bottom: 28,
    left: hideYAxis ? 8 : Math.min(84, longestTick * 6.6 + 14),
  };
  const innerWidth = Math.max(size.width - padding.left - padding.right, 1);
  const innerHeight = Math.max(size.height - padding.top - padding.bottom, 1);
  const band = data.length ? innerWidth / data.length : innerWidth;

  const points = values.map((value, index) => ({
    x: padding.left + band * index + band / 2,
    y: padding.top + innerHeight - (value / maxTick) * innerHeight,
  }));
  const baseline = padding.top + innerHeight;
  const linePath = smoothPath(points);
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${baseline} L ${points[0].x} ${baseline} Z`
    : "";
  const labelEvery = Math.max(1, Math.ceil(data.length / Math.max(1, Math.floor(innerWidth / 46))));
  const ready = size.width > 0;
  const activePoint = active !== null ? points[active] : null;

  return (
    <div
      ref={containerRef}
      className={`kb-chart relative h-full w-full select-none ${className ?? ""}`}
      onPointerLeave={() => setActive(null)}
    >
      {ready && data.length ? (
        <svg
          width={size.width}
          height={size.height}
          role="img"
          aria-label={`${seriesLabel}: ${labels
            .map((label, index) => `${label} ${formatValue(values[index])}`)
            .join(", ")}`}
          className="block overflow-visible"
        >
          <defs>
            <linearGradient id={`fill-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.42} />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`bar-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--brass-highlight)" />
              <stop offset="100%" stopColor="var(--gold-hover)" />
            </linearGradient>
          </defs>

          {ticks.map((tick) => {
            const y = padding.top + innerHeight - (tick / maxTick) * innerHeight;
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  x2={size.width - padding.right}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeDasharray={tick === 0 ? undefined : "3 5"}
                  opacity={tick === 0 ? 1 : 0.7}
                />
                {!hideYAxis ? (
                  <text
                    x={padding.left - 10}
                    y={y}
                    dy="0.32em"
                    textAnchor="end"
                    className="fill-muted-foreground text-[10.5px] tabular-nums"
                  >
                    {axisFormat(tick)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {activePoint && kind !== "bar" ? (
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padding.top}
              y2={baseline}
              stroke="var(--gold)"
              strokeOpacity={0.45}
              strokeDasharray="2 4"
            />
          ) : null}

          {kind === "bar"
            ? values.map((value, index) => {
                const barWidth = Math.min(Math.max(band * 0.56, 4), 42);
                const x = padding.left + band * index + (band - barWidth) / 2;
                const height = (value / maxTick) * innerHeight;
                return (
                  <g key={`${labels[index]}-${index}`}>
                    <rect
                      x={padding.left + band * index + 2}
                      y={padding.top}
                      width={Math.max(band - 4, 1)}
                      height={innerHeight}
                      rx={10}
                      fill="var(--gold)"
                      opacity={active === index ? 0.07 : 0}
                      className="transition-opacity duration-200"
                    />
                    <path
                      d={roundedTopBar(
                        x,
                        baseline - height,
                        barWidth,
                        height,
                        Math.min(7, barWidth / 2),
                      )}
                      fill={`url(#bar-${gradientId})`}
                      opacity={active === null || active === index ? 1 : 0.45}
                      className="kb-chart-bar transition-opacity duration-200"
                      style={{ animationDelay: `${index * 45}ms` }}
                    />
                  </g>
                );
              })
            : null}

          {kind === "area" ? (
            <path d={areaPath} fill={`url(#fill-${gradientId})`} className="kb-chart-area" />
          ) : null}

          {kind !== "bar" ? (
            <path
              d={linePath}
              fill="none"
              stroke="var(--gold)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              className="kb-chart-line"
            />
          ) : null}

          {kind === "line"
            ? points.map((point, index) => (
                <circle
                  key={`dot-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={3}
                  fill="var(--gold)"
                  className="kb-chart-dot"
                  style={{ animationDelay: `${400 + index * 40}ms` }}
                />
              ))
            : null}

          {activePoint && kind !== "bar" ? (
            <circle
              cx={activePoint.x}
              cy={activePoint.y}
              r={5.5}
              fill="var(--card)"
              stroke="var(--gold)"
              strokeWidth={2.5}
            />
          ) : null}

          {labels.map((label, index) =>
            index % labelEvery === 0 ? (
              <text
                key={`label-${index}`}
                x={padding.left + band * index + band / 2}
                y={size.height - 8}
                textAnchor="middle"
                className={`text-[10.5px] transition-colors ${
                  active === index ? "fill-foreground font-semibold" : "fill-muted-foreground"
                }`}
              >
                {label}
              </text>
            ) : null,
          )}

          {values.map((_, index) => (
            <rect
              key={`hit-${index}`}
              x={padding.left + band * index}
              y={0}
              width={band}
              height={size.height}
              fill="transparent"
              onPointerEnter={() => setActive(index)}
              onPointerDown={() => setActive(index)}
            />
          ))}
        </svg>
      ) : null}

      {ready && !data.length ? (
        <div className="grid h-full place-items-center text-sm text-muted-foreground">
          Sem dados no período.
        </div>
      ) : null}

      {active !== null && activePoint ? (
        <div
          className="kb-pop pointer-events-none absolute z-10 min-w-[8.5rem] -translate-x-1/2 rounded-xl border border-border bg-popover/95 px-3 py-2 text-popover-foreground shadow-[0_18px_40px_-20px_rgb(0_0_0/0.55)] backdrop-blur"
          style={{
            left: Math.min(Math.max(activePoint.x, 70), size.width - 70),
            top: Math.max(activePoint.y - 64, 0),
          }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {labelPrefix ? `${labelPrefix}: ` : ""}
            {labels[active]}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
            <span className="h-2 w-2 rounded-full bg-gold" />
            {formatValue(values[active])}
            <span className="text-xs font-normal text-muted-foreground">{seriesLabel}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const rawStep = max / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10) * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) ticks.push(Number(value.toFixed(6)));
  return ticks;
}

function compactFormatter(format: (value: number) => string) {
  return (value: number) => {
    const formatted = format(value);
    if (value < 1000) return formatted.replace(/,00$/, "");
    const compact = new Intl.NumberFormat("pt-BR", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
    return formatted.includes("R$") ? `R$ ${compact}` : compact;
  };
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] ?? next;
    const tension = 0.18;
    const c1x = current.x + (next.x - previous.x) * tension;
    const c2x = next.x - (after.x - current.x) * tension;
    const minY = Math.min(current.y, next.y);
    const maxY = Math.max(current.y, next.y);
    const c1y = clamp(current.y + (next.y - previous.y) * tension, minY, maxY);
    const c2y = clamp(next.y - (after.y - current.y) * tension, minY, maxY);
    path += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${next.x} ${next.y}`;
  }
  return path;
}

function roundedTopBar(x: number, y: number, width: number, height: number, radius: number) {
  if (height <= 0) return `M ${x} ${y} h ${width}`;
  const r = Math.min(radius, height);
  return `M ${x} ${y + height} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + width - r} Q ${
    x + width
  } ${y} ${x + width} ${y + r} V ${y + height} Z`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
