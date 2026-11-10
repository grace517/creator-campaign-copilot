import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { results, roster } from '../../data';
import { usd } from '../../lib/format';
import {
  CUSTOM_METRICS,
  computeResults,
  convertingHooks,
  customPreview,
  poolStat,
  verdict,
  versusGoal,
  type CustomMetric,
  type CustomPool,
} from '../../lib/readout';
import { parseUsd } from '../../state/brief';
import { useBrief } from '../../state/BriefContext';
import { useReadout } from '../../state/ReadoutContext';
import { ScreenHead } from '../ScreenHead';
import { CampaignData } from './CampaignData';
import { poolList, type PoolInfo } from './pools';
import { Scatter } from './Scatter';

export function ReadoutScreen() {
  const { brief } = useBrief();
  const readout = useReadout();
  const { rows, targets } = useMemo(
    () => computeResults(brief, results, roster, readout.customPools),
    [brief, readout.customPools],
  );
  const pools = poolList(readout.customPools);
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

  return (
    <>
      <ScreenHead eyebrow="Sample results" title="Readout" />

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
        <Scatter rows={rows} goal={targets.cpa_usd} pools={pools} />
        <div className="verdict__foot">
          <span className="sub">Across: creator fee · Up: purchases</span>
          <span className="pool-legend">
            {pools.map((p) => (
              <span key={p.id} className={`pool--${p.tone}`}>
                <span className="pool-dot" aria-hidden="true" />
                {p.name}
              </span>
            ))}
          </span>
        </div>
      </section>

      <section aria-label="Creator pools" className="pools">
        <div className="pools__head">
          <h3 className="card-title">Where each creator goes next</h3>
          <span className="sub">Click a pool to see its creators in the table below. Saved pools filter the next roster.</span>
        </div>
        <div className="pools__cards">
          {pools.map((p) => {
            const members = rows.filter((r) => r.pool === p.id).sort((a, b) => (a.cpa ?? Infinity) - (b.cpa ?? Infinity));
            const active = poolFilter === p.id;
            return (
              <article key={p.id} className={`card pool-card pool--${p.tone}${active ? ' is-active' : ''}`}>
                <div className="pool-card__head">
                  <h4>{p.name}</h4>
                  <span className="pool-card__count">{members.length}</span>
                </div>
                <div className="pool-card__stat">{poolStat(p.id, members, targets, readout.customPools)}</div>
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

        <CustomPoolForm pools={pools} existing={readout.customPools} onSave={readout.addCustomPool} />

        <p className="rules">
          <strong>How pools are set.</strong> Beat: 10% or more better than the target. At par: within 10% either way.
          Missed: more than 10% worse. Targets come from the brief; reach has none, so it uses the campaign average. A
          creator joins the first pool they qualify for, in order: beat CPA (Converters), beat cost per lead (Lead
          builders), beat reach cost (Reach). Anyone who beats nothing goes to Test again on a first campaign, otherwise
          Don’t rebook. Custom pools use the same rule, checked in the order you set.
        </p>
      </section>

      <CampaignData rows={rows} targets={targets} pools={pools} poolFilter={poolFilter} onPoolFilter={setPoolFilter} />
    </>
  );
}

const AFTER_LABEL: Record<CustomPool['after'], string> = {
  first: 'First',
  converters: 'After Converters',
  lead_builders: 'After Lead builders',
  reach: 'After Reach',
};

function CustomPoolForm({
  pools,
  existing,
  onSave,
}: {
  pools: PoolInfo[];
  existing: CustomPool[];
  onSave: (p: CustomPool) => void;
}) {
  const { brief } = useBrief();
  const [name, setName] = useState('Sign-up drivers');
  const [metric, setMetric] = useState<CustomMetric>('cost_per_signup');
  const [targetText, setTargetText] = useState('$10.00 or less');
  const [after, setAfter] = useState<CustomPool['after']>('converters');
  const isPct = CUSTOM_METRICS[metric].unit === 'pct';
  const parsed = parseUsd(targetText.replace('%', '').replace(/ or (less|more)$/, ''));
  const target = parsed === null ? null : isPct ? parsed / 100 : parsed;
  const draft: CustomPool | null =
    target !== null && name.trim() ? { id: `custom-${name.trim().toLowerCase().replace(/\W+/g, '-')}`, name: name.trim(), metric, target, after } : null;
  const preview = draft ? customPreview(brief, results, roster, existing, draft) : null;
  const poolName = (id: string) => pools.find((p) => p.id === id)?.name ?? id;
  const unit = metric === 'cost_per_signup' ? 'per sign-up' : '';

  let previewText = 'Enter a name and a target to preview who this pool would take.';
  if (preview && draft) {
    const n = preview.beats.length;
    if (n === 0) previewText = 'No creator in this campaign beats this target.';
    else {
      const list = preview.beats.map((b) => `${b.handle}, ${b.value}${unit ? ` ${unit}` : ''}`).join('; ');
      const taken = preview.beats.filter((b) => b.placedIn !== draft.id);
      previewText = `${n} creator${n === 1 ? '' : 's'} ${n === 1 ? 'beats' : 'beat'} this target (${list})`;
      if (preview.members.length === 0) {
        previewText += `, but ${n === 1 ? 'that creator is' : 'they are'} already ${taken.map((t) => `a ${poolName(t.placedIn).replace(/s$/, '')}`).join(', ')}, so this pool would be empty.`;
      } else {
        previewText += `. This pool would take ${preview.members.join(', ')}.`;
      }
    }
    previewText += ' Same beat rule: 10% or more better than the target.';
  }

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
        <h4>+ Create a custom pool</h4>
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
        <span className="sub" role="status">
          Preview for this campaign: {previewText}
        </span>
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
