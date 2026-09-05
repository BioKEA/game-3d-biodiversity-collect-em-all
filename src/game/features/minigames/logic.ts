import type { Creature, GameState } from '@/types/game'
import { applyPlayerXp, addToInventory, makeBattle } from '@/game/features/progression/logic'

export function applyFishCatch(state: GameState, fish: { xpReward: number }): GameState {
  const { player } = applyPlayerXp(state.player, fish.xpReward)
  return { ...state, player: { ...player, coins: (state.player.coins ?? 0) + fish.xpReward } }
}

export function startDiveEncounter(state: GameState, creature: Creature): GameState {
  if (!state.player.team[0]) return state
  return { ...state, screen: 'battle', battle: makeBattle(creature, state.player.team[0]) }
}

export function applyDiveCollect(state: GameState, item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }): GameState {
  const inventory = addToInventory(state.player.inventory, { ...item, sprite: item.sprite || '📦' })
  return { ...state, player: { ...state.player, inventory } }
}
