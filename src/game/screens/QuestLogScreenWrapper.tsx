import QuestLog from '@/game/QuestLog'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function QuestLogScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <QuestLog
        questProgress={gameState.questProgress}
        player={gameState.player}
        onClose={() => openScreen('world')}
      />
    </div>
  )
}
