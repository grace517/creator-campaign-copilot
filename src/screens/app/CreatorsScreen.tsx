import { useState } from 'react';
import { Link } from 'react-router';
import { SAMPLE_CAMPAIGN_ID, results, roster } from '../../data';
import type { PoolId } from '../../data/schema';
import { POOL_RULE, creatorRows, customRule, missedTwice, poolChanges } from '../../lib/creators';
import { usd, usd2 } from '../../lib/format';
import { computeResults } from '../../lib/readout';
import { useBriefs } from '../../state/BriefContext';
import { useCampaigns } from '../../state/CampaignsContext';
import { useReadout } from '../../state/ReadoutContext';
import { useStartCampaign } from '../../state/useStartCampaign';
import { poolList } from '../readout/pools';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Every contracted creator, grouped into pools by their latest readout; start a campaign from any pool. */
export function CreatorsScreen() {
  const { briefFor } = useBriefs();
  const { all } = useCampaigns();
  const readout = useReadout();
  const startCampaign = useStartCampaign();
  const brief = briefFor(SAMPLE_CAMPAIGN_ID);
  const { rows: resultRows, targets } = computeResults(brief, results, roster, readout.customPools);
  const sample = all.find((c) => c.id === SAMPLE_CAMPAIGN_ID)!;
  const rows = creatorRows(roster, resultRows, { name: sample.name, month: MONTHS[+brief.window_start.slice(5, 7) - 1]! });
  const pools = poolList(readout.customPools);
  const [selected, setSelected] = useState<string | null>(null);
  // By pool order, then cheapest CPA; creators not in a readout yet go last.
  const rank = (pool: string | null) => {
    const i = pools.findIndex((p) => p.id === pool);
    return i === -1 ? pools.length : i;
  };
  const shown = (selected ? rows.filter((r) => r.pool === selected) : rows).sort(
    (a, b) => rank(a.pool) - rank(b.pool) || (a.lastCpa ?? Infinity) - (b.lastCpa ?? Infinity),
  );
  const pool = pools.find((p) => p.id === selected);
  const custom = readout.customPools.find((p) => p.id === selected);
  const members = selected ? rows.filter((r) => r.pool === selected) : [];
  const changes = [...missedTwice(resultRows, targets), ...poolChanges(resultRows, targets)];
  const poolName = (id: string | null) => pools.find((p) => p.id === id)?.name ?? '';
  const tone = (id: string | null) => pools.find((p) => p.id === id)?.tone ?? 'custom';

  return (
    <>
      <div className="screen-head">
        <div>
          <h1 className="page-title">Creators</h1>
          <p>Your contracted creators, grouped into pools by how they performed. Pools update after every readout.</p>
        </div>
        <button type="button" className="btn-secondary" disabled title="CSV import comes after the prototype">
          Import CSV
        </button>
      </div>

      <div className="filters" role="group" aria-label="Pools">
        <button type="button" className={`filter${selected === null ? ' is-active' : ''}`} aria-pressed={selected === null} onClick={() => setSelected(null)}>
          All {rows.length}
        </button>
        {pools.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`filter pool-tab pool--${p.tone}${selected === p.id ? ' is-active' : ''}`}
            aria-pressed={selected === p.id}
            onClick={() => setSelected(p.id)}
          >
            {p.name} {rows.filter((r) => r.pool === p.id).length}
            {p.custom ? ' · custom' : ''}
            {readout.saved.has(p.id) && <span className="sr-only">, saved</span>}
            {readout.saved.has(p.id) && <span aria-hidden="true"> ✓</span>}
          </button>
        ))}
        <Link to={`/campaigns/${SAMPLE_CAMPAIGN_ID}/readout#new-pool`} className="filter filter--dashed">
          + New pool
        </Link>
      </div>

      {pool && (
        <div className={`pool-banner pool--${pool.tone}`}>
          <div>
            <strong className="pool-banner__name">{pool.name}</strong> ·{' '}
            {custom ? customRule(custom) : POOL_RULE[pool.id as PoolId]}{' '}
            <span className="muted">Use for {pool.useNextFor.charAt(0).toLowerCase() + pool.useNextFor.slice(1)}</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={members.length === 0}
            onClick={() =>
              startCampaign({ pool: { id: pool.id, name: pool.name, handles: members.map((m) => m.creator.handle) } })
            }
          >
            Start a campaign with {members.length === 1 ? 'this creator' : `these ${members.length}`}
          </button>
        </div>
      )}

      <section className="card table-wrap" aria-label="Creators">
        <table className="home">
          <thead>
            <tr>
              <th scope="col">Creator</th>
              <th scope="col">Pool</th>
              <th scope="col">Niche</th>
              <th scope="col" className="num">
                Campaigns
              </th>
              <th scope="col" className="num">
                Last CPA
              </th>
              <th scope="col" className="num">
                Last cost per sign-up
              </th>
              <th scope="col" className="num">
                Fee
              </th>
              <th scope="col">Last campaign</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="roster__empty">
                  No creators in this pool yet.
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.creator.handle}>
                <th scope="row">{r.creator.handle}</th>
                <td>
                  {r.pool ? (
                    <span className={`pool-chip pool--${tone(r.pool)}`}>{poolName(r.pool)}</span>
                  ) : (
                    <span className="sub">Not in a readout yet</span>
                  )}
                </td>
                <td>{r.creator.niche}</td>
                <td className="num">{r.campaigns}</td>
                <td className="num">{r.lastCpa === null ? (r.campaigns === 0 ? <span className="tag tag--blue">new</span> : '–') : usd(r.lastCpa)}</td>
                <td className="num">{r.lastCps === null ? '–' : usd2(r.lastCps)}</td>
                <td className="num">{usd(r.creator.fee_usd)}</td>
                <td>{r.lastCampaign ?? '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {changes.length > 0 && (
        <section className="card history" aria-label="How a creator changes pools">
          <div className="history__head">
            <h2 className="card-title">How a creator changes pools</h2>
            <span className="sub">History is kept, so you can see the path</span>
          </div>
          {changes.map((ch) => (
            <div key={ch.handle} className="history__row">
              <strong>{ch.handle}</strong>{' '}
              {ch.before.pool && <span className={`pool-chip pool--${tone(ch.before.pool)}`}>{poolName(ch.before.pool)}</span>}{' '}
              <span className="sub">{ch.before.detail}</span> <span aria-label="then">→</span>{' '}
              <span className={`pool-chip pool--${tone(ch.after.pool)}`}>{poolName(ch.after.pool)}</span>{' '}
              <span className="sub">
                {sample.name}, {ch.after.detail}
              </span>
            </div>
          ))}
          <p className="sub history__p">
            Pool rules are set in Brand kit and apply to every readout. A creator’s pool is their latest campaign’s result.
          </p>
        </section>
      )}
    </>
  );
}
