import DailyChallenges from '@/game/DailyChallenges'
import { claimChallengeReward } from '@/game/dailyChallengesData'
import { useGameState, useGameActions } from '@/game/core/GameContext'

export default function DailyChallengesScreenWrapper() {
  const { dailyState } = useGameState()
  const { openScreen, setDailyState, setGameState } = useGameActions()
  return (
    <DailyChallenges
      dailyState={dailyState}
      onClaimReward={(challengeId) => {
        const { newState, reward } = claimChallengeReward(dailyState, challengeId)
        setDailyState(newState)
        if (reward > 0) {
          setGameState(prev => ({
            ...prev,
            player: { ...prev.player, coins: (prev.player.coins ?? 0) + reward },
          }))
        }
      }}
      onClose={() => openScreen('world')}
    />
  )
}
