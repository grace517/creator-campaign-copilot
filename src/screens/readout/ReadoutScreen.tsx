import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { InfoTip } from '../../components/InfoTip';
import { SampleStatePicker, useSampleState } from '../../components/SampleState';
import { results, roster } from '../../data';
import { usd } from '../../lib/format';
import {
  CUSTOM_METRICS,
  computeResults,
  convertingHooks,
  poolStat,
  verdict,
  versusGoal,
  type CustomMetric,
  type CustomPool,
} from '../../lib/readout';
import { cpsFromGoal } from '../../lib/pools';
import { parseUsd } from '../../state/brief';
import { useBrief } from '../../state/BriefContext';
import { useReadout } from '../../state/ReadoutContext';
import { ScreenHead } from '../ScreenHead';
import { CampaignData } from './CampaignData';
import { CpaRanked, EarlyResults, PoolList } from './PhoneReadout';
import { poolList } from './pools';
import { Scatter } from './Scatter';

export function ReadoutScreen() {
  const { brief } = useBrief();
  const readout = useReadout();
  const { rows, targets } = useMemo(
    () => computeResults(brief, results, roster, readout.customPools),
    [brief, readout.customPools],
  );
  const pools = poolList(readout.customPools);
  // A pool with no creators this campaign is noise: show only pools someone landed in.
  const shownPools = pools.filter((p) => rows.some((r) => r.pool === p.id));
  const emptyPools = pools.filter((p) => !shownPools.includes(p));
  const v = verdict(rows, targets.cpa_usd);
  const hooks = convertingHooks(rows);
  const [poolFilter, setPoolFilter] = useState<string | null>(null);
  const hooksUsed = hooks.length > 0 && hooks.every((h) => readout.hooksForNextBrief.includes(h));
  const { hash } = useLocation();
  // "+ New pool" on Creators and Brand kit links here (#new-pool): bring the form into view and focus it.
  useEffect(() => {
    if (hash !== '#new-pool') return;
    const form = document.getElementById('new-pool');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    form?.querySelector('input')?.focus({ preventScroll: true });
  }, [hash]);

  const showPool = (id: string) => {
    setPoolFilter(id);
    document.getElementById('campaign-data')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const preview = useSampleState('readout');
  if (preview === 'early') {
    return (
      <>
        <ScreenHead eyebrow="Sample results" title="Readout" />
        <SampleStatePicker screen="readout" />
        <EarlyResults goal={targets.cpa_usd} />
      </>
    );
  }

  return (
    <>
      <ScreenHead eyebrow="Sample results" title="Readout" />
      <SampleStatePicker screen="readout" />

      <section aria-label="Verdict" className="card verdict">
        <h3 className="verdict__headline">{v.headline}</h3>
        <div className="verdict__facts">
          {v.cpaWithout !== null && (
            <span>
              Without {v.outliers.map((o) => o.creator.handle).join(' and ')}: <strong>{usd(v.cpaWithout)}</strong> CPA vs{' '}
              <strong>{usd(v.goal)}</strong> goal
            </span>
          )}
          <span>
            {v.outliers.length ? `With ${v.outliers.map((o) => o.creator.handle).join(' and ')}: ` : 'Blended: '}
            <strong>{usd(v.blendedCpa)}</strong>, {versusGoal(v.blendedCpa, v.goal)}
          </span>
          <span>
            <strong>{v.purchases.toLocaleString('en-US')}</strong> purchases
          </span>
          {hooks.length > 0 && (
            <span>
              Hooks that converted:{' '}
              {hooks.map((h, i) => (
                <span key={h}>
                  {i > 0 && ', '}
                  <strong>{h}</strong>
                </span>
              ))}{' '}
              <span className="muted">(tagged from each post after it ran)</span>{' '}
              {hooksUsed ? (
                <span className="text-green" role="status">
                  ✓ Saved for the next brief
                </span>
              ) : (
                <button type="button" className="btn-link" onClick={() => readout.useHooks(hooks)}>
                  Use in next brief
                </button>
              )}
            </span>
          )}
        </div>
        <div className="desktop-only">
          <Scatter rows={rows} goal={targets.cpa_usd} pools={pools} />
        </div>
        <div className="verdict__foot desktop-only">
          <span className="sub">Across: creator fee · Up: purchases</span>
          <span className="pool-legend">
            {shownPools.map((p) => (
              <span key={p.id} className={`pool--${p.tone}`}>
                <span className="pool-dot" aria-hidden="true" />
                {p.name}
              </span>
            ))}
          </span>
        </div>
      </section>

      <CpaRanked rows={rows} goal={targets.cpa_usd} pools={pools} />
      <PoolList rows={rows} pools={shownPools} />
      <p className="card phone-only phone-note">See the full table, the funnel, and custom pools on desktop.</p>

      <section aria-label="Creator pools" className="pools desktop-only">
        <div className="pools__head">
          <h3 className="card-title">Where each creator goes next</h3>
          <span className="sub">Click a pool to see its creators in the table below. Saved pools filter the next roster.</span>
        </div>
        <div className="pools__cards">
          {shownPools.map((p) => {
            const members = rows.filter((r) => r.pool === p.id).sort((a, b) => (a.cpa ?? Infinity) - (b.cpa ?? Infinity));
            const active = poolFilter === p.id;
            return (
              <article key={p.id} className={`card pool-card pool--${p.tone}${active ? ' is-active' : ''}`}>
                <div className="pool-card__head">
                  <h4>{p.name}</h4>
                  <span className="pool-card__count">{members.length}</span>
                </div>
                <div className="pool-card__stat">{poolStat(p.id, members, targets, readout.customPools, cpsFromGoal(brief))}</div>
                <div className="sub">{members.map((m) => m.creator.handle).join(', ') || 'No one this campaign'}</div>
                <div className="sub sub--13">
                  <span className="muted">Use next for:</span> <span className="text-ink">{p.useNextFor}</span>
                </div>
                <div className="pool-card__actions">
                  {members.length > 0 &&
                    (active ? (
                      <a href="#campaign-data" className="pool-btn pool-btn--active" onClick={(e) => { e.preventDefault(); showPool(p.id); }}>
                        Showing in table ↓
                      </a>
                    ) : (
                      <a href="#campaign-data" className="pool-btn" onClick={(e) => { e.preventDefault(); showPool(p.id); }}>
                        View {members.length} in table
                      </a>
                    ))}
                  {readout.saved.has(p.id) ? (
                    <span className="sub text-green" role="status">
                      ✓ Saved
                    </span>
                  ) : (
                    <button type="button" className="btn-small" disabled={members.length === 0} onClick={() => readout.savePool(p.id)}>
                      Save pool
                    </button>
                  )}
                  {p.custom && (
                    <button type="button" className="btn-link" onClick={() => readout.removeCustomPool(p.id)}>
                      Remove
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {emptyPools.length > 0 && (
          <p className="sub pools__empty">
            No creators this campaign:{' '}
            {emptyPools.map((p, i) => (
              <span key={p.id}>
                {i > 0 && ', '}
                {p.name}
                {p.custom && (
                  <>
                    {' '}
                    (<button type="button" className="btn-link" onClick={() => readout.removeCustomPool(p.id)}>
                      Remove<span className="sr-only"> {p.name}</span>
                    </button>)
                  </>
                )}
              </span>
            ))}
          </p>
        )}

        <CustomPoolForm existing={readout.customPools} onSave={readout.addCustomPool} />

      </section>

      <CampaignData
        className="desktop-only"
        rows={rows}
        targets={targets}
        pools={shownPools}
        poolFilter={poolFilter}
        onPoolFilter={setPoolFilter}
        cpsIsGoal={cpsFromGoal(brief)}
      />
    </>
  );
}

const AFTER_LABEL: Record<CustomPool['after'], string> = {
  first: 'First',
  converters: 'After Converters',
  list_builders: 'After List builders',
  reach: 'After Reach',
};

function CustomPoolForm({ existing, onSave }: { existing: CustomPool[]; onSave: (p: CustomPool) => void }) {
  const [name, setName] = useState('Strong closers');
  const [metric, setMetric] = useState<CustomMetric>('dm_to_purchase');
  const [targetText, setTargetText] = useState('7% or more');
  const [after, setAfter] = useState<CustomPool['after']>('converters');
  const isPct = CUSTOM_METRICS[metric].unit === 'pct';
  const parsed = parseUsd(targetText.replace('%', '').replace(/ or (less|more)$/, ''));
  const target = parsed === null ? null : isPct ? parsed / 100 : parsed;
  const draft: CustomPool | null =
    target !== null && name.trim() ? { id: `custom-${name.trim().toLowerCase().replace(/\W+/g, '-')}`, name: name.trim(), metric, target, after } : null;
  return (
    <form
      id="new-pool"
      className="card custom-pool"
      aria-label="Create a custom pool"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft && !existing.some((p) => p.id === draft.id)) onSave(draft);
      }}
    >
      <div className="custom-pool__head">
        <div className="custom-pool__title">
          <h4>+ Create a custom pool</h4>
          <InfoTip label="How pools are set">
            <strong>How pools are set.</strong> Beat: 10% or more better than the target. At par: within 10% either way.
            Missed: more than 10% worse. Targets come from the brief; a goal with no target, like reach, uses the campaign average. A
            creator joins the first pool they qualify for, in order: beat CPA (Converters), beat cost per sign-up (List
            builders), beat reach cost (Reach). Anyone who beats nothing goes to Test again on a first campaign,
            otherwise Don’t rebook. Custom pools use the same rule, checked in the order you set.
          </InfoTip>
        </div>
        <span className="sub">Saved to your brand, applied to every future readout</span>
      </div>
      <div className="custom-pool__fields">
        <label className="field">
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Metric
          <select
            value={metric}
            onChange={(e) => {
              const m = e.target.value as CustomMetric;
              setMetric(m);
              setTargetText(CUSTOM_METRICS[m].unit === 'pct' ? '7% or more' : '$10.00 or less');
            }}
          >
            {(Object.keys(CUSTOM_METRICS) as CustomMetric[]).map((m) => (
              <option key={m} value={m}>
                {CUSTOM_METRICS[m].label}
              </option>
            ))}
            <option disabled>Content reused as an ad (no data yet)</option>
          </select>
        </label>
        <label className="field">
          Target
          <input type="text" value={targetText} onChange={(e) => setTargetText(e.target.value)} aria-invalid={target === null || undefined} />
        </label>
        <label className="field">
          Checked
          <select value={after} onChange={(e) => setAfter(e.target.value as CustomPool['after'])}>
            {(Object.keys(AFTER_LABEL) as CustomPool['after'][]).map((a) => (
              <option key={a} value={a}>
                {AFTER_LABEL[a]}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="custom-pool__foot">
        <button
          type="submit"
          className="btn-small"
          disabled={!draft || existing.some((p) => p.id === draft.id)}
        >
          {draft && existing.some((p) => p.id === draft.id) ? 'Saved to brand' : 'Save to brand'}
        </button>
      </div>
    </form>
  );
}
