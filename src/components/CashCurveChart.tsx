'use client';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatPaise } from '@/lib/utils';

export interface CurvePoint {
  date: string;
  closing_balance_paise: number;
  /** Optional: what happened that day, shown when the user touches or hovers. */
  inflow_paise?: number;
  outflow_paise?: number;
}

interface Props {
  points: CurvePoint[];
  /** Optional second line (e.g. a what-if scenario). */
  compare?: CurvePoint[];
  thresholdPaise?: number;
  height?: number;
}

const PAD = { l: 56, r: 12, t: 14, b: 26 };

/** Short Indian style for axis labels: ₹6,200 · ₹1.5 L · ₹2 Cr. Full numbers elsewhere. */
function axisLabel(paise: number): string {
  const rupees = paise / 100;
  const abs = Math.abs(rupees);
  const sign = rupees < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${+(abs / 10_000_000).toFixed(1)} Cr`;
  if (abs >= 100_000) return `${sign}₹${+(abs / 100_000).toFixed(1)} L`;
  return formatPaise(paise);
}

/** Round, evenly spaced tick values covering [min, max]. */
function ticks(min: number, max: number, count = 4): number[] {
  const span = max - min || 1;
  const rough = span / count;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-6; v += step) out.push(Math.round(v));
  return out;
}

export function CashCurveChart({ points, compare, thresholdPaise = 0, height = 260 }: Props) {
  const { t } = useLanguage();
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(Math.max(200, el.clientWidth)));
    ro.observe(el);
    setWidth(Math.max(200, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  const g = useMemo(() => {
    if (points.length === 0) return null;
    const values = [...points, ...(compare ?? [])].map((p) => p.closing_balance_paise).concat([0, thresholdPaise]);
    let min = Math.min(...values);
    let max = Math.max(...values);
    const pad = (max - min) * 0.08 || 100;
    min -= pad;
    max += pad;
    const x = (i: number) => PAD.l + (i / Math.max(points.length - 1, 1)) * (width - PAD.l - PAD.r);
    const y = (v: number) => PAD.t + (1 - (v - min) / (max - min)) * (height - PAD.t - PAD.b);
    return { x, y, min, max, yTicks: ticks(min, max) };
  }, [points, compare, thresholdPaise, width, height]);

  if (!g) return null;
  const { x, y, yTicks } = g;

  const line = (pts: CurvePoint[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.closing_balance_paise).toFixed(1)}`).join(' ');

  const lowestIdx = points.reduce((best, p, i) => (p.closing_balance_paise < points[best].closing_balance_paise ? i : best), 0);
  const lowest = points[lowestIdx];
  const active = hover ?? null;
  const shown = points[active ?? lowestIdx];
  const shownCompare = active !== null ? compare?.[active] : undefined;
  const todayIdx = 0;

  function indexFromPointer(e: PointerEvent<SVGSVGElement>): number {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - PAD.l) / (width - PAD.l - PAD.r)) * (points.length - 1));
    return Math.min(Math.max(i, 0), points.length - 1);
  }

  function onKey(e: KeyboardEvent<SVGSVGElement>) {
    if (e.key === 'ArrowRight') setHover((h) => Math.min((h ?? lowestIdx) + 1, points.length - 1));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max((h ?? lowestIdx) - 1, 0));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  }

  const summary = t('Cash balance from {from} to {to}. Lowest {low} on {date}.', {
    from: formatDate(points[0].date),
    to: formatDate(points[points.length - 1].date),
    low: formatPaise(lowest.closing_balance_paise),
    date: formatDate(lowest.date),
  });

  const readoutBalance = shown.closing_balance_paise;
  const isLowestShown = active === null || active === lowestIdx;

  return (
    <figure className="w-full">
      {/* Readout: always visible, so phones (no hover) and screen readers get the numbers too. */}
      <div className="mb-2 min-h-[3.25rem] rounded-md bg-muted px-3 py-2 text-sm" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
          <span className="text-muted-foreground">
            {active === null ? t('Lowest point') : active === todayIdx ? t('Today') : t('On this day')}
            {' · '}
            {formatDate(shown.date)}
          </span>
          <span className={readoutBalance < 0 ? 'text-lg font-bold text-destructive' : 'text-lg font-bold'}>{formatPaise(readoutBalance)}</span>
        </div>
        {active !== null && (shown.inflow_paise || shown.outflow_paise) ? (
          <div className="mt-0.5 flex flex-wrap gap-x-4 text-xs">
            {!!shown.inflow_paise && <span className="text-success">{t('Money in')}: +{formatPaise(shown.inflow_paise)}</span>}
            {!!shown.outflow_paise && <span className="text-destructive">{t('Money out')}: −{formatPaise(shown.outflow_paise)}</span>}
          </div>
        ) : active === null ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{t('Touch or move over the chart to see any day.')}</p>
        ) : null}
        {shownCompare && (
          <p className="mt-0.5 text-xs text-warning">
            {t('If the payment is late')}: {formatPaise(shownCompare.closing_balance_paise)}
          </p>
        )}
      </div>

      <div ref={wrap} className="relative w-full touch-pan-y select-none">
        <svg
          width={width}
          height={height}
          className="block max-w-full"
          role="img"
          tabIndex={0}
          aria-label={summary}
          onPointerMove={(e) => setHover(indexFromPointer(e))}
          onPointerDown={(e) => setHover(indexFromPointer(e))}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
        >
          {/* Horizontal grid + rupee labels */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={PAD.l} x2={width - PAD.r} y1={y(v)} y2={y(v)} stroke="hsl(var(--border))" strokeWidth={v === 0 ? 1.5 : 1} strokeDasharray={v === 0 ? undefined : '3 4'} />
              <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="hsl(var(--muted-foreground))">
                {axisLabel(v)}
              </text>
            </g>
          ))}
          {thresholdPaise > 0 && (
            <g>
              <line x1={PAD.l} x2={width - PAD.r} y1={y(thresholdPaise)} y2={y(thresholdPaise)} stroke="hsl(var(--warning))" strokeDasharray="2 4" />
              <text x={width - PAD.r} y={y(thresholdPaise) - 4} textAnchor="end" fontSize="10" fill="hsl(var(--warning))">
                {t('Safety amount')}
              </text>
            </g>
          )}

          {compare && compare.length > 0 && <path d={line(compare)} fill="none" stroke="hsl(var(--warning))" strokeWidth={2} strokeDasharray="6 4" />}
          <path d={line(points)} fill="none" stroke="hsl(var(--primary))" strokeWidth={2.5} strokeLinejoin="round" />

          {/* Lowest point, labelled in rupees */}
          <circle cx={x(lowestIdx)} cy={y(lowest.closing_balance_paise)} r={5} fill={lowest.closing_balance_paise < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} stroke="white" strokeWidth={2} />
          {isLowestShown && (
            <text
              x={Math.min(Math.max(x(lowestIdx), PAD.l + 30), width - PAD.r - 30)}
              y={y(lowest.closing_balance_paise) + (y(lowest.closing_balance_paise) > height - 60 ? -12 : 20)}
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill={lowest.closing_balance_paise < 0 ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))'}
            >
              {axisLabel(lowest.closing_balance_paise)}
            </text>
          )}

          {/* Days with money in (green up-triangle) or money out (red down-triangle), on the bottom edge */}
          {points.map((p, i) => (
            <g key={`m-${p.date}`} pointerEvents="none">
              {!!p.inflow_paise && <polygon points={`${x(i) - 4},${height - PAD.b - 2} ${x(i) + 4},${height - PAD.b - 2} ${x(i)},${height - PAD.b - 9}`} fill="hsl(var(--success))" />}
              {!!p.outflow_paise && <polygon points={`${x(i) - 4},${height - PAD.b - 11} ${x(i) + 4},${height - PAD.b - 11} ${x(i)},${height - PAD.b - 4}`} fill="hsl(var(--destructive))" />}
            </g>
          ))}

          {/* Today marker */}
          <circle cx={x(todayIdx)} cy={y(points[todayIdx].closing_balance_paise)} r={4} fill="hsl(var(--success))" stroke="white" strokeWidth={2} />

          {/* Hover guide */}
          {active !== null && (
            <g pointerEvents="none">
              <line x1={x(active)} x2={x(active)} y1={PAD.t} y2={height - PAD.b} stroke="hsl(var(--foreground))" strokeOpacity={0.35} />
              <circle cx={x(active)} cy={y(shown.closing_balance_paise)} r={6} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
              {shownCompare && <circle cx={x(active)} cy={y(shownCompare.closing_balance_paise)} r={5} fill="hsl(var(--warning))" stroke="white" strokeWidth={2} />}
            </g>
          )}

          {/* X axis: start, middle, end dates */}
          {[0, Math.floor((points.length - 1) / 2), points.length - 1].map((i, k) => (
            <text key={`${i}-${k}`} x={x(i)} y={height - 6} textAnchor={k === 0 ? 'start' : k === 2 ? 'end' : 'middle'} fontSize="11" fill="hsl(var(--muted-foreground))">
              {k === 0 ? t('Today') : formatDate(points[i].date)}
            </text>
          ))}
        </svg>
      </div>

      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="inline-block h-0.5 w-5 bg-primary" /> {t('Expected balance')}</span>
        {compare && (
          <span className="inline-flex items-center gap-1"><span className="inline-block w-5 border-t-2 border-dashed border-warning" /> {t('If the payment is late')}</span>
        )}
        {points.some((p) => p.inflow_paise) && <span className="inline-flex items-center gap-1"><span className="text-success" aria-hidden>▲</span> {t('Money in')}</span>}
        {points.some((p) => p.outflow_paise) && <span className="inline-flex items-center gap-1"><span className="text-destructive" aria-hidden>▼</span> {t('Money out')}</span>}
        <span>{t('Line going down = money going out. Line going up = money coming in.')}</span>
        <span className="sr-only">{summary}</span>
      </figcaption>
    </figure>
  );
}
