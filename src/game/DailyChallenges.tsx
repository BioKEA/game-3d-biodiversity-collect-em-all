import { useState } from 'react'
import type { DailyChallenge, DailyState } from './dailyChallengesData'
import { getTodaysChallenges } from './dailyChallengesData'
import PixelIcon from './PixelIcon'

interface Props {
  dailyState: DailyState
  onClaimReward: (challengeId: string) => void
  onClose: () => void
}

export default function DailyChallenges({ dailyState, onClaimReward, onClose }: Props) {
  const challenges = getTodaysChallenges()
  const [claimedFlash, setClaimedFlash] = useState<string | null>(null)

  const handleClaim = (challengeId: string) => {
    onClaimReward(challengeId)
    setClaimedFlash(challengeId)
    setTimeout(() => setClaimedFlash(null), 1500)
  }

  // Count completed / total
  const completedCount = dailyState.challenges.filter(cp => {
    const def = challenges.find(c => c.id === cp.challengeId)
    return def && cp.progress >= def.target
  }).length
  const claimedCount = dailyState.challenges.filter(cp => cp.claimed).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div
        className="relative w-[95vw] max-w-md max-h-[85vh] overflow-y-auto rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 pt-5 pb-3" style={{ background: 'linear-gradient(180deg, #1a1a2e 80%, transparent)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <PixelIcon icon="📋" size={34} variant="gold" selected />
              <h2 className="text-xl font-bold text-white">Daily Challenges</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-white/50">
              {completedCount}/{challenges.length} completed
            </span>
            {dailyState.streak > 0 && (
              <span className="text-orange-400 font-medium inline-flex items-center gap-1">
                <PixelIcon icon="🔥" size={18} variant="danger" />
                {dailyState.streak} day streak
              </span>
            )}
            {claimedCount === challenges.length && (
              <span className="text-yellow-400 font-medium">All claimed!</span>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(completedCount / challenges.length) * 100}%`,
                background: 'linear-gradient(90deg, #f59e0b, #f97316)',
              }}
            />
          </div>
        </div>

        {/* Challenge cards */}
        <div className="px-5 pb-5 space-y-3">
          {challenges.map((challenge) => {
            const cp = dailyState.challenges.find(c => c.challengeId === challenge.id)
            if (!cp) return null
            const progress = cp.progress
            const isComplete = progress >= challenge.target
            const isClaimed = cp.claimed
            const justClaimed = claimedFlash === challenge.id

            return (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                progress={progress}
                isComplete={isComplete}
                isClaimed={isClaimed}
                justClaimed={justClaimed}
                onClaim={() => handleClaim(challenge.id)}
              />
            )
          })}
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-4 text-center text-xs text-white/30">
          Challenges reset daily at midnight
        </div>
      </div>
    </div>
  )
}

function ChallengeCard({
  challenge,
  progress,
  isComplete,
  isClaimed,
  justClaimed,
  onClaim,
}: {
  challenge: DailyChallenge
  progress: number
  isComplete: boolean
  isClaimed: boolean
  justClaimed: boolean
  onClaim: () => void
}) {
  const pct = Math.min(100, (progress / challenge.target) * 100)

  return (
    <div
      className="rounded-xl p-4 transition-all duration-300"
      style={{
        background: isClaimed
          ? 'rgba(255,255,255,0.03)'
          : isComplete
            ? 'rgba(245,158,11,0.12)'
            : 'rgba(255,255,255,0.06)',
        border: `1px solid ${
          isClaimed ? 'rgba(255,255,255,0.05)' : isComplete ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'
        }`,
        opacity: isClaimed ? 0.6 : 1,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: isClaimed
              ? 'rgba(255,255,255,0.05)'
              : 'rgba(255,255,255,0.08)',
          }}
        >
          <PixelIcon icon={isClaimed ? '✅' : challenge.icon} size={30} variant={isClaimed ? 'nature' : 'gold'} selected={!isClaimed} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white truncate">
              {challenge.title}
            </h3>
            <div className="flex items-center gap-1 text-yellow-400 text-xs font-medium ml-2 flex-shrink-0">
              <PixelIcon icon="💰" size={16} variant="gold" />
              <span>{challenge.reward}</span>
            </div>
          </div>

          <p className="text-xs text-white/50 mb-2">{challenge.description}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                    : 'linear-gradient(90deg, #3b82f6, #6366f1)',
                }}
              />
            </div>
            <span className="text-[10px] text-white/40 font-mono w-12 text-right">
              {progress}/{challenge.target}
            </span>
          </div>
        </div>
      </div>

      {/* Claim button */}
      {isComplete && !isClaimed && (
        <button
          onClick={onClaim}
          className="mt-3 w-full py-2 rounded-lg text-sm font-bold transition-all duration-200 active:scale-95"
          style={{
            background: justClaimed
              ? 'linear-gradient(135deg, #22c55e, #16a34a)'
              : 'linear-gradient(135deg, #f59e0b, #f97316)',
            color: '#000',
            boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
          }}
        >
          {justClaimed ? 'Claimed!' : (
            <span className="inline-flex items-center justify-center gap-1.5">
              Claim {challenge.reward}
              <PixelIcon icon="💰" size={16} variant="gold" />
            </span>
          )}
        </button>
      )}
    </div>
  )
}
