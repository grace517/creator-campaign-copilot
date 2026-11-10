import { useEffect, useId, useRef, useState } from 'react';
import type { Creator } from '../../data/schema';
import { exactChecks } from '../../lib/checks';
import { timeLeft, withOneRetry } from '../../lib/states';
import type { CampaignBrief } from '../../state/brief';
import type { WriteStarter } from './demoWriter';

type RowState =
  | { kind: 'writing' }
  | { kind: 'done'; dm: string; captionCta: string; byBrand: boolean }
  | { kind: 'failed' }
  | { kind: 'manual' };

/** The exact checks a written starter fails. A starter can't go to its creator until this is empty. */
const failedChecks = (s: Extract<RowState, { kind: 'done' }>, c: Creator, brief: CampaignBrief) =>
  exactChecks({ dm: s.dm, captionCta: s.captionCta || undefined, code: c.code }, brief).filter((k) => !k.passed);

/**
 * Drafts while starters are being written (docs/UX_SPEC.md: empty, loading, and error states). Starters are
 * written one at a time and each row fills in as it finishes, so review can start early. A failed call is retried
 * once on its own; if it fails again, only that row says so and offers Try again or Write it yourself.
 */
export function StarterWriting({
  creators,
  brief,
  write,
  onReview,
}: {
  creators: Creator[];
  brief: CampaignBrief;
  write: WriteStarter;
  onReview: () => void;
}) {
  const [rows, setRows] = useState<Map<string, RowState>>(() => new Map(creators.map((c) => [c.handle, { kind: 'writing' }])));
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(Date.now());
  const set = (handle: string, s: RowState) => setRows((m) => new Map(m).set(handle, s));

  const run = async (c: Creator, isCancelled: () => boolean) => {
    try {
      const out = await withOneRetry(() => write(c));
      if (!isCancelled()) set(c.handle, { kind: 'done', ...out, byBrand: false });
    } catch {
      if (!isCancelled()) set(c.handle, { kind: 'failed' });
    }
    if (!isCancelled()) setElapsed(Date.now() - started.current);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const c of creators) {
        if (cancelled) return;
        await run(c, () => cancelled);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Write once per mount; a new preview remounts this component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const states = creators.map((c) => rows.get(c.handle)!);
  const finished = states.filter((s) => s.kind !== 'writing').length;
  const written = states.filter((s) => s.kind === 'done').length;
  const failing = creators.filter((c) => {
    const s = rows.get(c.handle)!;
    return s.kind === 'done' && failedChecks(s, c, brief).length > 0;
  }).length;
  const resolved = written === creators.length && failing === 0;
  const writing = finished < creators.length;
  const left = timeLeft(finished, creators.length, elapsed);

  return (
    <section className="card writing" aria-label="Writing starter DMs">
      <div className="writing__head">
        <strong>
          {writing ? `Writing starter DMs · ${finished} of ${creators.length}` : `Starter DMs written · ${written} of ${creators.length}`}
        </strong>
        {writing && left && <span className="sub">{left}</span>}
        {!writing && (
          <button type="button" className="btn-small btn-small--primary" disabled={!resolved} onClick={onReview}>
            Send to creators
          </button>
        )}
      </div>
      <div
        role="progressbar"
        aria-label="Starter DMs written"
        aria-valuemin={0}
        aria-valuemax={creators.length}
        aria-valuenow={finished}
        className="writing__bar"
      >
        <span style={{ width: `${(finished / creators.length) * 100}%` }} />
      </div>
      <ul className="writing__rows" aria-live="polite">
        {creators.map((c) => (
          <WritingRow
            key={c.handle}
            creator={c}
            state={rows.get(c.handle)!}
            brief={brief}
            onRetry={() => {
              set(c.handle, { kind: 'writing' });
              void run(c, () => false);
            }}
            onManual={() => set(c.handle, { kind: 'manual' })}
            onSave={(dm) => set(c.handle, { kind: 'done', dm, captionCta: '', byBrand: true })}
          />
        ))}
      </ul>
      {!writing && !resolved && (
        <p className="sub">
          {written < creators.length
            ? 'Each creator needs a starter before they go out.'
            : 'Fix the starter that fails a check before they go out.'}
        </p>
      )}
    </section>
  );
}

function WritingRow({
  creator: c,
  state,
  brief,
  onRetry,
  onManual,
  onSave,
}: {
  creator: Creator;
  state: RowState;
  brief: CampaignBrief;
  onRetry: () => void;
  onManual: () => void;
  onSave: (dm: string) => void;
}) {
  const [text, setText] = useState(`${brief.disclosure} `);
  const fieldId = useId();
  if (state.kind === 'writing') {
    return (
      <li className="writing__row">
        <strong>{c.handle}</strong>
        <span className="skeleton" aria-label="Writing">
          <span />
          <span />
        </span>
      </li>
    );
  }
  if (state.kind === 'done') {
    const total = exactChecks({ dm: state.dm, captionCta: state.captionCta || undefined, code: c.code }, brief).length;
    const failed = failedChecks(state, c, brief);
    if (failed.length === 0) {
      return (
        <li className="writing__row">
          <span>
            <strong>{c.handle}</strong>
            {state.byBrand && <span className="sub"> · written by you</span>}
          </span>
          <span className="pill pill--green">All {total} checks pass</span>
        </li>
      );
    }
    return (
      <li className="writing__row writing__row--failed">
        <div className="writing__row-top">
          <span>
            <strong>{c.handle}</strong>
            {state.byBrand && <span className="sub"> · written by you</span>}
          </span>
          <span className="pill pill--red">
            {failed.length} check{failed.length === 1 ? '' : 's'} fail{failed.length === 1 ? 's' : ''}
          </span>
        </div>
        <ul className="sub">
          {failed.map((f) => (
            <li key={f.name}>{f.reason}</li>
          ))}
        </ul>
        {state.byBrand && (
          <div className="draft__actions">
            <button type="button" className="btn-small" onClick={onManual}>
              Edit
            </button>
          </div>
        )}
      </li>
    );
  }
  if (state.kind === 'failed') {
    return (
      <li className="writing__row writing__row--failed">
        <div className="writing__row-top">
          <strong>{c.handle}</strong>
          <span className="pill pill--red">Couldn’t write a starter</span>
        </div>
        <p className="sub">We tried twice. Your other drafts aren’t affected.</p>
        <div className="draft__actions">
          <button type="button" className="btn-small" onClick={onRetry}>
            Try again
          </button>
          <button type="button" className="btn-small" onClick={onManual}>
            Write it yourself
          </button>
        </div>
      </li>
    );
  }
  const link = `${brief.link}?${brief.code_param}=${c.code}`;
  return (
    <li className="writing__row writing__row--failed">
      <form
        className="draft__edit"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(text.trim());
        }}
      >
        <label htmlFor={fieldId}>
          <strong>{c.handle}</strong> <span className="sub">· the creator rewrites it in their own words</span>
        </label>
        <textarea id={fieldId} rows={3} maxLength={brief.dm_max_chars} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="sub">Include their link: {link.replace(/^https?:\/\//, '')}</div>
        <div className="draft__actions">
          <button type="submit" className="btn-small btn-small--primary" disabled={!text.trim()}>
            Save starter
          </button>
        </div>
      </form>
    </li>
  );
}
