import { useId, useMemo, useState } from 'react';
import { SampleStatePicker, useSampleState } from '../../components/SampleState';
import { cachedNudges, demoState, roster } from '../../data';
import type { Creator } from '../../data/schema';
import { usd } from '../../lib/format';
import { isNew } from '../../lib/roster';
import {
  GROUP_ORDER,
  MISSING_TEXT,
  backupsFor,
  buildStatus,
  deadlineLabel,
  groupCounts,
  shortDate,
  summarySentence,
  type Group,
  type StatusRow,
} from '../../lib/status';
import { useBrief } from '../../state/BriefContext';
import { usePicks } from '../../state/PicksContext';
import { useStatus } from '../../state/StatusContext';
import { ScreenHead } from '../ScreenHead';

const snap = demoState.status_snapshot;

const GROUP_INFO: Record<Group, { label: (n: number) => string; detail: string; cls: string }> = {
  ready: { label: (n) => `${n} ready`, detail: 'Connected, test DM arrived, DM approved', cls: 'seg--ready' },
  on_track: { label: (n) => `${n} on track`, detail: 'In progress, deadline 3+ days away', cls: 'seg--track' },
  waiting: { label: (n) => `${n} waiting on a reply`, detail: 'Invited, no answer yet', cls: 'seg--waiting' },
  at_risk: { label: (n) => `${n} at risk`, detail: 'Ready deadline today or tomorrow', cls: 'seg--risk' },
};

/** The cached nudge for this creator's missing step and deadline, if there is one (demo mode). */
const nudgeFor = (r: StatusRow) =>
  cachedNudges.nudges.find((n) => n.handle === r.creator.handle && n.missing === r.missing && n.deadline === r.deadline)
    ?.message ?? null;

