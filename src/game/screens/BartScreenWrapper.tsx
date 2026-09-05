import BartSystem from '@/game/BartSystem'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function BartScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, setGameState } = useGameActions()
  return (
    <BartSystem
      playerX={gameState.player.x}
      playerY={gameState.player.y}
      playerCoins={gameState.player.coins ?? 0}
      onTravel={(destX, destY, destName, fare) => {
        setGameState(prev => ({
          ...prev,
          screen: 'world',
          player: { ...prev.player, x: destX, y: destY, coins: Math.max(0, (prev.player.coins ?? 0) - fare) },
          currentSubregion: destName,
        }))
      }}
      onClose={() => openScreen('world')}
    />
  )
}
