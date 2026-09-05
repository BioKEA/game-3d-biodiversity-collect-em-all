import type { BreedingSlot, CapturedCreature, GameState } from '@/types/game'

export function startBreeding(state: GameState, slot: BreedingSlot): GameState {
  return { ...state, player: { ...state.player, nursery: slot } }
}

export function hatchCreature(state: GameState, creature: CapturedCreature): GameState {
  if (state.player.team.length >= 6) return state
  return {
    ...state,
    player: {
      ...state.player,
      team: [...state.player.team, creature],
      catalog: [...new Set([...state.player.catalog, creature.id])],
      captured: [...new Set([...state.player.captured, creature.id])],
      nursery: null,
    },
  }
}

export function cancelBreeding(state: GameState): GameState {
  return { ...state, player: { ...state.player, nursery: null } }
}
