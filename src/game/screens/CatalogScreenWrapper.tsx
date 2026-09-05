import CatalogScreen from '@/game/CatalogScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function CatalogScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <CatalogScreen catalogSeen={gameState.player.catalog} catalogCaptured={gameState.player.captured} onClose={() => openScreen('world')} />
    </div>
  )
}
