import AchievementsScreen from '@/game/AchievementsScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function AchievementsScreenWrapper() {
  const { gameState, playerStats, unlockedAchievements } = useGameState()
  const { openScreen } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <AchievementsScreen
        gameState={gameState}
        stats={playerStats}
        unlockedIds={unlockedAchievements}
        onClose={() => openScreen('world')}
      />
    </div>
  )
}
