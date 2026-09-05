import MoveTutorScreen from '@/game/MoveTutorScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function MoveTutorScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleTeachMove, handleLearnAbility } = useGameActions()
  return (
    <MoveTutorScreen
      team={gameState.player.team}
      coins={gameState.player.coins ?? 0}
      onTeachMove={handleTeachMove}
      onLearnAbility={handleLearnAbility}
      onClose={() => openScreen('world')}
    />
  )
}
