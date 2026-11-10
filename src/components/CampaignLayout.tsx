import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router';
import { SAMPLE_CAMPAIGN_ID, sampleCampaigns } from '../data';
import { dateRange, usd } from '../lib/format';
import { useBriefs } from '../state/BriefContext';
import { CurrentCampaign, useCampaigns, type CampaignRef } from '../state/CampaignsContext';
import { STEPS, type StepPath } from '../steps';
import { CampaignSwitcher } from './CampaignSwitcher';
import { Stepper } from './Stepper';

/**
 * Every campaign screen: breadcrumb, name, product · window · budget, switcher, and the five-step stepper.
 * Sets the current campaign for the screens inside it. Only the sample campaign has data for every step; a
 * started campaign works through Brief and Roster; a summary campaign points to the sample.
 */
export function CampaignLayout() {
  const { campaignId = '' } = useParams();
  const { pathname } = useLocation();
  const { all } = useCampaigns();
  const { briefFor } = useBriefs();
  const campaign = all.find((c) => c.id === campaignId);
  if (!campaign) return <Navigate to="/campaigns" replace />;

  const segment = pathname.split('/').filter(Boolean)[2];
  const step = (STEPS.find((s) => s.path === segment)?.path ?? 'brief') as StepPath;
  const summary = sampleCampaigns.find((c) => c.id === campaign.id);
  const brief = briefFor(campaign.id);
  const meta =
    campaign.kind === 'summary'
      ? `${summary?.creators ?? 0} creators · ${usd(summary?.committed_usd ?? 0)} of ${usd(summary?.budget_usd ?? 0)} committed`
      : `${brief.product} · ${dateRange(brief.window_start, brief.window_end)} · ${usd(brief.campaign_budget_usd)} budget`;

  return (
    <CurrentCampaign value={campaign.id}>
      <section aria-label="Campaign" className="card campaign-header">
        <div className="campaign-header__top">
          <div>
            <nav aria-label="Breadcrumb" className="breadcrumb">
              <Link to="/campaigns">Campaigns</Link> <span aria-hidden="true">/</span> {campaign.name}
            </nav>
            <h1>{campaign.name}</h1>
            <div className="campaign-header__meta">{meta}</div>
          </div>
          <CampaignSwitcher campaignId={campaign.id} step={step} />
        </div>
        <Stepper campaignId={campaign.id} current={step} />
      </section>
      {hasStep(campaign, step) ? <Outlet /> : <NotInSample campaign={campaign} step={step} />}
    </CurrentCampaign>
  );
}

function hasStep(c: CampaignRef, step: StepPath): boolean {
  if (c.kind === 'sample') return true;
  if (c.kind === 'started') return step === 'brief' || step === 'roster';
  return false;
}

function NotInSample({ campaign, step }: { campaign: CampaignRef; step: StepPath }) {
  const label = STEPS.find((s) => s.path === step)!.label;
  return (
    <div className="card placeholder">
      {campaign.kind === 'started' ? (
        <>
          <strong>{label} starts once this campaign is under way.</strong> In this prototype, only the sample campaign
          has creators’ edits, readiness, and results.{' '}
        </>
      ) : (
        <>
          <strong>{campaign.name} is a summary.</strong> The prototype’s sample data covers one campaign in full.{' '}
        </>
      )}
      <Link to={`/campaigns/${SAMPLE_CAMPAIGN_ID}/${step}`}>See {label} for the Barrier Serum launch</Link>
    </div>
  );
}
