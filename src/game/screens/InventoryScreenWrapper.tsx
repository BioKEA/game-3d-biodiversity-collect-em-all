import TeamScreen, { getHealAmount } from '@/game/TeamScreen'
import { HELD_ITEMS } from '@/game/heldItems'
import { adjustHappiness, PET_GAIN } from '@/game/happiness'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function InventoryScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleSwapLead, handleManualEvolve, setGameState } = useGameActions()
  return (
    <div className="menu-screen-enter">
    <TeamScreen team={gameState.player.team} inventory={gameState.player.inventory} coins={gameState.player.coins ?? 0} onClose={() => openScreen('world')} onSwapLead={handleSwapLead} onNickname={(idx, name) => {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          team: prev.player.team.map((c, i) => i === idx ? { ...c, nickname: name } : c),
        },
      }))
    }} onEvolve={handleManualEvolve} onHealAll={() => {
      setGameState(prev => {
        if ((prev.player.coins ?? 0) < 50) return prev
        return {
          ...prev,
          player: {
            ...prev.player,
            coins: (prev.player.coins ?? 0) - 50,
            team: prev.player.team.map(c => ({ ...c, stats: { ...c.stats, hp: c.stats.maxHp } })),
          },
        }
      })
    }} onAssignHeldItem={(creatureIdx, itemId) => {
      setGameState(prev => {
        const creature = prev.player.team[creatureIdx]
        if (!creature) return prev
        const previouslyHeld = creature.heldItem ?? null
        // Build new inventory: refund previous, consume new
        const newInventory = prev.player.inventory.map(it => ({ ...it }))
        if (previouslyHeld) {
          const existing = newInventory.find(it => it.id === previouslyHeld)
          if (existing) {
            existing.quantity += 1
          } else {
            // Look up the held item def to recreate the inventory entry
            // (could happen if the user used the last copy and we filtered the slot)
            const meta = HELD_ITEMS[previouslyHeld]
            if (meta) {
              newInventory.push({
                id: meta.id,
                name: meta.name,
                type: 'held',
                quantity: 1,
                description: meta.description,
                sprite: meta.sprite,
              })
            }
          }
        }
        if (itemId) {
          const slot = newInventory.find(it => it.id === itemId)
          if (!slot || slot.quantity < 1) return prev
          slot.quantity -= 1
        }
        // Drop empty held-item slots so they don't show as "x0"
        const filteredInventory = newInventory.filter(it => it.quantity > 0 || it.type !== 'held')
        const newTeam = prev.player.team.map((c, i) => i === creatureIdx ? { ...c, heldItem: itemId ?? undefined } : c)
        return { ...prev, player: { ...prev.player, inventory: filteredInventory, team: newTeam } }
      })
    }} onPetCreature={(idx) => {
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          team: prev.player.team.map((c, i) => i === idx ? adjustHappiness(c, PET_GAIN) : c),
        },
      }))
    }} onUseHealItem={(itemId, creatureIndex) => {
      setGameState(prev => {
        const item = prev.player.inventory.find(i => i.id === itemId)
        if (!item || item.quantity <= 0) return prev
        const target = prev.player.team[creatureIndex]
        if (!target) return prev
        if (target.stats.hp >= target.stats.maxHp) return prev

        const { hp, fullHeal } = getHealAmount(itemId)
        const newHp = fullHeal ? target.stats.maxHp : Math.min(target.stats.maxHp, target.stats.hp + hp)
        if (newHp <= target.stats.hp) return prev

        const newInventory = prev.player.inventory
          .map(it => it.id === itemId ? { ...it, quantity: it.quantity - 1 } : it)
          .filter(it => it.quantity > 0 || it.type === 'held')
        const newTeam = prev.player.team.map((c, i) =>
          i === creatureIndex ? { ...c, stats: { ...c.stats, hp: newHp } } : c
        )
        return { ...prev, player: { ...prev.player, inventory: newInventory, team: newTeam } }
      })
    }} />
    </div>
  )
}
