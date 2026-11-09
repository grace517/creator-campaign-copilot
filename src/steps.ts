/** The five campaign steps, in order. `path` is the route segment under /campaigns/:campaignId/. */
export const STEPS = [
  { path: 'brief', label: 'Brief' },
  { path: 'roster', label: 'Roster' },
  { path: 'drafts', label: 'Drafts' },
  { path: 'status', label: 'Status' },
  { path: 'readout', label: 'Readout' },
] as const;

export type StepPath = (typeof STEPS)[number]['path'];
