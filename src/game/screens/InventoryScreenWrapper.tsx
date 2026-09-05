import TeamScreen from '@/game/TeamScreen'
import { useGameState, useGameActions } from '@/game/core/GameContext'
import { setNickname, healAllTeam, assignHeldItem, petCreature, useHealItem } from '@/game/features/team/logic'

export default function InventoryScreenWrapper() {
  const { gameState } = useGameState()
  const { openScreen, handleSwapLead, handleManualEvolve, setGameState } = useGameActions()
  return (
    <div className="menu-screen-enter">
    <TeamScreen
      team={gameState.player.team}
      inventory={gameState.player.inventory}
      coins={gameState.player.coins ?? 0}
      onClose={() => openScreen('world')}
      onSwapLead={handleSwapLead}
      onNickname={(idx, name) => setGameState(prev => setNickname(prev, idx, name))}
      onEvolve={handleManualEvolve}
      onHealAll={() => setGameState(prev => healAllTeam(prev))}
      onAssignHeldItem={(creatureIdx, itemId) => setGameState(prev => assignHeldItem(prev, creatureIdx, itemId))}
      onPetCreature={(idx) => setGameState(prev => petCreature(prev, idx))}
      onUseHealItem={(itemId, creatureIndex) => setGameState(prev => useHealItem(prev, itemId, creatureIndex))}
    />
    </div>
  )
}
