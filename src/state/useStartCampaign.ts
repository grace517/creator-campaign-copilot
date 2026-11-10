import { useNavigate } from 'react-router';
import { useBrandKit } from './BrandKitContext';
import { newCampaignFields, useBriefs } from './BriefContext';
import { useCampaigns } from './CampaignsContext';
import { useAllPicks } from './PicksContext';

/**
 * Starts a campaign: a brief prefilled from the brand kit and, when started from a pool, a roster with that
 * pool's creators already picked. Opens the brief, or the roster when creators are picked.
 */
export function useStartCampaign() {
  const { start } = useCampaigns();
  const { kit } = useBrandKit();
  const { updateFor } = useBriefs();
  const picks = useAllPicks();
  const navigate = useNavigate();
  return (opts: { pool?: { id: string; name: string; handles: string[] } } = {}) => {
    const id = start({ fromPool: opts.pool?.id, poolName: opts.pool?.name });
    const name = opts.pool ? `New campaign from ${opts.pool.name}` : 'New campaign';
    updateFor(id, newCampaignFields(kit, name));
    if (opts.pool) picks.set(id, opts.pool.handles);
    navigate(`/campaigns/${id}/brief`);
  };
}
