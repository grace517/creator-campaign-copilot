import { NavLink } from 'react-router';
import { brief } from '../data';

export function AppBar() {
  return (
    <header className="app-bar">
      <div className="app-bar__left">
        <div className="app-bar__name">Campaign Copilot</div>
        <nav aria-label="Main" className="app-bar__nav">
          <NavLink to="/campaigns">Campaigns</NavLink>
          <NavLink to="/creators">Creators</NavLink>
          <NavLink to="/brand-kit">Brand kit</NavLink>
        </nav>
      </div>
      <div className="app-bar__brand">{brief.brand} (sample)</div>
    </header>
  );
}
