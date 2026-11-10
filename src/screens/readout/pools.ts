import { poolsConfig } from '../../data';
import { poolOrder, type CustomPool } from '../../lib/readout';

/** Display info for each pool: the defaults from data/pools.json and the brand's custom pools. */
export interface PoolInfo {
  id: string;
  name: string;
  useNextFor: string;
  /** CSS class suffix for color: pool--converters, pool--custom, … */
  tone: string;
  custom: boolean;
}

/** Pools in the order they're checked: custom pools sit where the brand put them, then Test again and Don't rebook. */
export function poolList(custom: CustomPool[]): PoolInfo[] {
  const def = (id: string) => {
    const p = poolsConfig.order.find((o) => o.id === id)!;
    return { id: p.id, name: p.name, useNextFor: p.use_next_for, tone: p.id, custom: false };
  };
  const checked = poolOrder(custom).map((step) =>
    step.kind === 'default'
      ? def(step.id)
      : { id: step.pool.id, name: step.pool.name, useNextFor: 'Your custom pool.', tone: 'custom', custom: true },
  );
  return [...checked, def('test_again'), def('dont_rebook')];
}
