import ArenaScreen from '@/game/ArenaScreen'
import type { ArenaTier } from '@/game/arena'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function ArenaScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleArenaWin, handleArenaLose } = useGameActions()
  return (
    <ArenaScreen
      team={gameState.player.team}
      weather={gameState.weather}
      timeOfDay={gameState.timeOfDay}
      arenaWins={gameState.arenaWins as Record<ArenaTier, number>}
      onWin={handleArenaWin}
      onLose={handleArenaLose}
      onClose={() => openScreen('world')}
    />
  )
}
