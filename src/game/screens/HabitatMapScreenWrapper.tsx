import HabitatMap from '@/game/HabitatMap'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function HabitatMapScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen } = useGameActions()
  return (
    <HabitatMap
      catalogSeen={gameState.player.catalog}
      catalogCaptured={gameState.player.captured}
      onClose={() => openScreen('world')}
    />
  )
}
