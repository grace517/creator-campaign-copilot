import { useId, useState } from 'react';
import { usd, usd2 } from '../../lib/format';
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

const SECONDARY_OPTIONS: { metric: SecondaryMetric; label: string }[] = [
  { metric: 'email_sms_signups', label: 'Email and SMS sign-ups' },
  { metric: 'reach', label: 'Reach' },
];

/** "" (no target, so the campaign average) or a dollar amount; null when the text isn't either. */
function parseOptionalUsd(s: string): { value: number | null } | null {
  if (s.trim() === '') return { value: null };
  const n = parseUsd(s.replace(/\s*per (email or SMS )?sign-up$/i, ''));
  return n === null ? null : { value: n };
}

export function BriefFields() {
  const { brief, update } = useBrief();
  // Remember the sign-up target so switching to reach and back restores it.
  const [signupTarget, setSignupTarget] = useState(brief.secondary_goal.metric === 'email_sms_signups' ? brief.secondary_goal.target : null);
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
              update({ secondary_goal: { metric, target: metric === 'email_sms_signups' ? signupTarget : null } });
            }}
          >
            {SECONDARY_OPTIONS.map((o) => (
              <option key={o.metric} value={o.metric}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {brief.secondary_goal.metric === 'email_sms_signups' ? (
          <ParsedField
            wide
            label="Target cost per sign-up (optional)"
            value={{ value: brief.secondary_goal.target }}
            format={(v) => (v.value === null ? '' : `${usd2(v.value)} per sign-up`)}
            parse={parseOptionalUsd}
            commit={({ value }) => {
              setSignupTarget(value);
              update({ secondary_goal: { metric: 'email_sms_signups', target: value } });
            }}
            error="Enter a dollar amount, like $10.00, or leave it blank."
            hint="Leave blank to compare each creator with the campaign’s average cost per sign-up. Creators who beat it, and not CPA, become List builders."
          />
        ) : (
          <p className="field__hint field--wide">Reach compares each creator’s cost per 1,000 impressions with the campaign average.</p>
        )}
      </div>
    </div>
  );
}
