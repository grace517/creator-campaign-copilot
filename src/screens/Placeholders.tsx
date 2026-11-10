import type { ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Placeholder bodies for each screen. Titles and primary actions match the designs; each body names the PR
 * that builds it (docs/BUILD_PLAN.md build order).
 */

function Placeholder({ pr, children }: { pr: string; children: ReactNode }) {
  return (
    <div className="card placeholder">
      <strong>Placeholder.</strong> {children} Built in <code>{pr}</code>.
    </div>
  );
}

export function ScreenHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="screen-head">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {sub && <p>{sub}</p>}
      </div>
      {action}
    </div>
  );
}


function AppScreen({ title, sub, pr, body }: { title: string; sub: string; pr: string; body: string }) {
  return (
    <>
      <div className="screen-head">
        <div>
          <h1 className="page-title">{title}</h1>
          <p>{sub}</p>
        </div>
      </div>
      <Placeholder pr={pr}>{body}</Placeholder>
    </>
  );
}

export function CampaignsScreen() {
  return (
    <>
      <AppScreen
        title="Campaigns"
        sub="Each campaign shows its step and the one thing it needs from you next."
        pr="feat/08-app-screens"
        body="Campaign table with steps and “Next for you”, filters, and results across campaigns."
      />
      <div className="card placeholder">
        Open the sample campaign: <Link to="/campaigns/barrier-serum-launch/brief">Barrier Serum launch</Link>
      </div>
    </>
  );
}

export function CreatorsScreen() {
  return (
    <AppScreen
      title="Creators"
      sub="Your contracted creators, grouped into pools by how they performed. Pools update after every readout."
      pr="feat/08-app-screens"
      body="Pool tabs, the creator table, and pool history."
    />
  );
}

export function BrandKitScreen() {
  return (
    <AppScreen
      title="Brand kit"
      sub="Set once. Every new campaign starts from these, and every check runs against them."
      pr="feat/08-app-screens"
      body="Voice and disclosure, goals, claims, pools, and products."
    />
  );
}
