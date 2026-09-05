import StarterSelect from '@/game/StarterSelect'
import { useGameActions } from '@/game/core/GameContext'

export default function StarterScreenWrapper() {
  const { handleSelectStarter } = useGameActions()
  return (
    <StarterSelect
      onSelect={handleSelectStarter}
    />
  )
}
