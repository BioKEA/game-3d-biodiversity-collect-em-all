import FishingScreen from '@/game/FishingScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function FishingScreenWrapper() {
  const { gameState, ui } = useGameState()
  const { openScreen, handleFishCatch } = useGameActions()
  return (
    <FishingScreen
      biome={gameState.currentBiome}
      onClose={() => openScreen('world')}
      onCatch={handleFishCatch}
      fishLog={ui.fishLog}
    />
  )
}
