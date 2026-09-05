import CraftingScreen from '@/game/CraftingScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function CraftingScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleCraft } = useGameActions()
  return (
    <div className="menu-screen-enter">
      <CraftingScreen
        inventory={gameState.player.inventory}
        playerLevel={gameState.player.level}
        onCraft={handleCraft}
        onClose={() => openScreen('world')}
      />
    </div>
  )
}
