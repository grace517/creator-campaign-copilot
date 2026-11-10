import { Fragment, useState } from 'react';
import { pct, usd, usd2 } from '../../lib/format';
import type { Targets } from '../../lib/pools';
import {
  FUNNEL_STEPS,
  campaignTotals,
  funnel,
  verdict,
  weakestStep,
  type CreatorResult,
  type FunnelStepName,
} from '../../lib/readout';
import type { PoolInfo } from './pools';

type View = 'table' | 'funnel';
type GroupBy = 'none' | 'pool';

const STEP_LABEL: Record<FunnelStepName, string> = {
  impressions: 'Impressions',
  comments: 'Comments',
  leads: 'Leads',
  clicks: 'Clicks',
  purchases: 'Purchases',
};
const RATE_OF: Record<FunnelStepName, string> = {
  impressions: '',
  comments: 'of impressions',
  leads: 'of comments',
  clicks: 'of leads',
  purchases: 'of clicks',
};
const STANDING_LABEL = { beat: 'beat', at_par: 'at par', missed: 'missed' } as const;

/** Campaign data below the pools: Table and Funnel views, filtered by a pool card or creator, grouped by pool. */
export function CampaignData({
  rows,
  targets,
  pools,
  poolFilter,
  onPoolFilter,
  cpsIsGoal,
}: {
  rows: CreatorResult[];
  targets: Targets;
  pools: PoolInfo[];
  poolFilter: string | null;
  onPoolFilter: (id: string | null) => void;
  /** Whether the sign-up column's target is the brand's goal or the campaign average. */
  cpsIsGoal: boolean;
}) {
  const [view, setView] = useState<View>('table');
  const [creator, setCreator] = useState<string>('all');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const order = (r: CreatorResult) => pools.findIndex((p) => p.id === r.pool);
  const shown = rows
    .filter((r) => (poolFilter === null || r.pool === poolFilter) && (creator === 'all' || r.creator.handle === creator))
    .sort((a, b) => order(a) - order(b) || (a.cpa ?? Infinity) - (b.cpa ?? Infinity));
  const poolName = (id: string) => pools.find((p) => p.id === id)?.name ?? id;
  const tone = (id: string) => pools.find((p) => p.id === id)?.tone ?? 'custom';
  const groups = groupBy === 'pool' ? pools.filter((p) => shown.some((r) => r.pool === p.id)) : [null];

  const outlier = verdict(rows, targets.cpa_usd).outliers[0];
  const weak = outlier ? weakestStep(outlier, rows) : null;

  return (
    <section id="campaign-data" aria-label="Campaign data" className="card data">
      <div className="data__bar">
        <div className="data__left">
          <div role="tablist" aria-label="Views" className="tabs">
            {(['table', 'funnel'] as View[]).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                className={view === v ? 'tab is-active' : 'tab'}
                onClick={() => {
                  setView(v);
                  if (v === 'funnel' && groupBy === 'none' && poolFilter === null) setGroupBy('pool');
                }}
              >
                {v === 'table' ? 'Table' : 'Funnel'}
              </button>
            ))}
          </div>
          <span className="sub sub--13">
            Showing {shown.length} of {rows.length} creators
          </span>
        </div>
        <div className="data__filters">
          {poolFilter ? (
            <button type="button" className={`filter pool-filter pool--${tone(poolFilter)}`} onClick={() => onPoolFilter(null)}>
              Pool: {poolName(poolFilter)} <span aria-hidden="true">✕</span>
              <span className="sr-only">, clear</span>
            </button>
          ) : (
            <label className="filter-select">
              <span className="sr-only">Pool</span>
              <select className="filter" value="" onChange={(e) => onPoolFilter(e.target.value || null)}>
                <option value="">Pool: All</option>
                {pools.map((p) => (
                  <option key={p.id} value={p.id}>
                    Pool: {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="filter-select">
            <span className="sr-only">Creators</span>
            <select className="filter" value={creator} onChange={(e) => setCreator(e.target.value)}>
              <option value="all">Creators: All</option>
              {rows.map((r) => (
                <option key={r.creator.handle} value={r.creator.handle}>
                  {r.creator.handle}
                </option>
              ))}
            </select>
          </label>
          <label className="filter-select">
            <span className="sr-only">Group by</span>
            <select className="filter" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
              <option value="none">Group by: None</option>
              <option value="pool">Group by: Pool</option>
            </select>
          </label>
        </div>
      </div>

      <div className="table-wrap">
        {view === 'table' ? (
          <table className="results">
            <thead>
              <tr>
                <th scope="col">Creator</th>
                <th scope="col">Pool</th>
                <th scope="col">Hook</th>
                <th scope="col" className="num">Fee</th>
                <th scope="col" className="num">Impressions</th>
                <th scope="col" className="num">Leads</th>
                <th scope="col" className="num">Purchases</th>
                <th scope="col" className="num">Email/SMS sign-ups</th>
                <th scope="col" className="goal">
                  <div>CPA</div>
                  <div className="goal__target">Goal {usd(targets.cpa_usd)}</div>
                </th>
                <th scope="col" className="goal">
                  <div>Cost per sign-up</div>
                  <div className="goal__target">
                    {cpsIsGoal ? 'Goal' : 'Average'} {usd2(targets.cps_usd)}
                  </div>
                </th>
                <th scope="col" className="goal">
                  <div>Per 1,000 impressions</div>
                  <div className="goal__target">Average {usd2(targets.cpm_usd)}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <Fragment key={g?.id ?? 'all'}>
                  {g && (
                    <tr className="group-row">
                      <th colSpan={11} scope="colgroup" className={`pool--${g.tone}`}>
                        {g.name}
                      </th>
                    </tr>
                  )}
                  {shown
                    .filter((r) => !g || r.pool === g.id)
                    .map((r) => (
                      <tr key={r.creator.handle}>
                        <th scope="row">{r.creator.handle}</th>
                        <td>
                          <span className={`pool-chip pool--${tone(r.pool)}`}>{poolName(r.pool)}</span>
                        </td>
                        <td className="hook">{r.result.hook_used}</td>
                        <td className="num">{usd(r.creator.fee_usd)}</td>
                        <td className="num">{r.result.impressions.toLocaleString('en-US')}</td>
                        <td className="num">{r.result.dms_sent.toLocaleString('en-US')}</td>
                        <td className="num">{r.result.purchases}</td>
                        <td className="num">{r.result.email_sms_signups}</td>
                        <GoalCell value={r.cpa} fmt={usd} standing={r.standing.cpa} decided={r.decidedBy === 'cpa'} />
                        <GoalCell value={r.cps} fmt={usd2} standing={r.standing.cps} decided={r.decidedBy === 'cps'} />
                        <GoalCell value={r.cpm} fmt={usd2} standing={r.standing.cpm} decided={r.decidedBy === 'cpm'} />
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="results funnel">
            <thead>
              <tr>
                <th scope="col">Creator</th>
                {FUNNEL_STEPS.map((s) => (
                  <th key={s} scope="col">
                    {STEP_LABEL[s]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <FunnelRow label="Campaign total" steps={funnel(campaignTotals(rows))} total />
              {shown.map((r) => (
                <FunnelRow
                  key={r.creator.handle}
                  label={r.creator.handle}
                  pool={{ name: poolName(r.pool), tone: tone(r.pool) }}
                  steps={funnel(r.result)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="data__foot sub">
        {view === 'table'
          ? 'The outlined value is the one that placed each creator in their pool. Funnel view shows comments, leads, clicks, and purchases as steps.'
          : `Each step shows the count and its rate from the step before.${
              outlier && weak
                ? ` The weakest step is where to look: ${outlier.creator.handle}’s audience saw and commented, but only ${pct(weak.rate)} of ${RATE_OF[weak.step].replace('of ', '')} became ${STEP_LABEL[weak.step].toLowerCase()}, against ${pct(weak.campaignRate)} across the campaign.`
                : ''
            }`}
      </div>
    </section>
  );
}

function GoalCell({
  value,
  fmt,
  standing,
  decided,
}: {
  value: number | null;
  fmt: (n: number) => string;
  standing: 'beat' | 'at_par' | 'missed' | null;
  decided: boolean;
}) {
  return (
    <td className="goal">
      <div className={`goal__cell${standing === 'beat' ? ' is-beat' : ''}${decided ? ' is-decided' : ''}`}>
        <span className="goal__value">{value === null ? '–' : fmt(value)}</span>
        {standing && <span className={`goal__standing goal__standing--${standing}`}>{STANDING_LABEL[standing]}</span>}
        {decided && <span className="sr-only">, placed them in their pool</span>}
      </div>
    </td>
  );
}

function FunnelRow({
  label,
  steps,
  pool,
  total,
}: {
  label: string;
  steps: ReturnType<typeof funnel>;
  pool?: { name: string; tone: string };
  total?: boolean;
}) {
  return (
    <tr className={total ? 'funnel__total' : undefined}>
      <th scope="row">
        <div>{label}</div>
        {pool && <span className={`pool-chip pool--${pool.tone}`}>{pool.name}</span>}
      </th>
      {FUNNEL_STEPS.map((s) => (
        <td key={s}>
          <div className="strong">{steps[s].count.toLocaleString('en-US')}</div>
          {steps[s].rate !== null && (
            <div className="sub">
              {pct(steps[s].rate!)} {RATE_OF[s]}
            </div>
          )}
        </td>
      ))}
    </tr>
  );
}
