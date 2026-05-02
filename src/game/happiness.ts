import type { CapturedCreature } from '@/types/game'

export const MAX_HAPPINESS = 100
export const DEFAULT_HAPPINESS = 50
export const PET_GAIN = 5
export const BATTLE_WIN_LEAD_GAIN = 5
export const BATTLE_WIN_BENCH_GAIN = 2
export const LEVEL_UP_GAIN = 3

/** Returns current happiness, defaulting to 50 for legacy saves. */
export function getHappiness(creature: Pick<CapturedCreature, 'happiness'>): number {
  return creature.happiness ?? DEFAULT_HAPPINESS
}

/** Adds delta to happiness, clamped to [0, 100]. Returns a new creature with updated value. */
export function adjustHappiness<T extends { happiness?: number }>(creature: T, delta: number): T {
  const current = creature.happiness ?? DEFAULT_HAPPINESS
  const next = Math.max(0, Math.min(MAX_HAPPINESS, current + delta))
  return { ...creature, happiness: next }
}

/** Extra crit chance (in percentage points) granted by happiness. 100 happiness = +10% crit. */
export function getHappinessCritBonus(creature: Pick<CapturedCreature, 'happiness'>): number {
  return getHappiness(creature) / 10
}

/** Roll a crit based on happiness alone. Return true if it crits. */
export function rollHappinessCrit(creature: Pick<CapturedCreature, 'happiness'>): boolean {
  return Math.random() * 100 < getHappinessCritBonus(creature)
}

export interface HappinessLabel {
  label: string
  emoji: string
  color: string
}

export function getHappinessLabel(value: number): HappinessLabel {
  if (value >= 90) return { label: 'Adoring', emoji: '💖', color: '#f472b6' }
  if (value >= 70) return { label: 'Happy', emoji: '💗', color: '#fb7185' }
  if (value >= 40) return { label: 'Content', emoji: '💛', color: '#fbbf24' }
  if (value >= 20) return { label: 'Neutral', emoji: '🤍', color: '#9ca3af' }
  return { label: 'Wary', emoji: '💔', color: '#64748b' }
}
