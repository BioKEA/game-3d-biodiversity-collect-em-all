import BayDex from '@/game/BayDex'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function BayDexScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <BayDex catalogSeen={gameState.player.catalog} catalogCaptured={gameState.player.captured} defaultSelectedId={gameState.player.team[0]?.id ?? null} playerTeam={gameState.player.team} onClose={() => openScreen('world')} />
    </div>
  )
}
