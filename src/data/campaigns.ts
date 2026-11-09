/**
 * The four sample campaigns from design/Campaigns.dc.html. Only the Barrier Serum launch has full data (data/);
 * the others exist so the switcher and Campaigns home have something to show. Fictional, like everything here.
 */
export interface CampaignSummary {
  id: string;
  name: string;
}

export const campaigns: CampaignSummary[] = [
  { id: 'barrier-serum-launch', name: 'Barrier Serum launch' },
  { id: 'holiday-gift-set', name: 'Holiday gift set' },
  { id: 'spf-relaunch', name: 'SPF relaunch' },
  { id: 'night-cream-teaser', name: 'Night cream teaser' },
];

export const currentCampaign = campaigns[0]!;
