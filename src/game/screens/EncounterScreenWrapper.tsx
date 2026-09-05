import EncounterTransition from '@/game/EncounterTransition'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function EncounterScreenWrapper() {
  const { gameState } = useGameState()
  const { handleEncounterComplete } = useGameActions()
  if (!gameState.battle.wildCreature) return null
  return (
    <EncounterTransition
      creature={gameState.battle.wildCreature}
      biome={gameState.currentBiome}
      timeOfDay={gameState.timeOfDay}
      onComplete={handleEncounterComplete}
    />
  )
}
