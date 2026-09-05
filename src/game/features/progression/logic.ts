import type { BattleState, CapturedCreature, CreatureStats, InventoryItem, MapTile, PlayerState } from '@/types/game'
import type { PlayerStats } from '@/game/achievements'
import { adjustHappiness, BATTLE_WIN_LEAD_GAIN, BATTLE_WIN_BENCH_GAIN, LEVEL_UP_GAIN } from '@/game/happiness'
import { getEvolution, evolveCreature } from '@/game/evolutions'

export const EMPTY_BATTLE: BattleState = {
  active: false, wildCreature: null, playerCreature: null, turn: 'player', log: [], captureChance: 0,
}

export function applyPlayerXp(player: PlayerState, xpGained: number) {
  let newXp = player.xp + xpGained
  let newLevel = player.level
  let newMaxXp = player.maxXp
  const didLevelUp = newXp >= newMaxXp
  while (newXp >= newMaxXp) {
    newXp -= newMaxXp
    newLevel++
    newMaxXp = Math.floor(newMaxXp * 1.3)
  }
  return { player: { ...player, xp: newXp, level: newLevel, maxXp: newMaxXp }, newLevel, didLevelUp }
}

/** Merge by id (immutable). New entries copy exactly the six InventoryItem fields. */
export function addToInventory(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const idx = inventory.findIndex(i => i.id === item.id)
  if (idx >= 0) return inventory.map((i, n) => n === idx ? { ...i, quantity: i.quantity + item.quantity } : i)
  return [...inventory, { id: item.id, name: item.name, type: item.type, quantity: item.quantity, description: item.description, sprite: item.sprite }]
}

export function incrementIfPresent(inventory: InventoryItem[], itemId: string, by: number): InventoryItem[] {
  return inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity + by } : i)
}

export function halveTeamHp(team: CapturedCreature[]): CapturedCreature[] {
  return team.map(c => ({ ...c, stats: { ...c.stats, hp: Math.floor(c.stats.maxHp * 0.5) } }))
}

export function levelUpStats(stats: CreatureStats): CreatureStats {
  return {
    ...stats,
    maxHp: stats.maxHp + 3,
    hp: Math.min(stats.hp + 3, stats.maxHp + 3),
    attack: stats.attack + 2,
    defense: stats.defense + 1,
    speed: stats.speed + 1,
  }
}

export interface EvolutionData { from: CapturedCreature; to: CapturedCreature; description: string; teamIndex: number }

/**
 * Mirrors the team loop in handleBattleWin (withHappiness: true) and
 * handleTrainerBattleWin (withHappiness: false). Only the first evolution
 * in team order is reported, exactly as before.
 */
export function awardTeamXp(team: CapturedCreature[], xpGained: number, opts: { withHappiness: boolean }) {
  const newTeam = [...team]
  let evolution: EvolutionData | null = null
  for (let ti = 0; ti < newTeam.length; ti++) {
    let member = { ...newTeam[ti] }
    member.xp += Math.floor(xpGained * (ti === 0 ? 1 : 0.5))
    if (opts.withHappiness) member = adjustHappiness(member, ti === 0 ? BATTLE_WIN_LEAD_GAIN : BATTLE_WIN_BENCH_GAIN)
    if (member.xp >= member.level * 50) {
      member.xp = 0
      member.level++
      if (opts.withHappiness) member = adjustHappiness(member, LEVEL_UP_GAIN)
      member.stats = levelUpStats(member.stats)
      const evo = getEvolution(member.id, member.level)
      if (evo) {
        const beforeEvo = { ...member }
        const evolved = evolveCreature(member, evo)
        if (!evolution) evolution = { from: beforeEvo, to: evolved, description: evo.description, teamIndex: ti }
        newTeam[ti] = evolved
      } else {
        newTeam[ti] = member
      }
    } else {
      newTeam[ti] = member
    }
  }
  return { team: newTeam, evolution }
}

export function recordStepStats(ps: PlayerStats, tile: MapTile): PlayerStats {
  const newBiomes = ps.uniqueBiomesVisited.includes(tile.biome) ? ps.uniqueBiomesVisited : [...ps.uniqueBiomesVisited, tile.biome]
  const sub = tile.subregion || ''
  const newSubs = sub && !ps.uniqueSubregionsVisited.includes(sub) ? [...ps.uniqueSubregionsVisited, sub] : ps.uniqueSubregionsVisited
  return { ...ps, totalStepsWalked: ps.totalStepsWalked + 1, uniqueBiomesVisited: newBiomes, uniqueSubregionsVisited: newSubs }
}

export function recordRangerDefeat(ps: PlayerStats, rangerId: string | null): PlayerStats {
  const defeated = ps.defeatedRangers ?? []
  const newDefeated = rangerId && !defeated.includes(rangerId) ? [...defeated, rangerId] : defeated
  return { ...ps, rangerBattlesWon: (ps.rangerBattlesWon ?? 0) + 1, defeatedRangers: newDefeated }
}
