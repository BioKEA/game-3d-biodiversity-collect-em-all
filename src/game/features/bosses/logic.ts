import type { BossDefeat, Creature } from '@/types/game'
import { LUNAR_BOSSES, SHADOW_BOSSES } from '@/game/creatures'

export const BOSS_IDS = new Set([...LUNAR_BOSSES.map(b => b.id), ...SHADOW_BOSSES.map(b => b.id)])

export function recordBossDefeat(defeats: BossDefeat[] | undefined, creature: Creature, gameDay: number | undefined, captured: boolean): BossDefeat[] {
  const next = [...(defeats ?? [])]
  if (BOSS_IDS.has(creature.id)) {
    const isLunar = LUNAR_BOSSES.some(b => b.id === creature.id)
    next.push({ bossId: creature.id, bossName: creature.name, bossSprite: creature.sprite, bossType: isLunar ? 'lunar' : 'shadow', gameDay: gameDay ?? 0, captured })
  }
  return next
}
