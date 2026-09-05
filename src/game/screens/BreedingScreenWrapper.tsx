import BreedingScreen from '@/game/BreedingScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function BreedingScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleStartBreeding, handleHatchCreature, handleCancelBreeding } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <BreedingScreen
        team={gameState.player.team} nursery={gameState.player.nursery}
        onClose={() => openScreen('world')}
        onStartBreeding={handleStartBreeding} onHatch={handleHatchCreature} onCancelBreeding={handleCancelBreeding}
      />
    </div>
  )
}
