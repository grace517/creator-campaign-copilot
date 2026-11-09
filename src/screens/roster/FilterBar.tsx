import { roster } from '../../data';
import { NO_FILTERS, SORT_LABELS, type Filters, type SortKey } from '../../lib/roster';

const NICHES = [...new Set(roster.map((c) => c.niche))].sort();

/** Sort and filter row. Controls look like the design's buttons; an active one is tinted blue. */
export function FilterBar({
  sort,
  onSort,
  filters: f,
  onFilters,
}: {
  sort: SortKey;
  onSort: (s: SortKey) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
}) {
  const set = (patch: Partial<Filters>) => onFilters({ ...f, ...patch, only: null });
  const cls = (active: boolean) => `filter${active ? ' is-active' : ''}`;
  return (
    <div className="filters" role="group" aria-label="Sort and filter creators">
      <label className="sr-only" htmlFor="roster-sort">
        Sort
      </label>
      <select id="roster-sort" className={cls(true)} value={sort} onChange={(e) => onSort(e.target.value as SortKey)}>
        {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
          <option key={k} value={k}>
            Sort: {SORT_LABELS[k]}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="roster-niche">
        Niche
      </label>
      <select
        id="roster-niche"
        className={cls(f.niche !== null)}
        value={f.niche ?? ''}
        onChange={(e) => set({ niche: e.target.value || null })}
      >
        <option value="">Niche</option>
        {NICHES.map((n) => (
          <option key={n} value={n}>
            Niche: {n}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="roster-track">
        Track record
      </label>
      <select
        id="roster-track"
        className={cls(f.track !== 'all')}
        value={f.track}
        onChange={(e) => set({ track: e.target.value as Filters['track'] })}
      >
        <option value="all">Proven or new</option>
        <option value="proven">Proven only</option>
        <option value="new">New only</option>
      </select>
      <button
        type="button"
        className={cls(f.backupsOnly)}
        aria-pressed={f.backupsOnly}
        onClick={() => set({ backupsOnly: !f.backupsOnly })}
      >
        Backups only
      </button>
      <button
        type="button"
        className={cls(f.fitsBudget)}
        aria-pressed={f.fitsBudget}
        onClick={() => set({ fitsBudget: !f.fitsBudget })}
      >
        Fits remaining budget
      </button>
      {f.only && (
        <button type="button" className="filter is-active" onClick={() => onFilters(NO_FILTERS)}>
          Showing creators who close the gap <span aria-hidden="true">×</span>
          <span className="sr-only">, clear</span>
        </button>
      )}
    </div>
  );
}
