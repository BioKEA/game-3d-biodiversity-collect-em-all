import { useState } from 'react'
import type { InventoryItem } from '@/types/game'
import { RECIPES, MATERIALS, canCraft, type CraftingRecipe } from './crafting'
import { SFX } from './sounds'
import PixelIcon from './PixelIcon'

interface Props {
  inventory: InventoryItem[]
  playerLevel: number
  onCraft: (recipeId: string) => void
  onClose: () => void
}

export default function CraftingScreen({ inventory, playerLevel, onCraft, onClose }: Props) {
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null)
  const [craftAnimation, setCraftAnimation] = useState(false)
  const [justCrafted, setJustCrafted] = useState<string | null>(null)

  const getItemCount = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId)
    return item?.quantity ?? 0
  }

  const getMaterialInfo = (itemId: string) => {
    return MATERIALS.find(m => m.id === itemId)
  }

  const handleCraft = (recipe: CraftingRecipe) => {
    if (!canCraft(recipe, inventory)) return
    setCraftAnimation(true)
    SFX.hatch()
    setTimeout(() => {
      onCraft(recipe.id)
      setCraftAnimation(false)
      setJustCrafted(recipe.id)
      setTimeout(() => setJustCrafted(null), 1500)
    }, 600)
  }

  const unlockedRecipes = RECIPES.filter(r => playerLevel >= r.unlockLevel)
  const lockedRecipes = RECIPES.filter(r => playerLevel < r.unlockLevel)

  // Material summary
  const materialItems = inventory.filter(i => i.type === 'material' && i.quantity > 0)

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-2"
      style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)' }}>
      <div className="w-full max-w-md max-h-[95vh] flex flex-col rounded-xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #1a1520 0%, #12101a 50%, #0d0b14 100%)', border: '1px solid rgba(139,92,246,0.2)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/30"
          style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.1) 0%, transparent 100%)' }}>
          <div className="flex items-center gap-2">
            <PixelIcon icon="⚗️" size={30} variant="mystic" selected />
            <span className="text-white font-bold text-sm tracking-wide">Crafting</span>
            <span className="text-purple-400/60 text-[10px] ml-1">Lv.{playerLevel}</span>
          </div>
          <button onClick={onClose}
            className="text-white/40 hover:text-white/80 text-lg transition-colors w-7 h-7 flex items-center justify-center rounded hover:bg-white/5">
            ✕
          </button>
        </div>

        {/* Materials bar */}
        <div className="px-3 py-2 border-b border-purple-900/20 bg-purple-950/20">
          <div className="text-[9px] text-purple-300/50 uppercase tracking-wider mb-1.5 font-medium">Materials</div>
          {materialItems.length === 0 ? (
            <div className="text-white/30 text-[10px] italic">No materials yet — win battles to collect!</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {materialItems.map(item => (
                <div key={item.id}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5">
                  <PixelIcon icon={item.sprite} size={18} variant="item" />
                  <span className="text-white/70 text-[10px]">{item.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
          {unlockedRecipes.map(recipe => {
            const craftable = canCraft(recipe, inventory)
            const isSelected = selectedRecipe?.id === recipe.id
            const wasCrafted = justCrafted === recipe.id

            return (
              <div key={recipe.id}
                onClick={() => setSelectedRecipe(isSelected ? null : recipe)}
                className={`rounded-lg border transition-all duration-200 cursor-pointer ${
                  wasCrafted
                    ? 'border-green-500/40 bg-green-950/30'
                    : isSelected
                      ? 'border-purple-500/40 bg-purple-950/30'
                      : craftable
                        ? 'border-white/10 bg-white/[0.03] hover:border-purple-500/30 hover:bg-purple-950/20'
                        : 'border-white/5 bg-white/[0.01] opacity-60'
                }`}>
                {/* Recipe header */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <div className={craftAnimation && isSelected ? 'animate-pulse' : ''}>
                    <PixelIcon icon={recipe.sprite} size={34} variant="mystic" selected={craftable || isSelected} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white/90 text-xs font-semibold">{recipe.name}</span>
                      <span className="text-purple-400/50 text-[9px]">×{recipe.result.quantity}</span>
                    </div>
                    <div className="text-white/30 text-[10px] mt-0.5 truncate">{recipe.description}</div>
                  </div>
                  {wasCrafted && (
                    <span className="text-green-400 text-[10px] font-medium">Crafted!</span>
                  )}
                </div>

                {/* Expanded details */}
                {isSelected && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/5">
                    {/* Ingredients */}
                    <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Ingredients</div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {recipe.ingredients.map(ing => {
                        const mat = getMaterialInfo(ing.itemId)
                        const have = getItemCount(ing.itemId)
                        const enough = have >= ing.quantity
                        return (
                          <div key={ing.itemId}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] ${
                              enough ? 'border-green-500/20 bg-green-950/20 text-green-300/80' : 'border-red-500/20 bg-red-950/20 text-red-300/80'
                            }`}>
                            <PixelIcon icon={mat?.sprite ?? '?'} size={20} variant={enough ? 'nature' : 'danger'} />
                            <span>{mat?.name ?? ing.itemId}</span>
                            <span className="font-mono font-bold">{have}/{ing.quantity}</span>
                          </div>
                        )
                      })}
                    </div>

                    {/* Result preview */}
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 border border-white/5 mb-3">
                      <span className="text-[9px] text-white/30">→</span>
                      <PixelIcon icon={recipe.result.sprite} size={24} variant="item" selected />
                      <span className="text-white/70 text-[10px]">{recipe.result.name} ×{recipe.result.quantity}</span>
                      <span className="text-white/20 text-[9px] ml-auto">{recipe.result.description}</span>
                    </div>

                    {/* Craft button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCraft(recipe) }}
                      disabled={!craftable || craftAnimation}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                        craftable
                          ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/30 active:scale-[0.98]'
                          : 'bg-white/5 text-white/20 cursor-not-allowed'
                      }`}>
                      {craftAnimation ? '⚗️ Crafting...' : craftable ? '⚗️ Craft' : 'Missing materials'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* Locked recipes */}
          {lockedRecipes.length > 0 && (
            <>
              <div className="text-[9px] text-white/20 uppercase tracking-wider mt-4 mb-1 px-1">Locked</div>
              {lockedRecipes.map(recipe => (
                <div key={recipe.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/5 bg-white/[0.01] opacity-40">
                  <PixelIcon icon="🔒" size={32} variant="neutral" />
                  <div className="flex-1">
                    <span className="text-white/50 text-xs">{recipe.name}</span>
                    <div className="text-white/20 text-[10px]">Unlocks at level {recipe.unlockLevel}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
