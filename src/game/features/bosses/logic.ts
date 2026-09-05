import type { BossDefeat, CapturedCreature, Creature, GameState, InventoryItem } from '@/types/game'
import { LUNAR_BOSSES, SHADOW_BOSSES } from '@/game/creatures'
import { applyPlayerXp, addToInventory } from '@/game/features/progression/logic'
import { makeBattle } from '@/game/features/battle/logic'

export const BOSS_IDS = new Set([...LUNAR_BOSSES.map(b => b.id), ...SHADOW_BOSSES.map(b => b.id)])

export function recordBossDefeat(defeats: BossDefeat[] | undefined, creature: Creature, gameDay: number | undefined, captured: boolean): BossDefeat[] {
  const next = [...(defeats ?? [])]
  if (BOSS_IDS.has(creature.id)) {
    const isLunar = LUNAR_BOSSES.some(b => b.id === creature.id)
    next.push({ bossId: creature.id, bossName: creature.name, bossSprite: creature.sprite, bossType: isLunar ? 'lunar' : 'shadow', gameDay: gameDay ?? 0, captured })
  }
  return next
}

export function challengeBoss(state: GameState, boss: Creature): GameState {
  return {
    ...state,
    player: { ...state.player, catalog: [...new Set([...state.player.catalog, boss.id])] },
    screen: 'encounter',
    battle: makeBattle(boss, state.player.team[0] as CapturedCreature),
  }
}

export function startAlcatrazBattle(state: GameState, creature: Creature): GameState {
  return { ...state, screen: 'battle', battle: makeBattle(creature, state.player.team[0] as CapturedCreature) }
}

export function applyAlcatrazComplete(state: GameState, rewards: { xp: number; item?: InventoryItem }): GameState {
  const { player } = applyPlayerXp(state.player, rewards.xp)
  const inventory = rewards.item ? addToInventory(state.player.inventory, rewards.item) : state.player.inventory
  return { ...state, screen: 'world', player: { ...player, inventory } }
}

export function applyFusion(state: GameState, idx1: number, idx2: number, result: CapturedCreature): GameState {
  const newTeam = state.player.team.filter((_, i) => i !== idx1 && i !== idx2)
  newTeam.push(result)
  const newCaptured = state.player.captured.includes(result.id) ? state.player.captured : [...state.player.captured, result.id]
  const newCatalog = state.player.catalog.includes(result.id) ? state.player.catalog : [...state.player.catalog, result.id]
  return { ...state, screen: 'world', player: { ...state.player, team: newTeam, captured: newCaptured, catalog: newCatalog } }
}
