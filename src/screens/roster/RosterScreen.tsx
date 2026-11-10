import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { SampleStatePicker, useSampleState } from '../../components/SampleState';
import { roster as sampleRoster } from '../../data';
import { usd } from '../../lib/format';
import { isFirstCampaign, withoutHistory } from '../../lib/states';
import {
  NO_FILTERS,
  blocker,
  filterCreators,
  mixWarning,
  sortCreators,
  summarize,
  type Filters,
  type SortKey,
} from '../../lib/roster';
import { useBrief } from '../../state/BriefContext';
import { usePicks } from '../../state/PicksContext';
import { ScreenHead } from '../ScreenHead';
import { FilterBar } from './FilterBar';
import { RosterTable } from './RosterTable';
import { SummaryBar } from './SummaryBar';

export function RosterScreen() {
  const { campaignId = '' } = useParams();
  const { brief } = useBrief();
  const { picks } = usePicks();
  const preview = useSampleState('roster');
  const roster = useMemo(() => (preview === 'first-campaign' ? withoutHistory(sampleRoster) : sampleRoster), [preview]);
  const first = isFirstCampaign(roster);
  // No past CPA to sort by on a first campaign, so fee until the first readout.
  const [chosenSort, setSort] = useState<SortKey | null>(null);
  const sort: SortKey = chosenSort ?? (first ? 'fee' : 'cpa');
  const [filters, setFilters] = useState<Filters>(NO_FILTERS);

  // Everyone is new on a first campaign, so the new-creator limit doesn't apply.
  const maxNew = first ? Infinity : brief.max_new_creators;
  const summary = summarize(roster, picks, brief.campaign_budget_usd, maxNew);
  const mix = mixWarning(roster, picks, summary.remaining, brief.paid_social_cpa_benchmark_usd);
  const block = blocker(summary, maxNew);
  const rows = useMemo(
    () => filterCreators(sortCreators(roster, sort), filters, picks, summary.remaining),
    [roster, sort, filters, picks, summary.remaining],
  );
  const label = `Draft messages for ${summary.picked} creator${summary.picked === 1 ? '' : 's'}`;

  return (
    <>
      <ScreenHead
        title="Pick creators"
        action={
          block ? (
            <button type="button" className="btn-primary" disabled aria-describedby="roster-blocker">
              {label}
            </button>
          ) : (
            <Link className="btn-primary" to={`/campaigns/${campaignId}/drafts`}>
              {label}
            </Link>
          )
        }
      />
      <SampleStatePicker screen="roster" />
      {first && (
        <p className="card notice notice--blue" role="note">
          This is your first campaign, so no one has past results yet. We’ll sort by fee for now; after this campaign’s
          readout, the roster sorts by CPA and opens with your pools.
        </p>
      )}
      <SummaryBar
        summary={summary}
        budget={brief.campaign_budget_usd}
        maxNew={maxNew}
        mix={mix}
        block={block}
        onShowFixes={(handles) => setFilters({ ...NO_FILTERS, only: handles })}
      />
      <div className="legend">
        <span>
          <strong>Paid social CPA to beat: {usd(brief.paid_social_cpa_benchmark_usd)}</strong>{' '}
          <span className="muted">(from the brief)</span>
        </span>
        <span className="legend__item">
          <span className="dot dot--green" aria-hidden="true" />
          At or under {usd(brief.paid_social_cpa_benchmark_usd)} beats paid social
        </span>
        <span className="legend__item">
          <span className="dot dot--red" aria-hidden="true" />
          Over {usd(brief.paid_social_cpa_benchmark_usd)} costs more than ads
        </span>
      </div>
      <FilterBar sort={sort} onSort={setSort} filters={filters} onFilters={setFilters} />
      <RosterTable
        rows={rows}
        benchmark={brief.paid_social_cpa_benchmark_usd}
        gapGroup={mix && mix.fixes.length > 0 ? mix.group : null}
        gapHandles={new Set(mix?.fixes.map((c) => c.handle))}
      />
    </>
  );
}
