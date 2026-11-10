import { results, roster } from '../../data';
import { usd } from '../../lib/format';
import type { CreatorResult } from '../../lib/readout';
import { cpaBars, earlyResults } from '../../lib/states';
import { shortDate } from '../../lib/status';
import type { PoolInfo } from './pools';

/** Readout on a phone: a scatter doesn't read at 390px, so CPA by creator becomes a ranked list with the goal line. */
export function CpaRanked({ rows, goal, pools }: { rows: CreatorResult[]; goal: number; pools: PoolInfo[] }) {
  const pool = (id: string) => pools.find((p) => p.id === id);
  const { bars, goalAt } = cpaBars(
    rows.map((r) => ({ handle: r.creator.handle, cpa: r.cpa, pool: r.pool })),
    goal,
  );
  return (
    <section aria-label="CPA by creator" className="cpa-ranked phone-only">
      <div className="cpa-ranked__head">
        <h3 className="card-title">CPA by creator</h3>
        <span className="sub">Dashed: {usd(goal)} goal</span>
      </div>
      <ol>
        {bars.map((b) => {
          const p = pool(b.pool);
          return (
            <li key={b.handle} className={`pool--${p?.tone ?? 'custom'}`}>
              <div className="cpa-ranked__row">
                <strong>{b.handle}</strong>
                <span>
                  <strong>{b.cpa === null ? 'No purchases' : usd(b.cpa)}</strong> · <span className="pool-name">{p?.name}</span>
                </span>
              </div>
              <div className="cpa-ranked__track" aria-hidden="true">
                <span className="cpa-ranked__bar" style={{ width: `${b.width * 100}%` }}>
                  {b.offScale && b.cpa !== null && <span className="cpa-ranked__off">off scale ▸</span>}
                </span>
                <span className="cpa-ranked__goal" style={{ left: `${goalAt * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Pools as a tappable list on a phone; each opens to its creators and their CPA. */
export function PoolList({ rows, pools }: { rows: CreatorResult[]; pools: PoolInfo[] }) {
  return (
    <section aria-label="Where each creator goes next" className="card pool-list phone-only">
      <h3 className="card-title">Where each creator goes next</h3>
      {pools.map((p) => {
        const members = rows.filter((r) => r.pool === p.id).sort((a, b) => (a.cpa ?? Infinity) - (b.cpa ?? Infinity));
        return (
          <details key={p.id} className={`pool--${p.tone}`}>
            <summary>
              <span>
                <span className="pool-name">{p.name}</span> · {members.length}
                <span className="sub">{members.map((m) => m.creator.handle).join(', ')}</span>
              </span>
            </summary>
            <ul>
              {members.map((m) => (
                <li key={m.creator.handle}>
                  {m.creator.handle} <span className="sub">{m.cpa === null ? 'no purchases' : `${usd(m.cpa)} CPA`}</span>
                </li>
              ))}
              <li className="sub">Use next for: {p.useNextFor}</li>
            </ul>
          </details>
        );
      })}
    </section>
  );
}

/**
 * "Results still coming in" (docs/UX_SPEC.md): the verdict waits until every post has run 7 days, so early numbers
 * are labeled, not judged. Shown as of Dec 13, when 5 of the 8 sample posts have run 7 days.
 */
export const EARLY_TODAY = '2026-12-13';

export function EarlyResults({ goal }: { goal: number }) {
  const e = earlyResults(results, roster, EARLY_TODAY);
  return (
    <section aria-label="Early results" className="card early">
      <p className="early__note">
        <strong>
          Early results · {e.settled} of {e.total} posts have run 7 days.
        </strong>{' '}
        Pools are set when the last post, {e.last.handle} on {shortDate(e.last.posted)}, reaches 7 days on{' '}
        {shortDate(e.last.settles)}.
      </p>
      <p>
        So far: {e.cpaSoFar === null ? 'no purchases yet' : <><strong>{usd(e.cpaSoFar)}</strong> CPA</>} across{' '}
        {e.settled} creators, vs {usd(goal)} goal
      </p>
      <p className="sub">Numbers can still move as later posts settle, so there’s no verdict yet.</p>
    </section>
  );
}
