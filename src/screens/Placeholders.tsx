import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { demoState } from '../data';

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

function ScreenHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
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

function useCampaignPath() {
  const { campaignId = '' } = useParams();
  return (step: string) => `/campaigns/${campaignId}/${step}`;
}

export function BriefScreen() {
  const to = useCampaignPath();
  return (
    <>
      <ScreenHead
        title="Brief"
        action={
          <Link className="btn-primary" to={to('roster')}>
            Next: pick creators
          </Link>
        }
      />
      <Placeholder pr="feat/02-brief">Brand kit card, campaign fields and goals, and starter DMs for three creators.</Placeholder>
    </>
  );
}

export function RosterScreen() {
  return (
    <>
      <ScreenHead title="Pick creators" />
      <Placeholder pr="feat/03-roster">Budget summary, benchmark legend, sort and filters, and the creator table.</Placeholder>
    </>
  );
}

export function DraftsScreen() {
  return (
    <>
      <ScreenHead
        title="Review drafts"
        sub="Creators edit their starter DM in their own words. Every version is re-checked before you approve it."
      />
      <Placeholder pr="feat/05-drafts">One card per creator with their DM, stage, voice line, and checks.</Placeholder>
    </>
  );
}

export function StatusScreen() {
  const [, m, d] = demoState.status_snapshot.today.split('-').map(Number);
  const month = new Date(2000, m! - 1, 1).toLocaleString('en-US', { month: 'short' });
  return (
    <>
      <ScreenHead
        eyebrow={`Today, ${month} ${d}`}
        title="Creator status"
        sub="Each creator must be ready 3 days before their post date."
      />
      <Placeholder pr="feat/06-status">Readiness summary, at-risk cards with nudges, and the pipeline table.</Placeholder>
    </>
  );
}

export function ReadoutScreen() {
  return (
    <>
      <ScreenHead eyebrow="Sample results" title="Readout" />
      <Placeholder pr="feat/07-readout">Verdict and scatter, pool cards, and the Table and Funnel views.</Placeholder>
    </>
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
