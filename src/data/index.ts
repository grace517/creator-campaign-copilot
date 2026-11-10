import brandKitText from '../../data/brand_kit.json?raw';
import briefText from '../../data/brief.json?raw';
import cachedJudgmentsText from '../../data/cached/claim_judgments.json?raw';
import cachedStartersText from '../../data/cached/starter_dms.json?raw';
import demoStateText from '../../data/demo_state.json?raw';
import poolsText from '../../data/pools.json?raw';
import resultsText from '../../data/results.csv?raw';
import rosterText from '../../data/roster.csv?raw';
import {
  parseBrandKit,
  parseBrief,
  parseCachedJudgments,
  parseCachedStarters,
  parseDemoState,
  parsePools,
  parseResults,
  parseRoster,
} from './parse';

/** Every file in data/, parsed and validated once at load. A malformed file fails loudly here, not deep in a screen. */
export const brief = parseBrief(briefText);
export const roster = parseRoster(rosterText);
export const results = parseResults(resultsText);
export const poolsConfig = parsePools(poolsText);
export const demoState = parseDemoState(demoStateText);
export const brandKit = parseBrandKit(brandKitText);
export const cachedStarters = parseCachedStarters(cachedStartersText);
export const cachedJudgments = parseCachedJudgments(cachedJudgmentsText);

export { campaigns, currentCampaign, type CampaignSummary } from './campaigns';
export type * from './schema';
