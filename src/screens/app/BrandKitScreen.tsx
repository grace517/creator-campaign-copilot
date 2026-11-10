import { useId, useState } from 'react';
import { Link } from 'react-router';
import { SAMPLE_CAMPAIGN_ID } from '../../data';
import type { PoolId } from '../../data/schema';
import { displayUrl } from '../../lib/checks';
import { POOL_RULE_SHORT, customRule } from '../../lib/creators';
import { learnedRulings } from '../../lib/drafts';
import { RULING_KINDS } from '../../lib/rulings';
import { useBrandKit } from '../../state/BrandKitContext';
import { parseUsd, type SecondaryMetric } from '../../state/brief';
import { useDrafts } from '../../state/DraftsContext';
import { useReadout } from '../../state/ReadoutContext';
import { poolList } from '../readout/pools';

const SECONDARY: { metric: SecondaryMetric; label: (t: number | null) => string }[] = [
  {
    metric: 'email_sms_signups',
    label: (t) => (t === null ? 'Sign-ups: cost per email or SMS sign-up vs campaign average' : `Sign-ups: under $${t.toFixed(2)} per email or SMS sign-up`),
  },
  { metric: 'reach', label: () => 'Reach: cost per 1,000 impressions vs campaign average' },
];

/** Set once: every new campaign starts from these, and every check runs against them. */
export function BrandKitScreen() {
  const { kit, update } = useBrandKit();
  const readout = useReadout();
  const { actions } = useDrafts();
  const learned = learnedRulings(actions.rulings);
  const pools = poolList(readout.customPools);
  const lastChanged =
    kit.last_changed === 'now'
      ? 'Last changed just now by you'
      : `Last changed ${new Date(`${kit.last_changed}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })} by you`;

  return (
    <>
      <div className="screen-head">
        <div>
          <h1 className="page-title">Brand kit</h1>
          <p>Set once. Every new campaign starts from these, and every check runs against them.</p>
        </div>
        <span className="sub" role="status">
          {lastChanged}
        </span>
      </div>

      <div className="kit-grid">
        <section className="card kit-card" aria-label="Voice and disclosure">
          <h2 className="card-title">Voice and disclosure</h2>
          <TextSetting label="Brand voice" value={kit.voice} parse={(s) => s.trim() || null} onCommit={(voice) => update({ voice })} error="Describe the voice in a few words." />
          <TextSetting
            label="Disclosure"
            value={`${kit.disclosure}, ${kit.disclosure_placement}`}
            parse={(s) => {
              const [tag, ...rest] = s.split(',');
              const t = tag?.trim() ?? '';
              return /^(#\w+|paid partnership)$/i.test(t) ? { tag: t, placement: rest.join(',').trim() || kit.disclosure_placement } : null;
            }}
            onCommit={(d) => update({ disclosure: d.tag, disclosure_placement: d.placement })}
            format={(v) => v}
            error="Start with the tag, like #ad, then where it goes."
            hint="The disclosure check accepts this tag, #ad, #sponsored, or “paid partnership” anywhere in a message."
          />
          <TextSetting
            label="DM length limit"
            value={`${kit.dm_max_chars} characters`}
            parse={(s) => {
              const n = Number(s.replace(/[^\d]/g, ''));
              return n >= 50 && n <= 2000 ? n : null;
            }}
            onCommit={(dm_max_chars) => update({ dm_max_chars })}
            format={(v) => v}
            error="Enter a limit between 50 and 2,000 characters."
          />
        </section>

        <section className="card kit-card" aria-label="Goals">
          <h2 className="card-title">Goals</h2>
          <TextSetting
            label="Paid social CPA to beat"
            value={`$${kit.paid_social_cpa_benchmark_usd} per purchase`}
            parse={parseUsd}
            onCommit={(paid_social_cpa_benchmark_usd) => update({ paid_social_cpa_benchmark_usd })}
            format={(v) => v}
            error="Enter your paid social cost per purchase, like $65."
          />
          <p className="sub">
            Entered by you. Connect your ad account to keep it current: spend divided by purchases, last 90 days.{' '}
            <button type="button" className="btn-small" disabled title="Ad account connections come after the prototype">
              Connect ad account
            </button>
          </p>
          <label className="field">
            Default secondary goal
            <select
              value={kit.secondary_goal.metric}
              onChange={(e) => {
                const metric = e.target.value as SecondaryMetric;
                update({ secondary_goal: { metric, target: null } });
              }}
            >
              {SECONDARY.map((o) => (
                <option key={o.metric} value={o.metric}>
                  {o.label(kit.secondary_goal.metric === o.metric ? kit.secondary_goal.target : null)}
                </option>
              ))}
            </select>
          </label>
          <p className="sub">Goals seed every new brief. A campaign already running keeps the goals it was briefed with.</p>
        </section>
      </div>

      <section className="card kit-card" aria-label="Claims">
        <div className="kit-card__head">
          <h2 className="card-title">Claims</h2>
          <span className="sub">Checks use these exactly; the AI also flags paraphrases of banned claims</span>
        </div>
        <ClaimList kind="approved" items={kit.approved_claims} onChange={(approved_claims) => update({ approved_claims })} />
        <ClaimList kind="banned" items={kit.banned_claims} onChange={(banned_claims) => update({ banned_claims })} />
        {learned.length > 0 && (
          <div className="kit-learned">
            <div className="label label--spaced">What the claim check learned from your rulings</div>
            <ul>
              {learned.map((l) => (
                <li key={l.phrase}>
                  <strong>“{l.phrase}”</strong> · {RULING_KINDS[l.ruling].label}
                  <span className="sub"> · ruled on Drafts, from {l.handle}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="card kit-card" aria-label="Pools">
        <div className="kit-card__head">
          <h2 className="card-title">Pools</h2>
          <Link to={`/campaigns/${SAMPLE_CAMPAIGN_ID}/readout#new-pool`} className="btn-small">
            + New pool
          </Link>
        </div>
        <p className="sub">
          Checked in this order after every readout; a creator joins the first pool they qualify for. Beat: 10% or more
          better than the target.
        </p>
        <ol className="kit-pools">
          {pools.map((p, i) => {
            const custom = readout.customPools.find((c) => c.id === p.id);
            return (
              <li key={p.id}>
                <span className="kit-pools__n">{custom ? '+' : i + 1}</span>
                <span className={`pool-chip pool-chip--wide pool--${p.tone}`}>{p.name}</span>
                <span>{custom ? customRule(custom) : POOL_RULE_SHORT[p.id as PoolId]}</span>
                <span className="muted">{custom ? `Custom · checked ${custom.after === 'first' ? 'first' : `after ${pools.find((x) => x.id === custom.after)?.name}`}` : p.useNextFor}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="card kit-card table-wrap" aria-label="Products">
        <h2 className="card-title">Products</h2>
        <table className="home">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Link</th>
              <th scope="col">Default offer</th>
            </tr>
          </thead>
          <tbody>
            {kit.products.map((p) => (
              <tr key={p.name}>
                <th scope="row">{p.name}</th>
                <td>{displayUrl(p.link)}</td>
                <td>{p.default_offer}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

/** A text setting that commits on every edit that parses, and says what's expected when it doesn't. */
function TextSetting<T>({
  label,
  value,
  parse,
  onCommit,
  format,
  error,
  hint,
}: {
  label: string;
  value: string;
  parse: (s: string) => T | null;
  onCommit: (v: T) => void;
  format?: (v: string) => string;
  error: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const id = useId();
  return (
    <label className="field">
      {label}
      <input
        type="text"
        value={draft ?? (format ? format(value) : value)}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? id : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          const v = parse(e.target.value);
          if (v !== null) {
            setInvalid(false);
            onCommit(v);
          }
        }}
        onBlur={() => {
          if (draft !== null && parse(draft) === null) setInvalid(true);
          else setDraft(null);
        }}
      />
      {hint && <span className="field__hint">{hint}</span>}
      {invalid && (
        <span id={id} className="field__error">
          {error}
        </span>
      )}
    </label>
  );
}

function ClaimList({ kind, items, onChange }: { kind: 'approved' | 'banned'; items: string[]; onChange: (v: string[]) => void }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const labelId = useId();
  const label = kind === 'approved' ? 'Approved' : 'Banned';
  const add = () => {
    const t = text.trim();
    if (t && !items.some((i) => i.toLowerCase() === t.toLowerCase())) onChange([...items, t]);
    setText('');
    setAdding(false);
  };
  return (
    <div>
      <div className="label label--spaced" id={labelId}>
        {label}
      </div>
      <ul className="chips" aria-labelledby={labelId}>
        {items.map((c) => (
          <li key={c} className={`chip chip--removable ${kind === 'approved' ? 'chip--green' : 'chip--red'}`}>
            {c}
            <button
              type="button"
              aria-label={`Remove ${c}`}
              disabled={items.length === 1}
              title={items.length === 1 ? `Keep at least one ${kind} claim` : undefined}
              onClick={() => onChange(items.filter((i) => i !== c))}
            >
              ✕
            </button>
          </li>
        ))}
        <li>
          {adding ? (
            <form
              className="chip-add"
              onSubmit={(e) => {
                e.preventDefault();
                add();
              }}
            >
              <input
                autoFocus
                type="text"
                aria-label={`New ${kind} claim`}
                value={text}
                maxLength={120}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
              />
              <button type="submit" className="btn-small">
                Add
              </button>
            </form>
          ) : (
            <button type="button" className="chip chip--add" onClick={() => setAdding(true)}>
              + Add
            </button>
          )}
        </li>
      </ul>
    </div>
  );
}
