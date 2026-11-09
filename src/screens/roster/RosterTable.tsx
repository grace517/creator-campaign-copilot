import { Fragment } from 'react';
import type { Creator } from '../../data/schema';
import { compact, pct, usd, usd2 } from '../../lib/format';
import { cpaWarning, isNew } from '../../lib/roster';
import { usePicks } from '../../state/PicksContext';

/** Anchor id for a creator's row, so warnings can link to it. */
export const rowId = (handle: string) => `row-${handle.slice(1).replace(/\./g, '-')}`;

export function RosterTable({
  rows,
  benchmark,
  gapGroup,
  gapHandles,
}: {
  rows: Creator[];
  benchmark: number;
  gapGroup: string | null;
  gapHandles: ReadonlySet<string>;
}) {
  const { picks, kept, toggle, keep } = usePicks();
  return (
    <div className="card table-wrap">
      <table className="roster">
        <thead>
          <tr>
            <th scope="col" className="roster__pick">
              Pick
            </th>
            <th scope="col">Creator</th>
            <th scope="col">Past CPA vs {usd(benchmark)}</th>
            <th scope="col">Past CPL</th>
            <th scope="col">DM to purchase</th>
            <th scope="col">Engagement</th>
            <th scope="col" className="roster__fee">
              Fee
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="roster__empty">
                No creators match these filters.
              </td>
            </tr>
          )}
          {rows.map((c) => {
            const picked = picks.has(c.handle);
            const warn = picked && !kept.has(c.handle) ? cpaWarning(c, benchmark) : null;
            const fresh = isNew(c);
            return (
              <Fragment key={c.handle}>
                <tr id={rowId(c.handle)} className={warn ? 'is-flagged' : undefined}>
                  <td className="roster__pick">
                    <input
                      type="checkbox"
                      aria-label={`Pick ${c.handle}`}
                      checked={picked}
                      onChange={() => toggle(c.handle)}
                    />
                  </td>
                  <td>
                    <div className="strong">{c.handle}</div>
                    <div className="sub">
                      {c.niche} · {compact(c.followers)}
                      {c.is_backup ? ' · backup' : ''}
                    </div>
                    {gapGroup && gapHandles.has(c.handle) && (
                      <div className="tag tag--blue tag--block">Adds a non-{gapGroup} niche</div>
                    )}
                  </td>
                  <td>
                    {fresh || c.past_cpa_usd === null ? (
                      <span className="tag tag--blue">new</span>
                    ) : (
                      <span className={`strong ${c.past_cpa_usd > benchmark ? 'text-red' : 'text-green'}`}>
                        {usd(c.past_cpa_usd)}
                        <span className="sr-only">
                          {c.past_cpa_usd > benchmark ? ', over the benchmark' : ', at or under the benchmark'}
                        </span>
                      </span>
                    )}
                  </td>
                  <td>{c.past_cpl_usd === null ? '–' : usd2(c.past_cpl_usd)}</td>
                  <td>{c.past_dm_to_purchase_rate === null ? '–' : pct(c.past_dm_to_purchase_rate)}</td>
                  <td className="muted">{c.past_engagement_rate === null ? '–' : pct(c.past_engagement_rate)}</td>
                  <td className="roster__fee">{usd(c.fee_usd)}</td>
                </tr>
                {warn && (
                  <tr className="roster__warn-row">
                    <td />
                    <td colSpan={6}>
                      <div className="warning" role="note">
                        <span>
                          Picked, but past CPA of {usd(c.past_cpa_usd!)} is {warn.multiple}x your {usd(benchmark)}{' '}
                          benchmark. At that rate, the {usd(c.fee_usd)} fee buys about {warn.expectedPurchases}{' '}
                          purchases.
                        </span>
                        <span className="warning__actions">
                          <button type="button" className="btn-warning" onClick={() => toggle(c.handle)}>
                            Unpick
                          </button>
                          <button type="button" className="btn-link-warning" onClick={() => keep(c.handle)}>
                            Keep anyway
                          </button>
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
