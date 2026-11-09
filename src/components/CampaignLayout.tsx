import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router';
import { brief, campaigns, currentCampaign } from '../data';
import { dateRange, usd } from '../lib/format';
import { STEPS, type StepPath } from '../steps';
import { CampaignSwitcher } from './CampaignSwitcher';
import { Stepper } from './Stepper';

/** Every campaign screen: breadcrumb, name, product · window · budget, switcher, and the five-step stepper. */
export function CampaignLayout() {
  const { campaignId = '' } = useParams();
  const { pathname } = useLocation();
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) return <Navigate to="/campaigns" replace />;

  const segment = pathname.split('/').filter(Boolean)[2];
  const step = (STEPS.find((s) => s.path === segment)?.path ?? 'brief') as StepPath;
  const hasData = campaign.id === currentCampaign.id;

  return (
    <>
      <section aria-label="Campaign" className="card campaign-header">
        <div className="campaign-header__top">
          <div>
            <nav aria-label="Breadcrumb" className="breadcrumb">
              <Link to="/campaigns">Campaigns</Link> <span aria-hidden="true">/</span> {campaign.name}
            </nav>
            <h1>{campaign.name}</h1>
            <div className="campaign-header__meta">
              {hasData
                ? `${brief.product} · ${dateRange(brief.window_start, brief.window_end)} · ${usd(brief.campaign_budget_usd)} budget`
                : 'Sample data covers the Barrier Serum launch only.'}
            </div>
          </div>
          <CampaignSwitcher campaignId={campaign.id} step={step} />
        </div>
        <Stepper campaignId={campaign.id} current={step} />
      </section>
      <Outlet />
    </>
  );
}
