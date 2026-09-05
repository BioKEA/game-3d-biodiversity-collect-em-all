import type { CapturedCreature, GameState, InventoryItem } from '@/types/game'
import { getEvolution, evolveCreature } from '@/game/evolutions'
import { adjustHappiness, PET_GAIN } from '@/game/happiness'
import { HELD_ITEMS } from '@/game/heldItems'
import { getHealAmount } from '@/game/healItems'
import { incrementIfPresent, type EvolutionData } from '@/game/features/progression/logic'

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

/**
 * The five inventory-screen transitions, lifted out of the inline
 * `setGameState` updaters that used to live in
 * `screens/InventoryScreenWrapper.tsx`. Bodies are verbatim except that
 * in-place item mutation is replaced by the immutable helpers in
 * `features/progression/logic.ts`; final values are identical.
 */
export function setNickname(state: GameState, index: number, nickname: string | undefined): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      team: state.player.team.map((c, i) => i === index ? { ...c, nickname } : c),
    },
  }
}

export function healAllTeam(state: GameState): GameState {
  if ((state.player.coins ?? 0) < 50) return state
  return {
    ...state,
    player: {
      ...state.player,
      coins: (state.player.coins ?? 0) - 50,
      team: state.player.team.map(c => ({ ...c, stats: { ...c.stats, hp: c.stats.maxHp } })),
    },
  }
}

export function assignHeldItem(state: GameState, creatureIdx: number, itemId: string | null): GameState {
  const creature = state.player.team[creatureIdx]
  if (!creature) return state
  const previouslyHeld = creature.heldItem ?? null
  // Build new inventory: refund previous, consume new
  let newInventory: InventoryItem[] = state.player.inventory
  if (previouslyHeld) {
    const existing = newInventory.find(it => it.id === previouslyHeld)
    if (existing) {
      newInventory = incrementIfPresent(newInventory, previouslyHeld, 1)
    } else {
      // Look up the held item def to recreate the inventory entry
      // (could happen if the user used the last copy and we filtered the slot)
      const meta = HELD_ITEMS[previouslyHeld]
      if (meta) {
        newInventory = [...newInventory, {
          id: meta.id,
          name: meta.name,
          type: 'held',
          quantity: 1,
          description: meta.description,
          sprite: meta.sprite,
        }]
      }
    }
  }
  if (itemId) {
    const slot = newInventory.find(it => it.id === itemId)
    if (!slot || slot.quantity < 1) return state
    newInventory = incrementIfPresent(newInventory, itemId, -1)
  }
  // Drop empty held-item slots so they don't show as "x0"
  const filteredInventory = newInventory.filter(it => it.quantity > 0 || it.type !== 'held')
  const newTeam = state.player.team.map((c, i) => i === creatureIdx ? { ...c, heldItem: itemId ?? undefined } : c)
  return { ...state, player: { ...state.player, inventory: filteredInventory, team: newTeam } }
}

export function petCreature(state: GameState, index: number): GameState {
  return {
    ...state,
    player: {
      ...state.player,
      team: state.player.team.map((c, i) => i === index ? adjustHappiness(c, PET_GAIN) : c),
    },
  }
}

export function useHealItem(state: GameState, itemId: string, creatureIndex: number): GameState {
  const item = state.player.inventory.find(i => i.id === itemId)
  if (!item || item.quantity <= 0) return state
  const target = state.player.team[creatureIndex]
  if (!target) return state
  if (target.stats.hp >= target.stats.maxHp) return state

  const { hp, fullHeal } = getHealAmount(itemId)
  const newHp = fullHeal ? target.stats.maxHp : Math.min(target.stats.maxHp, target.stats.hp + hp)
  if (newHp <= target.stats.hp) return state

  const newInventory = state.player.inventory
    .map(it => it.id === itemId ? { ...it, quantity: it.quantity - 1 } : it)
    .filter(it => it.quantity > 0 || it.type === 'held')
  const newTeam = state.player.team.map((c, i) =>
    i === creatureIndex ? { ...c, stats: { ...c.stats, hp: newHp } } : c
  )
  return { ...state, player: { ...state.player, inventory: newInventory, team: newTeam } }
}
