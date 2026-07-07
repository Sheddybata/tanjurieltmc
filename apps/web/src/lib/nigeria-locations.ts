import statesJson from '../../../../packages/shared/data/states.json';
import lgasJson from '../../../../packages/shared/data/lgas.json';

export const NIGERIA_STATES = statesJson as string[];

export const NIGERIA_LGAS = lgasJson as Record<string, string[]>;

export function lgasForState(state: string): string[] {
  return NIGERIA_LGAS[state] ?? [];
}
