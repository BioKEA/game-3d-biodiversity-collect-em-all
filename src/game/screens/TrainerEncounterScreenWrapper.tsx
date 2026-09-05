import TrainerEncounter from '@/game/TrainerEncounter'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function TrainerEncounterScreenWrapper() {
  const { ui } = useGameState()
  const { handleAcceptTrainer, handleDeclineTrainer } = useGameActions()
  if (!ui.pendingTrainer) return null
  return (
    <TrainerEncounter
      trainer={ui.pendingTrainer}
      onAccept={handleAcceptTrainer}
      onDecline={handleDeclineTrainer}
    />
  )
}
