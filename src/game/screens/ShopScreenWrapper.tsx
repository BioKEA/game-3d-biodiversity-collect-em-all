import Shop from '@/game/Shop'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function ShopScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, setGameState } = useGameActions()
  return (
    <Shop
      coins={gameState.player.coins ?? 0}
      inventory={gameState.player.inventory}
      onBuy={(item, totalPrice) => {
        setGameState(prev => {
          const newInventory = [...prev.player.inventory]
          const existing = newInventory.find(i => i.id === item.id)
          if (existing) {
            existing.quantity += item.quantity
          } else {
            newInventory.push({ ...item })
          }
          return {
            ...prev,
            player: {
              ...prev.player,
              coins: Math.max(0, (prev.player.coins ?? 0) - totalPrice),
              inventory: newInventory,
            },
          }
        })
      }}
      onClose={() => openScreen('world')}
    />
  )
}
