import RangerDialog from '@/game/RangerDialog'
import { RANGERS } from '@/game/rangers'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function RangerScreenWrapper() {
  const { gameState, ui, playerStats } = useGameState()
  const a = useGameActions()
  if (!gameState.activeRangerId) return null
  const ranger = RANGERS.find(r => r.id === gameState.activeRangerId)
  if (!ranger) return null
  const isTutorial = ui.showTutorialDialog && ranger.id === 'ranger-golden-gate'
  return (
    <RangerDialog
      ranger={ranger} questProgress={gameState.questProgress} player={gameState.player}
      onClose={() => {
        a.setShowTutorialDialog(false)
        a.setGameState(prev => ({ ...prev, screen: 'world', activeRangerId: null }))
      }}
      onAcceptQuest={a.handleAcceptQuest} onClaimReward={a.handleClaimReward} onTrade={a.handleTrade}
      onChallenge={ranger.battleTeam ? () => a.handleStartRangerBattle(ranger.id) : undefined}
      defeated={(playerStats.defeatedRangers ?? []).includes(ranger.id)}
      defeatedRangers={playerStats.defeatedRangers ?? []}
      subregionsVisited={playerStats.uniqueSubregionsVisited ?? []}
      timeOfDay={gameState.timeOfDay}
      isTutorial={isTutorial}
      starterName={isTutorial ? gameState.player.team[0]?.name : undefined}
      onTutorialComplete={isTutorial ? () => {
        a.setShowTutorialDialog(false)
        a.handleAcceptQuest('tutorial-first-catch')
        setTimeout(() => {
          a.triggerTutorial('move_hint', 'Use arrow keys or WASD to explore. Follow the paw prints!')
        }, 500)
      } : undefined}
    />
  )
}
