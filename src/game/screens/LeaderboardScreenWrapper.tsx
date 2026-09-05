import Leaderboard from '@/game/Leaderboard'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function LeaderboardScreenWrapper() {
  const { gameState, playerName, playerStats } = useGameState()
  const { openScreen, handleRenamePlayer } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <Leaderboard
        playerName={playerName}
        playerLevel={gameState.player.level}
        speciesCaught={gameState.player.captured.length}
        totalSpecies={56}
        stats={playerStats}
        onClose={() => openScreen('world')}
        onRename={handleRenamePlayer}
      />
    </div>
  )
}
