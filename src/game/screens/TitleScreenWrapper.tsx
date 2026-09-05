import TitleScreen from '@/game/TitleScreen'
import { useGameActions } from '@/game/core/GameContext'

export default function TitleScreenWrapper() {
  const { handleLoadSlot, handleNewGame, handleDeleteSlot } = useGameActions()
  return (
    <TitleScreen
      onLoadSlot={handleLoadSlot}
      onNewGame={handleNewGame}
      onDeleteSlot={handleDeleteSlot}
    />
  )
}
