import { cachedStarters, roster } from '../../data';
import type { Creator } from '../../data/schema';
import { checkClaims, checkDisclosure, checkLink, type Check } from '../../lib/checks';
import { useBrief } from '../../state/BriefContext';

const CHIP_LABEL: Record<Check['name'], string> = { disclosure: 'Disclosure', claims: 'Claims', link: 'Link' };

/** "Voice from 3 past DMs"; under two past DMs it's low confidence, and with none the voice comes from captions. */
export function voiceLine(c: Pick<Creator, 'past_dm_count'>): { text: string; low: boolean } {
  if (c.past_dm_count === 0) return { text: 'No past DMs, voice from captions, low confidence', low: true };
  const n = `${c.past_dm_count} past DM${c.past_dm_count === 1 ? '' : 's'}`;
  return c.past_dm_count < 2 ? { text: `Voice from ${n}, low confidence`, low: true } : { text: `Voice from ${n}`, low: false };
}

/** Shows the message with links written the way the designs show them, without https://. */
const display = (dm: string) => dm.replace(/https?:\/\//g, '');

export function StarterDms() {
  const { brief } = useBrief();
  const byHandle = new Map(roster.map((c) => [c.handle, c]));
  const w = cachedStarters.written_for;
  const stale = w.product !== brief.product || w.offer !== brief.offer || w.link !== brief.link;

  return (
    <aside aria-label="Live preview" className="card starters">
      <div>
        <h2 className="card-title">Starter DMs</h2>
        <p className="starters__intro">
          Each creator gets a starter DM written from their past DMs. They edit it in their own words, and every edit is
          re-checked. Updates as you edit the brief.
        </p>
      </div>
      {stale && (
        <p className="starters__stale" role="status">
          Demo mode: these starters are cached for the original brief, so their wording doesn’t change. The checks below
          re-run against your edits.
        </p>
      )}
      {cachedStarters.starters.map((s) => {
        const creator = byHandle.get(s.handle);
        if (!creator) return null;
        const voice = voiceLine(creator);
        const checks = [
          checkDisclosure(s.dm, brief),
          checkClaims(s.dm, s.claims_used, brief),
          checkLink(s.dm, creator, brief),
        ];
        const failed = checks.filter((c) => !c.passed);
        return (
          <section key={s.handle} className="starter" aria-label={`Starter DM for ${s.handle}`}>
            <div className="starter__head">
              <span className="starter__handle">{s.handle}</span>
              <span className={voice.low ? 'starter__voice starter__voice--low' : 'starter__voice'}>{voice.text}</span>
            </div>
            <div className="bubble">{display(s.dm)}</div>
            <ul className="chips chips--small" aria-label="Checks">
              {checks.map((c) => (
                <li key={c.name} className={`chip ${c.passed ? 'chip--green' : 'chip--red'}`}>
                  {CHIP_LABEL[c.name]}
                  <span className="sr-only">{c.passed ? ' check passed' : ' check failed'}</span>
                </li>
              ))}
            </ul>
            {failed.map((c) => (
              <p key={c.name} className="starter__reason">
                {c.reason}
              </p>
            ))}
          </section>
        );
      })}
    </aside>
  );
}
