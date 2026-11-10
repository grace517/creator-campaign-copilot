import { useId, useState, type ReactNode } from 'react';
import { displayUrl } from '../../lib/checks';
import { voiceText, type DraftRow } from '../../lib/drafts';
import { useDrafts } from '../../state/DraftsContext';

const STAGE: Record<DraftRow['stage'], { label: string; cls: string }> = {
  edited: { label: 'Creator edited', cls: 'stage--edited' },
  accepted: { label: 'Creator accepted as-is', cls: 'stage--accepted' },
  with_creator: { label: 'With creator', cls: 'stage--waiting' },
};

/** Links read without https://, as in the designs. */
const show = (s: string) => s.replace(/https?:\/\//g, '');

/** The message with each flagged phrase highlighted (phrases arrive in order of appearance). */
function Message({ text, flagged, unsure }: { text: string; flagged: string[]; unsure: boolean }) {
  const parts: ReactNode[] = [];
  let from = 0;
  for (const phrase of flagged) {
    const at = text.indexOf(phrase, from);
    if (at === -1) continue; // overlaps an earlier highlight
    parts.push(show(text.slice(from, at)));
    parts.push(
      <mark key={at} className={unsure ? 'flag flag--unsure' : 'flag'}>
        {displayUrl(phrase)}
      </mark>,
    );
    from = at + phrase.length;
  }
  parts.push(show(text.slice(from)));
  return <div className="draft__dm">{parts}</div>;
}

export function DraftCard({ row }: { row: DraftRow }) {
  const { approve, remind, sendBack, edit, markOk } = useDrafts();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.message);
  const editId = useId();
  const problem = row.status === 'needs_fix' || row.status === 'needs_person';
  const voice = voiceText(row);
  const stage = STAGE[row.stage];
  const chipCls =
    row.status === 'approved'
      ? 'chip--blue'
      : row.unsure
        ? 'chip--amber'
        : row.status === 'needs_fix'
          ? 'chip--red'
          : 'chip--green';

  return (
    <article
      className={`card draft${row.status === 'needs_fix' ? ' draft--fail' : row.status === 'needs_person' ? ' draft--unsure' : ''}`}
      aria-label={`${row.creator.handle}: ${row.chip}`}
    >
      <div className="draft__who">
        <div className="strong">{row.creator.handle}</div>
        <div className="keyword">{row.creator.code}</div>
        <div>
          <span className={`tag ${stage.cls}`}>{stage.label}</span>
        </div>
      </div>

      <div className="draft__body">
        <div className="sub">{row.stage === 'with_creator' ? 'Starter DM sent to creator' : 'Creator’s DM'}</div>
        {editing ? (
          <form
            className="draft__edit"
            onSubmit={(e) => {
              e.preventDefault();
              edit(row.creator.handle, draft.trim());
              setEditing(false);
            }}
          >
            <label htmlFor={editId} className="sr-only">
              Edit {row.creator.handle}’s DM
            </label>
            <textarea id={editId} rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="draft__actions">
              <button type="submit" className="btn-small btn-small--primary" disabled={!draft.trim()}>
                Save and re-check
              </button>
              <button type="button" className="btn-small" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <Message text={row.message} flagged={row.flagged} unsure={row.unsure} />
        )}
        <div className="sub">
          Caption call to action: <span className="draft__cta">{row.captionCta}</span>
        </div>
        <div className={voice.low ? 'sub text-amber' : 'sub'}>{voice.text}</div>
        {row.sentBackFix && <div className="sub">Sent back: {row.sentBackFix}</div>}
        {row.reasons.length > 0 && (
          <div className={row.unsure ? 'draft__reason draft__reason--unsure' : 'draft__reason'}>
            {row.unsure && <strong>Needs a person. </strong>}
            {row.reasons.join(' ')}
          </div>
        )}
      </div>

      <div className="draft__side">
        <span className={`chip ${chipCls}`} role="status">
          {row.chip}
        </span>
        <div className="draft__actions">
          {row.status === 'passing' && (
            <>
              <button type="button" className="btn-small btn-small--primary" onClick={() => approve([row.creator.handle])}>
                Approve
              </button>
              <button type="button" className="btn-small" onClick={() => setEditing(true)}>
                Edit
              </button>
            </>
          )}
          {problem && (
            <>
              <button type="button" className="btn-small" disabled aria-describedby={`why-${row.creator.code}`}>
                Approve
              </button>
              <span id={`why-${row.creator.code}`} className="sr-only">
                Approve is blocked until the failed check is fixed or a person marks it OK.
              </span>
              {row.status === 'needs_person' && (
                <button type="button" className="btn-small" onClick={() => markOk(row.message)}>
                  Mark as OK for this message
                </button>
              )}
              <button
                type="button"
                className="btn-small"
                onClick={() => sendBack(row.creator.handle, row.reasons[0] ?? 'Please revise.')}
              >
                Send back with fix
              </button>
            </>
          )}
          {row.status === 'with_creator' &&
            (row.reminded ? (
              <span className="sub">Reminded</span>
            ) : (
              <button type="button" className="btn-small" onClick={() => remind([row.creator.handle])}>
                Remind
              </button>
            ))}
        </div>
      </div>
    </article>
  );
}
