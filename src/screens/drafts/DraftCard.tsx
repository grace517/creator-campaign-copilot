import { useId, useState, type ReactNode } from 'react';
import { displayUrl } from '../../lib/checks';
import { voiceText, type DraftRow, type Issue } from '../../lib/drafts';
import { RULING_KINDS, type RulingKind } from '../../lib/rulings';
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
  const { approve, remind, sendBack, edit, rule, unrule } = useDrafts();
  const [ruling, setRuling] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.message);
  const editId = useId();
  const problem = row.status === 'needs_fix' || row.status === 'needs_review';
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
      className={`card draft${row.status === 'needs_fix' ? ' draft--fail' : row.status === 'needs_review' ? ' draft--unsure' : ''}`}
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
        {row.issues.length > 0 && <Issues issues={row.issues} unsure={row.unsure} />}
        {ruling && row.status === 'needs_review' && (
          <OverrideForm
            phrases={row.flagged}
            onCancel={() => setRuling(false)}
            onSave={(kind, note) => {
              rule(row.message, { handle: row.creator.handle, phrases: row.flagged, ruling: kind, note });
              setRuling(false);
            }}
          />
        )}
        {row.ruling && (
          <div className="draft__ruled" role="status">
            <span>
              <strong>✓ Marked OK by you</strong>
              {row.ruling.phrases.length > 0 && (
                <>
                  : “{row.ruling.phrases.join('”, “')}”. {RULING_KINDS[row.ruling.ruling].label}
                </>
              )}
              .{' '}
              {row.ruling.phrases.length > 0
                ? 'The claim check learned this and applies it to similar wording from now on.'
                : 'You read the new wording; it wasn’t sent to the claim check.'}
            </span>
            <button type="button" className="btn-link" onClick={() => unrule(row.message)}>
              Undo
            </button>
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
              {row.status === 'needs_review' && !ruling && (
                <button type="button" className="btn-small" onClick={() => setRuling(true)}>
                  Mark as OK for this message
                </button>
              )}
              <button
                type="button"
                className="btn-small"
                onClick={() =>
                  sendBack(
                    row.creator.handle,
                    row.issues.map((i) => (i.fix ? `${capitalize(i.fix)}.` : i.text)).join(' ') || 'Please revise.',
                  )
                }
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

/** "Why is this OK?" The answer clears this message and becomes precedent for later claim checks. */
function OverrideForm({
  phrases,
  onSave,
  onCancel,
}: {
  phrases: string[];
  onSave: (kind: RulingKind, note?: string) => void;
  onCancel: () => void;
}) {
  const [kind, setKind] = useState<RulingKind>('audience');
  const [note, setNote] = useState('');
  const name = useId();
  return (
    <form
      className="override"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(kind, note.trim() || undefined);
      }}
    >
      <fieldset>
        <legend>
          Why is {phrases.length ? `“${phrases.join('”, “')}”` : 'this wording'} OK?
        </legend>
        {(Object.keys(RULING_KINDS) as RulingKind[]).map((k) => (
          <label key={k} className="override__option">
            <input type="radio" name={name} value={k} checked={kind === k} onChange={() => setKind(k)} />
            {RULING_KINDS[k].label}
          </label>
        ))}
        <label className="override__note">
          Note for your team (optional)
          <input type="text" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </label>
      </fieldset>
      <p className="sub">
        This clears the message for approval and is sent as your brand’s precedent with every later claim check, so
        the check treats similar wording the same way. A ruling never makes a banned claim acceptable.
      </p>
      <div className="draft__actions">
        <button type="submit" className="btn-small btn-small--primary">
          Mark OK and teach the check
        </button>
        <button type="button" className="btn-small" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * What's wrong with a message. One issue reads as a short block; several become a numbered list, each starting
 * with the phrase it's about, so the list lines up with the highlights in the message.
 */
function Issues({ issues, unsure }: { issues: Issue[]; unsure: boolean }) {
  const many = issues.length > 1;
  const title = unsure ? 'Needs review' : many ? `${issues.length} issues to fix` : null;
  const body = (i: Issue) => (
    <>
      <div>
        {i.phrase && <q className="issue__phrase">{displayUrl(i.phrase)}</q>}
        {i.phrase && ': '}
        {i.text}
      </div>
      {i.fix && (
        <div className="issue__fix">
          <strong>Suggested fix:</strong> {capitalize(i.fix)}.
        </div>
      )}
    </>
  );
  return (
    <div className={unsure ? 'issues issues--unsure' : 'issues'}>
      {title && <div className="issues__title">{title}</div>}
      {many ? (
        <ol>
          {issues.map((i, n) => (
            <li key={n}>{body(i)}</li>
          ))}
        </ol>
      ) : (
        body(issues[0]!)
      )}
    </div>
  );
}
