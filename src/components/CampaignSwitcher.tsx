import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { campaigns } from '../data';
import type { StepPath } from '../steps';

export function CampaignSwitcher({ campaignId, step }: { campaignId: string; step: StepPath }) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const root = useRef<HTMLDivElement>(null);
  const others = campaigns.filter((c) => c.id !== campaignId);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="switcher" ref={root}>
      <button
        type="button"
        className="btn"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        Switch campaign ({others.length} others) ▾
      </button>
      {open && (
        <ul id={menuId} className="switcher__menu">
          {others.map((c) => (
            <li key={c.id}>
              <Link to={`/campaigns/${c.id}/${step}`} onClick={() => setOpen(false)}>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
