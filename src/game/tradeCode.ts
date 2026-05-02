import type { CapturedCreature } from '@/types/game'
import { ALL_CREATURES } from './creatures'

// Trade code format: compact JSON → base64
// Contains only the essential data to reconstruct a creature

interface TradePayload {
  /** creature base ID */
  i: string
  /** level */
  l: number
  /** xp */
  x: number
  /** nickname (optional) */
  n?: string
  /** captured biome */
  b: string
  /** stat overrides: [hp, maxHp, attack, defense, speed] */
  s: [number, number, number, number, number]
  /** trade timestamp */
  t: number
}

const CODE_PREFIX = 'BQ-'

export function encodeCreature(creature: CapturedCreature): string {
  const payload: TradePayload = {
    i: creature.id,
    l: creature.level,
    x: creature.xp,
    b: creature.capturedBiome,
    s: [
      creature.stats.hp,
      creature.stats.maxHp,
      creature.stats.attack,
      creature.stats.defense,
      creature.stats.speed,
    ],
    t: Date.now(),
  }
  if (creature.nickname) {
    payload.n = creature.nickname
  }

  const json = JSON.stringify(payload)
  const encoded = btoa(json)
  return CODE_PREFIX + encoded
}

export function decodeCreature(code: string): CapturedCreature | { error: string } {
  try {
    const trimmed = code.trim()
    if (!trimmed.startsWith(CODE_PREFIX)) {
      return { error: 'Invalid code format. Codes start with "BQ-".' }
    }

    const encoded = trimmed.slice(CODE_PREFIX.length)
    const json = atob(encoded)
    const payload = JSON.parse(json) as TradePayload

    // Validate creature exists
    const base = ALL_CREATURES.find(c => c.id === payload.i)
    if (!base) {
      return { error: 'Unknown creature. The code may be from a different version.' }
    }

    // Check code age (reject codes older than 30 days)
    const age = Date.now() - payload.t
    if (age > 30 * 24 * 60 * 60 * 1000) {
      return { error: 'This trade code has expired (older than 30 days).' }
    }

    // Reconstruct the creature
    const creature: CapturedCreature = {
      ...base,
      level: payload.l,
      xp: payload.x,
      nickname: payload.n,
      capturedAt: new Date(payload.t).toISOString(),
      capturedBiome: payload.b as CapturedCreature['capturedBiome'],
      stats: {
        hp: payload.s[0],
        maxHp: payload.s[1],
        attack: payload.s[2],
        defense: payload.s[3],
        speed: payload.s[4],
      },
    }

    return creature
  } catch {
    return { error: 'Could not read trade code. It may be corrupted.' }
  }
}

export function isDecodeError(result: CapturedCreature | { error: string }): result is { error: string } {
  return 'error' in result
}
