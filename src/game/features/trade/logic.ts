import type { CapturedCreature, GameState } from '@/types/game'
import { RANGERS } from '@/game/rangers'
import { addToInventory } from '@/game/features/progression/logic'

export function applyTrade(state: GameState, tradeId: string): GameState {
  const ranger = RANGERS.find(r => r.trades.some(t => t.id === tradeId))
  const trade = ranger?.trades.find(t => t.id === tradeId)
  if (!trade) return state
  const giveItem = state.player.inventory.find(i => i.id === trade.give.itemId)
  if (!giveItem || giveItem.quantity < trade.give.quantity) return state
  let inventory = state.player.inventory.map(i => i.id === trade.give.itemId ? { ...i, quantity: i.quantity - trade.give.quantity } : i)
  inventory = addToInventory(inventory, {
    id: trade.receive.itemId, name: trade.receive.itemName, type: trade.receive.type,
    quantity: trade.receive.quantity, description: trade.receive.description, sprite: trade.receive.sprite,
  })
  return { ...state, player: { ...state.player, inventory } }
}

export function importCreature(state: GameState, creature: CapturedCreature): GameState {
  if (state.player.team.length >= 6) return state
  return {
    ...state,
    player: {
      ...state.player, team: [...state.player.team, creature],
      catalog: [...new Set([...state.player.catalog, creature.id])],
      captured: [...new Set([...state.player.captured, creature.id])],
    },
  }
}

export function removeTeamMember(state: GameState, index: number): GameState {
  return { ...state, player: { ...state.player, team: state.player.team.filter((_, i) => i !== index) } }
}