export function StatusScreen() {
  const { brief } = useBrief();
  const { picks } = usePicks();
  const status = useStatus();
  const rows = useMemo(
    () =>
      buildStatus({
        picks,
        roster,
        today: snap.today,
        readyDaysBefore: brief.ready_deadline_days_before_post,
        testDmSent: snap.test_dm_sent,
        swaps: [...snap.swaps, ...status.swaps],
      }),
    [picks, brief.ready_deadline_days_before_post, status.swaps],
  );
  const counts = groupCounts(rows);
  const sentence = summarySentence(rows);
  const atRisk = rows.filter((r) => r.group === 'at_risk');
  const replaced = rows.filter((r) => r.replacedBy);
  const preview = useSampleState('status');

  return (
    <>
      <ScreenHead
        eyebrow={`Today, ${shortDate(snap.today)}`}
        title="Creator status"
        sub={`Each creator must be ready ${brief.ready_deadline_days_before_post} days before their post date.`}
      />

      <SampleStatePicker screen="status" />
      {preview === 'disconnected' && <Disconnected />}

      <section aria-label="Readiness" className="card readiness">
        <div className="readiness__sentence">
          <strong>{sentence.lead}</strong> {sentence.rest}
        </div>
        <div
          role="img"
          aria-label={GROUP_ORDER.map((g) => GROUP_INFO[g].label(counts[g])).join(', ')}
          className="readiness__bar"
        >
          {GROUP_ORDER.filter((g) => counts[g] > 0).map((g) => (
            <span key={g} className={GROUP_INFO[g].cls} style={{ flex: `${counts[g]} 1 0` }} />
          ))}
        </div>
        <div className="readiness__legend">
          {GROUP_ORDER.map((g) => (
            <div key={g} className="legend-item">
              <span aria-hidden="true" className={`swatch ${GROUP_INFO[g].cls}`} />
              <div>
                <strong>{GROUP_INFO[g].label(counts[g])}</strong>
                <div className="sub">{GROUP_INFO[g].detail}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="sub">
          Each creator counts once, in their most urgent group.
          {replaced.map((r) => (
            <span key={r.creator.handle}>
              {' '}
              Not counted: {r.creator.handle}, who {r.creator.status === 'declined' ? 'declined and ' : ''}was replaced by{' '}
              {r.replacedBy}.
            </span>
          ))}
        </div>
      </section>

      {atRisk.length > 0 && (
        <section aria-label="Needs attention" className="at-risk">
          <h2 className="card-title">At risk: act today</h2>
          <div className="at-risk__cards">
            {atRisk.map((r) => (
              <AtRiskCard key={r.creator.handle} row={r} nudge={status.edits.get(r.creator.handle) ?? nudgeFor(r)} />
            ))}
          </div>
        </section>
      )}

      <section aria-label="Everyone else" className="phone-only">
        <h2 className="card-title">Everyone else</h2>
        <ul className="card phone-list">
          {rows
            .filter((r) => r.group !== null && r.group !== 'at_risk')
            .map((r) => {
              const chip = PHONE_CHIP[r.group as Exclude<Group, 'at_risk'>];
              const replacedWho = replaced.find((x) => x.replacedBy === r.creator.handle)?.creator.handle;
              const detail = replacedWho
                ? `replaced ${replacedWho}`
                : r.group === 'ready'
                  ? null
                  : `deadline ${shortDate(r.deadline)}`;
              return (
                <li key={r.creator.handle}>
                  <div>
                    <strong>{r.creator.handle}</strong>
                    <div className="sub">
                      Posts {shortDate(r.creator.post_date)}
                      {detail && ` · ${detail}`}
                    </div>
                  </div>
                  <span className={`pill ${chip.cls}`}>{chip.label}</span>
                </li>
              );
            })}
        </ul>
      </section>

      <section aria-label="All creators" className="card table-wrap desktop-only">
        <table className="pipeline">
          <thead>
            <tr>
              <th scope="col">Creator</th>
              <th scope="col">Post date</th>
              <th scope="col">Invited · Accepted · Connected · Ready</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.creator.handle}>
                <td className="strong">{r.creator.handle}</td>
                <td>{shortDate(r.creator.post_date)}</td>
                <td>
                  <Steps reached={r.reached} replaced={!!r.replacedBy} />
                </td>
                <td className={`note note--${r.noteTone}`}>{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

/** Phone list: one status chip per creator who isn't at risk. */
const PHONE_CHIP: Record<Exclude<Group, 'at_risk'>, { label: string; cls: string }> = {
  ready: { label: 'Ready', cls: 'pill--green' },
  on_track: { label: 'On track', cls: 'pill--blue' },
  waiting: { label: 'No reply', cls: 'pill--grey' },
};

/**
 * "An account disconnects mid-campaign" (docs/UX_SPEC.md), pinned above everything until fixed, because DMs stop
 * silently otherwise. The moment and the waiting count are illustrative, as in the design: the sample data is a
 * snapshot from before posting starts.
 */
const DISCONNECT = { handle: '@theskinnurse', at: '9:14', on: '2026-12-05', waiting: 212 };

function Disconnected() {
  const [sent, setSent] = useState(false);
  const creator = roster.find((c) => c.handle === DISCONNECT.handle)!;
  const postDay = creator.post_date === DISCONNECT.on;
  return (
    <section role="alert" aria-label="Account disconnected" className="card disconnect">
      <p className="disconnect__what">
        <strong>{creator.handle}’s Instagram disconnected</strong> at {DISCONNECT.at} on {shortDate(DISCONNECT.on)}
        {postDay ? ', the day of their post' : ''}. Comments are still coming in, but no DMs are going out.
      </p>
      <p className="sub sub--13">
        {DISCONNECT.waiting} comments with {creator.code} are waiting. They’ll get their DM when the account
        reconnects, within 24 hours of commenting.
      </p>
      <div className="draft__actions">
        {sent ? (
          <span className="pill pill--green" role="status">
            Reconnect link sent to {creator.handle}
          </span>
        ) : (
          <button type="button" className="btn-small btn-small--primary btn-small--tall" onClick={() => setSent(true)}>
            Send reconnect link
          </button>
        )}
      </div>
    </section>
  );
}

const STEP_NAMES = ['invited', 'accepted', 'connected', 'ready'];

function Steps({ reached, replaced }: { reached: StatusRow['reached']; replaced: boolean }) {
  const label = reached === 0 ? 'Declined' : `Reached ${STEP_NAMES[reached - 1]}${replaced ? ', replaced' : ''}`;
  return (
    <div role="img" aria-label={label} className="steps">
      {STEP_NAMES.map((n, i) => (
        <span
          key={n}
          className={reached === 0 ? 'step step--declined' : i < reached ? (reached === 4 ? 'step step--ready' : 'step step--done') : 'step'}
        />
      ))}
    </div>
  );
}

function AtRiskCard({ row, nudge }: { row: StatusRow; nudge: string | null }) {
  const { picks, toggle } = usePicks();
  const { brief } = useBrief();
  const { sent, send, editNudge, addSwap, swaps } = useStatus();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nudge ?? '');
  const [swapping, setSwapping] = useState(false);
  const editId = useId();
  const h = row.creator.handle;
  const isSent = sent.has(h);
  const swappedOut = new Set(swaps.map((s) => s.declined));
  const backups = backupsFor(roster, picks, swappedOut);
  const canSwap = (row.missing === 'accept' || row.missing === 'connect') && backups.length > 0;
  // New creators already in the campaign, not counting the one leaving.
  const newNow = roster.filter((c) => picks.has(c.handle) && c.handle !== h && isNew(c)).length;

  const swapIn = (backup: Creator) => {
    addSwap({ declined: h, replaced_by: backup.handle, on: snap.today });
    toggle(h);
    toggle(backup.handle);
    setSwapping(false);
  };

  return (
    <div className="card risk-card">
      <div className="risk-card__head">
        <div>
          <strong>{h}</strong> · posts {shortDate(row.creator.post_date)}
        </div>
        <span className="pill pill--amber">{deadlineLabel(row.daysLeft, row.deadline)}</span>
      </div>
      <div className="sub sub--13">{row.missing ? MISSING_TEXT[row.missing] : ''}</div>
      {editing ? (
        <form
          className="draft__edit"
          onSubmit={(e) => {
            e.preventDefault();
            editNudge(h, draft.trim());
            setEditing(false);
          }}
        >
          <label htmlFor={editId} className="sr-only">
            Edit the nudge to {h}
          </label>
          <textarea id={editId} rows={3} value={draft} maxLength={280} onChange={(e) => setDraft(e.target.value)} />
          <div className="draft__actions">
            <button type="submit" className="btn-small btn-small--primary" disabled={!draft.trim()}>
              Save
            </button>
            <button type="button" className="btn-small" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="nudge">{nudge ?? 'Write a nudge with Edit.'}</div>
      )}
      {swapping && (
        <div className="swap" role="group" aria-label={`Backups for ${h}`}>
          <div className="sub">Swap {h} for a backup who’s under contract and not picked:</div>
          <ul>
            {backups.map((b) => (
              <li key={b.handle}>
                <span>
                  <strong>{b.handle}</strong> · {b.niche} · {usd(b.fee_usd)} ·{' '}
                  {b.past_cpa_usd === null ? 'new' : `past CPA ${usd(b.past_cpa_usd)}`} · posts {shortDate(b.post_date)}
                  {isNew(b) && newNow + 1 > brief.max_new_creators && (
                    <span className="text-amber">
                      {' '}
                      · puts you at {newNow + 1} new creators (limit {brief.max_new_creators})
                    </span>
                  )}
                </span>
                <button type="button" className="btn-small btn-small--primary" onClick={() => swapIn(b)}>
                  Swap in {b.handle}
                </button>
              </li>
            ))}
          </ul>
          <button type="button" className="btn-link" onClick={() => setSwapping(false)}>
            Cancel
          </button>
        </div>
      )}
      <div className="draft__actions">
        {isSent ? (
          <span className="pill pill--green" role="status">
            Nudge sent
          </span>
        ) : (
          <button type="button" className="btn-small btn-small--primary btn-small--tall" disabled={!nudge} onClick={() => send(h)}>
            Send nudge
          </button>
        )}
        {!editing && !isSent && (
          <button
            type="button"
            className="btn-small btn-small--tall"
            onClick={() => {
              setDraft(nudge ?? '');
              setEditing(true);
            }}
          >
            Edit
          </button>
        )}
        {canSwap && !swapping && (
          <button type="button" className="btn-small btn-small--tall" onClick={() => setSwapping(true)}>
            Swap in a backup
          </button>
        )}
      </div>
    </div>
  );
}

