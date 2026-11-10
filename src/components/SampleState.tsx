import { useSearchParams } from 'react-router';
import { SAMPLE_CAMPAIGN_ID } from '../data';
import { SAMPLE_STATES, type StateScreen } from '../lib/states';
import { useCampaignId } from '../state/CampaignsContext';

/** The ?state=… this screen is previewing in the sample campaign, or null for the designed view. */
export function useSampleState(screen: StateScreen): string | null {
  const [params] = useSearchParams();
  const id = params.get('state');
  const inSample = useCampaignId() === SAMPLE_CAMPAIGN_ID;
  return inSample && SAMPLE_STATES[screen].some((s) => s.id === id) ? id : null;
}

/**
 * "Sample state" picker: shows an empty, loading, or error state the sample data never reaches on its own.
 * Only in the sample campaign; the choice lives in the URL so a state can be linked to.
 */
export function SampleStatePicker({ screen }: { screen: StateScreen }) {
  const [params, setParams] = useSearchParams();
  const current = useSampleState(screen);
  if (useCampaignId() !== SAMPLE_CAMPAIGN_ID) return null;
  return (
    <label className="sample-state">
      <span className="muted">Sample state</span>
      <select
        className="filter"
        value={current ?? ''}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set('state', e.target.value);
          else next.delete('state');
          setParams(next, { replace: true });
        }}
      >
        <option value="">As designed</option>
        {SAMPLE_STATES[screen].map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}
