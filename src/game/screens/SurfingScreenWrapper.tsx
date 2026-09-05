import SurfingMinigame from '@/game/SurfingMinigame'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function SurfingScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, setGameState } = useGameActions()
  return (
    <SurfingMinigame
      playerLevel={gameState.player.level}
      onClose={() => openScreen('world')}
      onReward={(item) => {
        setGameState(prev => {
          const existing = prev.player.inventory.find(i => i.name === item.name)
          return {
            ...prev,
            player: {
              ...prev.player,
              inventory: existing
                ? prev.player.inventory.map(i => i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i)
                : [...prev.player.inventory, item],
            },
          }
        })
      }}
      onXp={(amount) => {
        setGameState(prev => ({
          ...prev,
          player: { ...prev.player, xp: prev.player.xp + amount },
        }))
      }}
    />
  )
}
