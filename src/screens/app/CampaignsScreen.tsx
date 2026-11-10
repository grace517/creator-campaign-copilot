import { useState } from 'react';
import { Link } from 'react-router';
import { SAMPLE_CAMPAIGN_ID, results, roster, sampleCampaigns } from '../../data';
import { FILTERS, STEP_NAMES, sampleRow, startedRow, summaryRow, type FilterKey, type HomeRow } from '../../lib/campaigns';
import { usd } from '../../lib/format';
import { computeResults, verdict } from '../../lib/readout';
import { useBriefs } from '../../state/BriefContext';
import { useCampaigns } from '../../state/CampaignsContext';
import { useAllPicks } from '../../state/PicksContext';
import { useReadout } from '../../state/ReadoutContext';
import { useStartCampaign } from '../../state/useStartCampaign';

export function CampaignsScreen() {
  const { all } = useCampaigns();
  const { briefFor } = useBriefs();
  const picks = useAllPicks();
  const readout = useReadout();
  const startCampaign = useStartCampaign();
  const [filter, setFilter] = useState<FilterKey>('all');

  const sampleBrief = briefFor(SAMPLE_CAMPAIGN_ID);
  const { rows: resultRows, targets } = computeResults(sampleBrief, results, roster, readout.customPools);
  const converters = resultRows.filter((r) => r.pool === 'converters');
  const convertersCpa =
    converters.reduce((s, r) => s + r.creator.fee_usd, 0) / Math.max(1, converters.reduce((s, r) => s + r.result.purchases, 0));
  const pickedFor = (id: string) => roster.filter((c) => picks.get(id).picks.has(c.handle));

  const rows: HomeRow[] = all.map((c) => {
    if (c.kind === 'sample') {
      return sampleRow({
        id: c.id,
        name: c.name,
        picked: pickedFor(c.id),
        budget: sampleBrief.campaign_budget_usd,
        blendedCpa: verdict(resultRows, targets.cpa_usd).blendedCpa,
        goal: targets.cpa_usd,
        poolsSaved: readout.saved.size > 0,
      });
    }
    if (c.kind === 'started') {
      const b = briefFor(c.id);
      return startedRow({ id: c.id, name: c.name, picked: pickedFor(c.id), budget: b.campaign_budget_usd, hasOffer: !!b.offer });
    }
    return summaryRow(sampleCampaigns.find((s) => s.id === c.id)!);
  });
  const shown = rows.filter(FILTERS[filter].test);
  const startTo = (r: HomeRow) => {
    const step = ['brief', 'roster', 'drafts', 'status', 'readout'][r.step - 1];
    return `/campaigns/${r.id}/${step}`;
  };

  return (
    <>
      <div className="screen-head">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p>Each campaign shows its step and the one thing it needs from you next.</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => startCampaign()}>
          + New campaign
        </button>
      </div>

      <div className="filters" role="group" aria-label="Filter campaigns">
        {(Object.keys(FILTERS) as FilterKey[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`filter${filter === k ? ' is-active' : ''}`}
            aria-pressed={filter === k}
            onClick={() => setFilter(k)}
          >
            {FILTERS[k].label} ({rows.filter(FILTERS[k].test).length})
          </button>
        ))}
      </div>

      <section className="card table-wrap" aria-label="Campaigns">
        <table className="home">
          <thead>
            <tr>
              <th scope="col">Campaign</th>
              <th scope="col">Step</th>
              <th scope="col">Next for you</th>
              <th scope="col" className="num">
                Creators
              </th>
              <th scope="col" className="num">
                Committed
              </th>
              <th scope="col">Result</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="roster__empty">
                  No campaigns here.
                </td>
              </tr>
            )}
            {shown.map((r) => (
              <tr key={r.id}>
                <th scope="row">
                  <Link to={startTo(r)}>{r.name}</Link>
                </th>
                <td>
                  <span className="step-dots" role="img" aria-label={`Step ${r.step} of 5`}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <span key={i} className={i < r.step ? 'is-done' : i === r.step ? 'is-current' : ''} />
                    ))}
                  </span>{' '}
                  {STEP_NAMES[r.step - 1]}
                </td>
                <td className={r.needsYou ? 'text-amber' : undefined}>{r.next}</td>
                <td className="num">{r.creators ?? '–'}</td>
                <td className="num">
                  {usd(r.committed)} of {usd(r.budget)}
                </td>
                <td>{r.result ? <span className={`pill ${r.result.tone === 'warn' ? 'pill--amber' : 'pill--green'}`}>{r.result.text}</span> : '–'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="home-cards">
        <section className="card home-card" aria-label="Across campaigns this quarter">
          <h2 className="card-title">Across campaigns this quarter</h2>
          <div className="home-stats">
            <div>
              <div className="home-stat">{usd(convertersCpa)}</div>
              <div className="sub">CPA from Converters</div>
            </div>
            <div>
              <div className="home-stat">{usd(targets.cpa_usd)}</div>
              <div className="sub">Paid social CPA goal</div>
            </div>
            <div>
              <div className="home-stat">{converters.length}</div>
              <div className="sub">Creators in Converters</div>
            </div>
          </div>
        </section>
        <section className="card home-card" aria-label="Start from what worked">
          <h2 className="card-title">Start from what worked</h2>
          <p className="muted home-card__p">
            New campaigns can start from a saved pool, so the roster opens with proven creators already picked.
          </p>
          <div>
            <button
              type="button"
              className="btn-small btn-small--tall"
              disabled={converters.length === 0}
              onClick={() =>
                startCampaign({ pool: { id: 'converters', name: 'Converters', handles: converters.map((c) => c.creator.handle) } })
              }
            >
              Start a campaign from Converters
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
