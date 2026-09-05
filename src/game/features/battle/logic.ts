import type { BattleState, CapturedCreature, Creature, GameState } from '@/types/game'
import type { FriendlyGift } from '@/game/encounterSystem'
import { ALL_CREATURES } from '@/game/creatures'
import { getEvolutionTarget } from '@/game/evolutions'
import { rollMaterialDrops, MATERIALS } from '@/game/crafting'
import { EMPTY_BATTLE, applyPlayerXp, awardTeamXp, halveTeamHp, addToInventory, incrementIfPresent, type EvolutionData } from '@/game/features/progression/logic'
import { BOSS_IDS, recordBossDefeat } from '@/game/features/bosses/logic'

export function makeBattle(creature: Creature, lead: CapturedCreature, log: string[] = [], captureChance = 0): BattleState {
  return { active: true, wildCreature: creature, playerCreature: lead, turn: 'player', log, captureChance }
}

export interface EvolveReadyHint { name: string; sprite: string; toName: string; gap: number }
export interface BattleWinResult {
  state: GameState
  reward: { xp: number; coins: number; levelUp: boolean; isBoss: boolean }
  evolution: EvolutionData | null
  evolveReadyHint: EvolveReadyHint | null
}

/** Hint fires when the lead levelled, did not evolve, and is within 2 levels of its evolution. */
function evolveReadyHint(before: CapturedCreature, after: CapturedCreature, evolution: EvolutionData | null): EvolveReadyHint | null {
  if (after.level <= before.level) return null
  if (evolution && evolution.teamIndex === 0) return null
  const nextEvo = getEvolutionTarget(after.id)
  if (!nextEvo || after.level >= nextEvo.level || nextEvo.level - after.level > 2) return null
  const target = ALL_CREATURES.find(c => c.id === nextEvo.toId)
  if (!target) return null
  return { name: after.nickname || after.name, sprite: after.sprite, toName: target.name, gap: nextEvo.level - after.level }
}

export function applyBattleWin(state: GameState, xpGained: number, ctx: { alcatrazEscapeActive: boolean }): BattleWinResult {
  const { player: leveled, newLevel, didLevelUp } = applyPlayerXp(state.player, xpGained)
  const defeated = state.battle.wildCreature
  const isBossKill = !!(defeated && BOSS_IDS.has(defeated.id))
  const coinsGained = isBossKill ? (50 + newLevel * 5) : (10 + newLevel * 2)

  const newCatalog = defeated ? [...new Set([...state.player.catalog, defeated.id])] : state.player.catalog

  const { team: newTeam, evolution } = awardTeamXp(state.player.team, xpGained, { withHappiness: true })
  const hint = state.player.team.length > 0 ? evolveReadyHint(state.player.team[0], newTeam[0], evolution) : null

  // Material drops (rolls Math.random internally) — after the team loop, as before.
  let newInventory = state.player.inventory
  for (const drop of rollMaterialDrops(state.currentBiome, newLevel)) {
    const mat = MATERIALS.find(m => m.id === drop.itemId)
    const existing = newInventory.some(i => i.id === drop.itemId)
    if (existing) newInventory = incrementIfPresent(newInventory, drop.itemId, drop.quantity)
    else if (mat) newInventory = addToInventory(newInventory, { ...mat, quantity: drop.quantity })
  }

  const wasInvasive = !!defeated && (defeated.conservationStatus === 'INV' || defeated.isNative === false)
  const newInvasivesRemoved = (state.player.invasivesRemoved ?? 0) + (wasInvasive ? 1 : 0)
  const bossDefeats = defeated ? recordBossDefeat(state.bossDefeats, defeated, state.gameDay, false) : [...(state.bossDefeats ?? [])]

  return {
    state: {
      ...state,
      screen: ctx.alcatrazEscapeActive ? 'alcatraz_escape' : 'world',
      player: {
        ...leveled,
        coins: (state.player.coins ?? 0) + coinsGained,
        team: newTeam,
        catalog: newCatalog,
        inventory: newInventory,
        invasivesRemoved: newInvasivesRemoved,
      },
      bossDefeats,
      battle: EMPTY_BATTLE,
    },
    reward: { xp: xpGained, coins: coinsGained, levelUp: didLevelUp, isBoss: isBossKill },
    evolution,
    evolveReadyHint: hint,
  }
}

export function applyBattleLose(state: GameState, ctx: { alcatrazEscapeActive: boolean }): GameState {
  return {
    ...state, screen: ctx.alcatrazEscapeActive ? 'alcatraz_escape' : 'world',
    player: { ...state.player, team: halveTeamHp(state.player.team) },
    battle: EMPTY_BATTLE,
  }
}

export function endBattle(state: GameState, encounterCooldown: number): GameState {
  return { ...state, screen: 'world', battle: EMPTY_BATTLE, encounterCooldown }
}

export function applyUseItem(state: GameState, itemId: string): GameState {
  return {
    ...state,
    player: { ...state.player, inventory: state.player.inventory.map(item => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item) },
  }
}

export function applyBattleSwitch(state: GameState, index: number): GameState {
  if (index <= 0 || index >= state.player.team.length) return state
  const newTeam = [...state.player.team]
  const temp = newTeam[0]
  newTeam[0] = newTeam[index]
  newTeam[index] = temp
  return { ...state, player: { ...state.player, team: newTeam }, battle: { ...state.battle, playerCreature: newTeam[0] } }
}

export function applyFriendlyGift(state: GameState, gift: FriendlyGift): GameState {
  return {
    ...state, screen: 'world',
    player: { ...state.player, inventory: incrementIfPresent(state.player.inventory, gift.itemId, 1) },
    battle: EMPTY_BATTLE,
    encounterCooldown: 5,
  }
}
