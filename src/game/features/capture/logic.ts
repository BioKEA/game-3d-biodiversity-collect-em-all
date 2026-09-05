import type { CapturedCreature, Creature, GameState } from '@/types/game'
import type { LogicDeps } from '@/game/core/state'
import { DEFAULT_HAPPINESS } from '@/game/happiness'
import { EMPTY_BATTLE } from '@/game/features/progression/logic'
import { recordBossDefeat } from '@/game/features/bosses/logic'

export interface CaptureResult { state: GameState; isNewSpecies: boolean; teamFull: boolean; teamIndex: number | null }

export function captureCreature(state: GameState, creature: Creature, deps: LogicDeps): CaptureResult {
  const isNewSpecies = !state.player.captured.includes(creature.id)
  const teamFull = state.player.team.length >= 6

  // rng then now — same evaluation order as the original object literal.
  const captured: CapturedCreature = {
    ...creature,
    level: Math.max(1, state.player.level - 1 + Math.floor(deps.rng() * 3)),
    xp: 0,
    capturedAt: deps.now(),
    capturedBiome: state.currentBiome,
    happiness: DEFAULT_HAPPINESS,
  }

  const newTeam = !teamFull ? [...state.player.team, captured] : state.player.team
  const newReserves = teamFull ? [...state.player.reserves, captured] : state.player.reserves

  const journalWithCapture = { ...state.player.journal }
  const subregion = state.currentSubregion
  if (subregion && journalWithCapture[subregion]) {
    const entry = journalWithCapture[subregion]
    if (!entry.creaturesCaptured.includes(creature.id)) {
      journalWithCapture[subregion] = { ...entry, creaturesCaptured: [...entry.creaturesCaptured, creature.id] }
    }
  }

  return {
    state: {
      ...state, screen: 'world',
      player: {
        ...state.player, team: newTeam, reserves: newReserves,
        catalog: [...new Set([...state.player.catalog, creature.id])],
        captured: [...new Set([...state.player.captured, creature.id])],
        journal: journalWithCapture,
      },
      bossDefeats: recordBossDefeat(state.bossDefeats, creature, state.gameDay, true),
      battle: EMPTY_BATTLE,
    },
    isNewSpecies, teamFull, teamIndex: teamFull ? null : newTeam.length - 1,
  }
}
