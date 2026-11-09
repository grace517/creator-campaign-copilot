import { useId, useState } from 'react';
import { usd } from '../../lib/format';
import { displayUrl } from '../../lib/checks';
import { useBrief } from '../../state/BriefContext';
import { formatWindow, parseLink, parseUsd, parseWindow, type SecondaryMetric } from '../../state/brief';

/**
 * A text field that shows a formatted value, accepts free typing, and commits to the brief on every
 * edit that parses. An edit that doesn't parse keeps the last good value and says what's expected on blur.
 */
function ParsedField<T>({
  label,
  value,
  format,
  parse,
  commit,
  error,
  hint,
  wide,
}: {
  label: string;
  value: T;
  format: (v: T) => string;
  parse: (s: string) => T | null;
  commit: (v: T) => void;
  error: string;
  hint?: string;
  wide?: boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const errorId = useId();
  const hintId = useId();
  const describedBy = [hint ? hintId : '', invalid ? errorId : ''].filter(Boolean).join(' ') || undefined;
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      {label}
      <input
        type="text"
        value={draft ?? format(value)}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          setDraft(e.target.value);
          const parsed = parse(e.target.value);
          if (parsed !== null) {
            setInvalid(false);
            commit(parsed);
          }
        }}
        onBlur={() => {
          if (draft !== null && parse(draft) === null) setInvalid(true);
          else setDraft(null);
        }}
      />
      {hint && (
        <span id={hintId} className="field__hint">
          {hint}
        </span>
      )}
      {invalid && (
        <span id={errorId} className="field__error">
          {error}
        </span>
      )}
    </label>
  );
}

const SECONDARY_OPTIONS: { metric: SecondaryMetric; label: (target: number | null) => string }[] = [
  { metric: 'cpl_usd', label: (t) => `Leads: under $${(t ?? 4).toFixed(2)} per lead` },
  { metric: 'email_sms_signups', label: () => 'Email and SMS sign-ups' },
  { metric: 'reach', label: () => 'Reach' },
];

export function BriefFields() {
  const { brief, update } = useBrief();
  // Remember the lead target so switching away from leads and back restores it.
  const [leadTarget, setLeadTarget] = useState(brief.secondary_goal.target ?? 4);
  const exampleCode = 'NURSE20';
  const text = (label: string, key: 'product' | 'offer') => (
    <label className="field">
      {label}
      <input type="text" value={brief[key]} onChange={(e) => update({ [key]: e.target.value })} />
    </label>
  );

  return (
    <div className="card brief-card">
      <h2 className="card-title">This campaign</h2>
      <div className="field-grid">
        {text('Product', 'product')}
        {text('Offer', 'offer')}
        <ParsedField
          wide
          label="Product link"
          value={brief.link}
          format={displayUrl}
          parse={parseLink}
          commit={(link) => update({ link })}
          error="Enter the product page, like fernway.example.com/serum, without a code. Each creator's code is added for you."
          hint={`Each creator gets their own code, added to the link so it applies at checkout (…/${displayUrl(brief.link).split('/').pop()}?${brief.code_param}=${exampleCode}). Their comment keyword is the same code.`}
        />
        <ParsedField
          label="Posting window"
          value={{ start: brief.window_start, end: brief.window_end }}
          format={(w) => formatWindow(w.start, w.end)}
          parse={parseWindow}
          commit={(w) => update({ window_start: w.start, window_end: w.end })}
          error="Use a range like Dec 1 – Dec 14, 2026."
        />
        <ParsedField
          label="Campaign budget"
          value={brief.campaign_budget_usd}
          format={usd}
          parse={parseUsd}
          commit={(campaign_budget_usd) => update({ campaign_budget_usd })}
          error="Enter an amount, like $32,000."
        />
        <ParsedField
          label="Main goal: paid social CPA to beat"
          value={brief.paid_social_cpa_benchmark_usd}
          format={(n) => `${usd(n)} per purchase`}
          parse={parseUsd}
          commit={(paid_social_cpa_benchmark_usd) => update({ paid_social_cpa_benchmark_usd })}
          error="Enter your paid social cost per purchase, like $65."
        />
        <label className="field">
          Secondary goal (optional)
          <select
            value={brief.secondary_goal.metric}
            onChange={(e) => {
              const metric = e.target.value as SecondaryMetric;
              if (brief.secondary_goal.target !== null) setLeadTarget(brief.secondary_goal.target);
              update({ secondary_goal: { metric, target: metric === 'cpl_usd' ? leadTarget : null } });
            }}
          >
            {SECONDARY_OPTIONS.map((o) => (
              <option key={o.metric} value={o.metric}>
                {o.label(o.metric === 'cpl_usd' ? leadTarget : null)}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
