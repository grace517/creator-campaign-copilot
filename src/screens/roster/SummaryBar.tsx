import { usd } from '../../lib/format';
import type { MixWarning, RosterSummary } from '../../lib/roster';
import { rowId } from './RosterTable';

export function SummaryBar({
  summary: s,
  budget,
  maxNew,
  mix,
  block,
  onShowFixes,
}: {
  summary: RosterSummary;
  budget: number;
  maxNew: number;
  mix: MixWarning | null;
  block: string | null;
  onShowFixes: (handles: string[]) => void;
}) {
  const share = Math.round((s.committed / budget) * 100);
  return (
    <section aria-label="Budget and mix" className="card summary">
      <div className="summary__top">
        <div>
          <strong>{usd(s.committed)}</strong> committed of {usd(budget)} budget
        </div>
        <div className={s.newState === 'over' ? 'text-red' : 'muted'}>
          {s.picked} creator{s.picked === 1 ? '' : 's'} · {s.newPicked} new{Number.isFinite(maxNew) ? ` (limit ${maxNew})` : ''}
        </div>
      </div>
      <div role="img" aria-label={`${share} percent of budget committed`} className="meter">
        <div className={`meter__fill meter__fill--${s.budgetState}`} style={{ width: `${Math.min(share, 100)}%` }} />
      </div>
      {block && s.picked > 0 && (
        <p id="roster-blocker" className="summary__block">
          {block}
        </p>
      )}
      {block && s.picked === 0 && (
        <p id="roster-blocker" className="sr-only">
          {block}
        </p>
      )}
      {s.budgetState === 'near' && (
        <div className="warning">
          <span>
            <strong>Budget:</strong> {usd(s.remaining)} left of {usd(budget)}.
          </span>
        </div>
      )}
      {mix && (
        <div className="warning">
          <span>
            <strong>Mix:</strong> {mix.count} of {mix.of} picks are {mix.group} creators.{' '}
            {mix.fixes.length === 0 ? (
              <>No unpicked creator outside {mix.group} fits your remaining {usd(s.remaining)}.</>
            ) : (
              <>
                {mix.fixes.length} unpicked creator{mix.fixes.length === 1 ? '' : 's'} outside {mix.group}{' '}
                {mix.fixes.length === 1 ? 'fits' : 'fit'} your remaining {usd(s.remaining)}:{' '}
                {mix.fixes.map((c, i) => (
                  <span key={c.handle}>
                    {i > 0 && ', '}
                    <a href={`#${rowId(c.handle)}`} className="warning__link">
                      {c.handle}
                    </a>{' '}
                    ({c.niche}
                    {c.past_cpa_usd !== null ? `, past CPA ${usd(c.past_cpa_usd)}` : ', new'})
                  </span>
                ))}
                .
              </>
            )}
          </span>
          {mix.fixes.length > 0 && (
            <button type="button" className="btn-warning" onClick={() => onShowFixes(mix.fixes.map((c) => c.handle))}>
              Show in table
            </button>
          )}
        </div>
      )}
    </section>
  );
}
