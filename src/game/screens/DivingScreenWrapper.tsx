import DivingMinigame from '@/game/DivingMinigame'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function DivingScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleDiveEncounter, handleDiveCollect } = useGameActions()
  return (
    <DivingMinigame
      playerLevel={gameState.player.level}
      onClose={() => openScreen('world')}
      onEncounter={handleDiveEncounter}
      onCollect={handleDiveCollect}
      captured={gameState.player.captured}
    />
  )
}
