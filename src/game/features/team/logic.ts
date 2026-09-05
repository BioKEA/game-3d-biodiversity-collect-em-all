import type { CapturedCreature, GameState } from '@/types/game'
import { getEvolution, evolveCreature } from '@/game/evolutions'
import type { EvolutionData } from '@/game/features/progression/logic'

export function swapLead(state: GameState, index: number): GameState {
  const newTeam = [...state.player.team]
  const temp = newTeam[0]; newTeam[0] = newTeam[index]; newTeam[index] = temp
  return { ...state, player: { ...state.player, team: newTeam } }
}

export function teachMove(state: GameState, index: number, updated: CapturedCreature, cost: number): GameState {
  const newTeam = [...state.player.team]; newTeam[index] = updated
  return { ...state, player: { ...state.player, team: newTeam, coins: Math.max(0, (state.player.coins ?? 0) - cost) } }
}

export function learnAbility(state: GameState, index: number, abilityId: string, cost: number): GameState {
  const creature = state.player.team[index]
  if (!creature) return state
  const newTeam = [...state.player.team]; newTeam[index] = { ...creature, learnedAbility: abilityId }
  return { ...state, player: { ...state.player, team: newTeam, coins: Math.max(0, (state.player.coins ?? 0) - cost) } }
}

export function manualEvolve(state: GameState, teamIndex: number): { state: GameState; evolution: EvolutionData | null } {
  const creature = state.player.team[teamIndex]
  if (!creature) return { state, evolution: null }
  const evo = getEvolution(creature.id, creature.level)
  if (!evo) return { state, evolution: null }
  const beforeEvo = { ...creature }
  const evolved = evolveCreature(creature, evo)
  const newTeam = [...state.player.team]; newTeam[teamIndex] = evolved
  return { state: { ...state, player: { ...state.player, team: newTeam } }, evolution: { from: beforeEvo, to: evolved, description: evo.description, teamIndex } }
}

export function releaseFromTeam(state: GameState, index: number): GameState {
  if (index === 0 || state.player.team.length <= 1) return state
  return { ...state, player: { ...state.player, team: state.player.team.filter((_, i) => i !== index) } }
}

export function swapFromReserve(state: GameState, reserveIndex: number, teamIndex: number): GameState {
  const newTeam = [...state.player.team]; const newReserves = [...state.player.reserves]
  const swapped = newTeam[teamIndex]; newTeam[teamIndex] = newReserves[reserveIndex]; newReserves[reserveIndex] = swapped
  return { ...state, player: { ...state.player, team: newTeam, reserves: newReserves } }
}

export function adoptFromReserve(state: GameState, reserveIndex: number): GameState {
  if (state.player.team.length >= 6) return state
  const creature = state.player.reserves[reserveIndex]
  return { ...state, player: { ...state.player, team: [...state.player.team, creature], reserves: state.player.reserves.filter((_, i) => i !== reserveIndex) } }
}

export function releaseFromReserve(state: GameState, reserveIndex: number): GameState {
  return { ...state, player: { ...state.player, reserves: state.player.reserves.filter((_, i) => i !== reserveIndex) } }
}
