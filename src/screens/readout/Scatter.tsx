import { useState } from 'react';
import { usd } from '../../lib/format';
import type { CreatorResult } from '../../lib/readout';
import type { PoolInfo } from './pools';

/**
 * Fee (across) against purchases (up), one dot per creator colored by pool and labeled directly, with the line
 * where CPA equals the goal. Above the line beats paid social. Position against the line reads before any text.
 */
const W = 760;
const H = 400;
const PAD = { l: 44, r: 16, t: 12, b: 28 };

const niceMax = (v: number, step: number) => Math.max(step, Math.ceil(v / step) * step);

export function Scatter({ rows, goal, pools }: { rows: CreatorResult[]; goal: number; pools: PoolInfo[] }) {
  const [hover, setHover] = useState<string | null>(null);
  const xMax = niceMax(Math.max(...rows.map((r) => r.creator.fee_usd)), 2000);
  const yMax = niceMax(Math.max(...rows.map((r) => r.result.purchases)) * 1.1, 50);
  const x = (fee: number) => PAD.l + (fee / xMax) * (W - PAD.l - PAD.r);
  const y = (p: number) => H - PAD.b - (p / yMax) * (H - PAD.t - PAD.b);
  const tone = (pool: string) => pools.find((p) => p.id === pool)?.tone ?? 'custom';

  // The goal line ends where it leaves the plot: at the right edge, or the top.
  const lineEndFee = Math.min(xMax, yMax * goal);
  const angle = (Math.atan2(y(0) - y(lineEndFee / goal), x(lineEndFee) - x(0)) * 180) / Math.PI;

  // Direct labels: try right, left, above, and below each dot, and take the first spot that clears every dot and
  // every label placed so far (and stays inside the plot). Falls back to the right.
  const dots = rows.map((r) => ({ r, cx: x(r.creator.fee_usd), cy: y(r.result.purchases) }));
  type Box = { x: number; y: number; w: number; h: number };
  const boxes: Box[] = dots.map((d) => ({ x: d.cx - 8, y: d.cy - 8, w: 16, h: 16 }));
  const hits = (a: Box) => boxes.some((b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y);
  const inside = (a: Box) => a.x >= PAD.l && a.x + a.w <= W - PAD.r && a.y >= PAD.t && a.y + a.h <= H - PAD.b;
  const labels = [...dots]
    .sort((a, b) => b.r.result.purchases - a.r.result.purchases)
    .map(({ r, cx, cy }) => {
      const w = r.creator.handle.length * 6.4;
      const h = 13;
      const spots: Box[] = [
        { x: cx + 10, y: cy - h / 2, w, h },
        { x: cx - 10 - w, y: cy - h / 2, w, h },
        { x: cx - w / 2, y: cy - 10 - h, w, h },
        { x: cx - w / 2, y: cy + 10, w, h },
        { x: cx + 8, y: cy - 6 - h, w, h },
        { x: cx - 8 - w, y: cy + 6, w, h },
      ];
      const spot = spots.find((s) => inside(s) && !hits(s)) ?? spots.find(inside) ?? spots[0]!;
      boxes.push(spot);
      return { r, cx, cy, lx: spot.x, ly: spot.y + h - 3 };
    });

  const hovered = labels.find((l) => l.r.creator.handle === hover);
  const yTicks = Array.from({ length: yMax / 50 + 1 }, (_, i) => i * 50);
  const xTicks = Array.from({ length: xMax / 2000 + 1 }, (_, i) => i * 2000);

  return (
    <div className="scatter">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Purchases against fee for each creator. Points above the dashed line beat the ${usd(goal)} paid social CPA.`}
      >
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="scatter__grid" />
            <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="scatter__tick">
              {t}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="scatter__tick">
            {usd(t)}
          </text>
        ))}
        <line x1={x(0)} y1={y(0)} x2={x(lineEndFee)} y2={y(lineEndFee / goal)} className="scatter__goal" />
        <text
          x={x(lineEndFee * 0.82)}
          y={y((lineEndFee * 0.82) / goal) - 8}
          transform={`rotate(${-angle} ${x(lineEndFee * 0.82)} ${y((lineEndFee * 0.82) / goal) - 8})`}
          className="scatter__goal-label"
        >
          {usd(goal)} CPA line
        </text>
        <text x={x(xMax * 0.03)} y={y(yMax * 0.9)} className="scatter__region scatter__region--beat">
          ↖ Beats paid social
        </text>
        <text x={x(xMax * 0.47)} y={y(yMax * 0.04)} className="scatter__region">
          Costs more than paid social ↘
        </text>
        {labels.map(({ r, cx, cy, lx, ly }) => {
          const h = r.creator.handle;
          return (
            <g
              key={h}
              className={`scatter__point pool--${tone(r.pool)}`}
              tabIndex={0}
              role="button"
              aria-label={`${h}: ${r.cpa === null ? 'no purchases' : `${usd(r.cpa)} CPA`}, ${r.result.purchases} purchases for ${usd(r.creator.fee_usd)}`}
              onMouseEnter={() => setHover(h)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(h)}
              onBlur={() => setHover(null)}
            >
              <circle cx={cx} cy={cy} r={7} />
              <text x={lx} y={ly} className="scatter__label">
                {h}
              </text>
            </g>
          );
        })}
      </svg>
      {hovered && (
        <div
          className="scatter__tip"
          role="tooltip"
          style={{
            left: `${(hovered.cx / W) * 100}%`,
            top: `${(hovered.cy / H) * 100}%`,
            transform: hovered.cx > W * 0.6 ? 'translate(calc(-100% - 12px), -50%)' : 'translate(12px, -50%)',
          }}
        >
          <strong>
            {hovered.r.creator.handle} · {hovered.r.cpa === null ? 'no purchases' : `${usd(hovered.r.cpa)} CPA`}
          </strong>
          <div>
            {hovered.r.result.purchases} purchases for {usd(hovered.r.creator.fee_usd)}.{' '}
            {hovered.r.cpa !== null && hovered.r.cpa > goal
              ? `At the ${usd(goal)} goal, that fee needs ${Math.ceil(hovered.r.creator.fee_usd / goal)}.`
              : `Beats the ${usd(goal)} goal.`}
          </div>
        </div>
      )}
    </div>
  );
}
