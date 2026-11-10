import { useEffect, useId, useState } from 'react';
import { NavLink, useLocation, useMatch } from 'react-router';
import { brief } from '../data';
import { STEPS } from '../steps';

/**
 * App-level bar. On a phone the nav folds into a menu button, and inside a campaign the menu also lists its five
 * steps, since the stepper gives way to "Step N of 5" there.
 */
export function AppBar() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { pathname } = useLocation();
  const campaign = useMatch('/campaigns/:campaignId/*')?.params.campaignId;
  // Close the menu whenever the page changes.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="app-bar">
      <div className="app-bar__left">
        <button
          type="button"
          className="app-bar__menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((o) => !o)}
        >
          <span aria-hidden="true">☰</span>
          <span className="sr-only">Menu</span>
        </button>
        <div className="app-bar__name">Campaign Copilot</div>
        <nav id={menuId} aria-label="Main" className={`app-bar__nav${open ? ' is-open' : ''}`}>
          <NavLink to="/campaigns">Campaigns</NavLink>
          <NavLink to="/creators">Creators</NavLink>
          <NavLink to="/brand-kit">Brand kit</NavLink>
          {campaign && (
            <div className="app-bar__steps">
              <span className="sub">This campaign</span>
              {STEPS.map((s, i) => (
                <NavLink key={s.path} to={`/campaigns/${campaign}/${s.path}`}>
                  {i + 1}. {s.label}
                </NavLink>
              ))}
            </div>
          )}
        </nav>
      </div>
      <div className="app-bar__brand">{brief.brand} (sample)</div>
    </header>
  );
}
