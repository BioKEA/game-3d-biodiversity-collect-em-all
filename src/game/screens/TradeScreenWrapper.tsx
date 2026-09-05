import TradeCenter from '@/game/TradeCenter'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function TradeScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleImportCreature, handleTradeRemoveCreature } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <TradeCenter
        team={gameState.player.team}
        onClose={() => openScreen('world')}
        onImportCreature={handleImportCreature} onRemoveCreature={handleTradeRemoveCreature}
      />
    </div>
  )
}
