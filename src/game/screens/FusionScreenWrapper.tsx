import FusionLab from '@/game/FusionLab'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function FusionScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleFusion } = useGameActions()
  return (
    <FusionLab
      team={gameState.player.team}
      onFuse={handleFusion}
      onClose={() => openScreen('world')}
    />
  )
}
