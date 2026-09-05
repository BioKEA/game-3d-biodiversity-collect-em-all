import type { GameState } from '@/types/game'
import type { ArenaTier } from '@/game/arena'
import type { RoamingTrainer } from '@/game/roamingTrainers'
import { applyPlayerXp, halveTeamHp, addToInventory, awardTeamXp, type EvolutionData } from '@/game/features/progression/logic'

export function startRangerBattle(state: GameState, rangerId: string): GameState {
  return { ...state, screen: 'ranger_battle', activeRangerId: rangerId }
}

export function applyRangerBattleWin(state: GameState, xp: number): GameState {
  const { player, newLevel } = applyPlayerXp(state.player, xp)
  return { ...state, screen: 'world', activeRangerId: null, player: { ...player, coins: (state.player.coins ?? 0) + 30 + newLevel * 3 } }
}

export function applyRangerBattleLose(state: GameState): GameState {
  return { ...state, screen: 'world', activeRangerId: null, player: { ...state.player, team: halveTeamHp(state.player.team) } }
}

export function leaveRangerScreen(state: GameState): GameState {
  return { ...state, screen: 'world', activeRangerId: null }
}

export function applyArenaWin(state: GameState, xp: number, coins: number, tier: ArenaTier): GameState {
  const { player } = applyPlayerXp(state.player, xp)
  return {
    ...state,
    player: { ...player, coins: (state.player.coins ?? 0) + coins },
    arenaWins: { ...state.arenaWins, [tier]: (state.arenaWins[tier] ?? 0) + 1 },
  }
}

export function applyArenaLose(state: GameState): GameState {
  return { ...state, player: { ...state.player, team: halveTeamHp(state.player.team) } }
}

export function applyDeclineTrainer(state: GameState): GameState {
  return { ...state, screen: 'world', encounterCooldown: 8 }
}

export function applyTrainerBattleWin(state: GameState, xp: number, trainer: RoamingTrainer | null): { state: GameState; evolution: EvolutionData | null } {
  const { player, newLevel } = applyPlayerXp(state.player, xp)
  let newInventory = state.player.inventory
  if (trainer?.rewardItem) newInventory = addToInventory(newInventory, trainer.rewardItem)
  const { team, evolution } = awardTeamXp(state.player.team, xp, { withHappiness: false })
  return {
    state: {
      ...state, screen: 'world', activeRangerId: null,
      player: { ...player, coins: (state.player.coins ?? 0) + 30 + newLevel * 3, team, inventory: newInventory },
    },
    evolution,
  }
}
