import { useMemo } from 'react';
import { Link, useParams } from 'react-router';
import { cachedJudgments, cachedStarters, demoState, roster } from '../../data';
import { buildRows, counts, sortRows } from '../../lib/drafts';
import { useBrief } from '../../state/BriefContext';
import { useDrafts } from '../../state/DraftsContext';
import { usePicks } from '../../state/PicksContext';
import { ScreenHead } from '../Placeholders';
import { DraftCard } from './DraftCard';

const judgmentsByText = new Map(cachedJudgments.judgments.map(({ message, ...j }) => [message, j]));

export function DraftsScreen() {
  const { campaignId = '' } = useParams();
  const { brief } = useBrief();
  const { picks } = usePicks();
  const { actions, approve, remind } = useDrafts();
  const rows = useMemo(
    () =>
      sortRows(
        buildRows({ picks, roster, starters: cachedStarters, judgments: judgmentsByText, demo: demoState, brief, actions }),
      ),
    [picks, brief, actions],
  );
  const c = counts(rows);
  const toApprove = rows.filter((r) => r.status === 'passing').map((r) => r.creator.handle);
  const toRemind = rows.filter((r) => r.status === 'with_creator' && !r.reminded).map((r) => r.creator.handle);

  return (
    <>
      <ScreenHead
        title="Review drafts"
        sub="Creators edit their starter DM in their own words. Every version is re-checked before you approve it."
        action={
          <div className="head-actions">
            <button type="button" className="btn-secondary" disabled={c.remindable === 0} onClick={() => remind(toRemind)}>
              Remind waiting ({c.remindable})
            </button>
            {c.approvable > 0 ? (
              <button type="button" className="btn-primary" onClick={() => approve(toApprove)}>
                Approve all passing ({c.approvable})
              </button>
            ) : (
              <Link className="btn-primary" to={`/campaigns/${campaignId}/status`}>
                Next: creator status
              </Link>
            )}
          </div>
        }
      />
      <ol aria-label="How a DM gets approved" className="flow">
        <li>1 Starter drafted from past DMs</li>
        <li>2 Creator edits or accepts</li>
        <li>3 Checks re-run</li>
        <li>4 You approve</li>
      </ol>
      <div className="counts">
        <div className="card count">
          <div className="count__n text-green">{c.passing}</div>
          <div className="sub">Back from creators, pass every check</div>
        </div>
        <div className="card count">
          <div className="count__n text-red">{c.needsFix}</div>
          <div className="sub">Creator edits that need a fix</div>
        </div>
        <div className="card count">
          <div className="count__n">{c.withCreator}</div>
          <div className="sub">Still with the creator</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="card placeholder">
          No creators picked yet. <Link to={`/campaigns/${campaignId}/roster`}>Pick creators</Link> to draft their
          messages.
        </div>
      ) : (
        <div className="drafts">
          {rows.map((r) => (
            <DraftCard key={`${r.creator.handle}:${r.message}`} row={r} />
          ))}
        </div>
      )}
    </>
  );
}
