import FieldJournal from '@/game/FieldJournal'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function JournalScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <FieldJournal journal={gameState.player.journal} currentSubregion={gameState.currentSubregion} onClose={() => openScreen('world')} weatherAlmanac={gameState.weatherAlmanac} currentWeather={gameState.weather} gameDay={gameState.gameDay} visitedLandmarks={gameState.visitedLandmarks} />
    </div>
  )
}
