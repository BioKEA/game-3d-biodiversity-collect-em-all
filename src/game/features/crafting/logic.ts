import type { GameState } from '@/types/game'
import { RECIPES, canCraft } from '@/game/crafting'
import { addToInventory } from '@/game/features/progression/logic'

export function applyCraft(state: GameState, recipeId: string): GameState {
  const recipe = RECIPES.find(r => r.id === recipeId)
  if (!recipe || !canCraft(recipe, state.player.inventory)) return state
  let inventory = state.player.inventory
  for (const ing of recipe.ingredients) {
    inventory = inventory.map(i => i.id === ing.itemId ? { ...i, quantity: i.quantity - ing.quantity } : i)
  }
  inventory = addToInventory(inventory, {
    id: recipe.result.itemId, name: recipe.result.name, type: recipe.result.type,
    quantity: recipe.result.quantity, description: recipe.result.description, sprite: recipe.result.sprite,
  })
  return { ...state, player: { ...state.player, inventory } }
}
