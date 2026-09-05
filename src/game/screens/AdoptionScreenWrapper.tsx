import AdoptionCenter from '@/game/AdoptionCenter'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function AdoptionScreenWrapper() {
  const { gameState } = useGameState()
  const {
    openScreen,
    handleReleaseFromTeam,
    handleSwapFromReserve,
    handleAdoptFromReserve,
    handleReleaseFromReserve,
  } = useGameActions()
  return (
    <AdoptionCenter
      team={gameState.player.team}
      reserves={gameState.player.reserves}
      onClose={() => openScreen('world')}
      onRelease={handleReleaseFromTeam}
      onSwapFromReserve={handleSwapFromReserve}
      onAdoptFromReserve={handleAdoptFromReserve}
      onReleaseFromReserve={handleReleaseFromReserve}
    />
  )
}
