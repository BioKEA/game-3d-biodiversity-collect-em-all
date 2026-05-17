import { useState } from 'react'
import type { PlayerState, QuestProgress, Quest } from '@/types/game'
import { RANGERS } from './rangers'
import FloatingPanel from './FloatingPanel'
import { describeObjective, getQuestProgress, getObjectiveTarget } from './questHelpers'
import PixelIcon from './PixelIcon'

interface Props {
  questProgress: Record<string, QuestProgress>
  player: PlayerState
  onClose: () => void
}

type Tab = 'active' | 'completed' | 'available'

export default function QuestLog({ questProgress, player, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('active')

  // Gather all quests from all rangers with their ranger info
  const allQuests: { quest: Quest; rangerName: string; rangerSprite: string }[] = []
  for (const ranger of RANGERS) {
    for (const quest of ranger.quests) {
      allQuests.push({ quest, rangerName: ranger.name, rangerSprite: ranger.sprite })
    }
  }

  const activeQuests = allQuests.filter(q => questProgress[q.quest.id]?.status === 'active')
  const completedQuests = allQuests.filter(q => questProgress[q.quest.id]?.status === 'rewarded')
  const availableQuests = allQuests.filter(q => !questProgress[q.quest.id])

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active', count: activeQuests.length },
    { key: 'completed', label: 'Completed', count: completedQuests.length },
    { key: 'available', label: 'Available', count: availableQuests.length },
  ]

  const currentList = tab === 'active' ? activeQuests : tab === 'completed' ? completedQuests : availableQuests
  const totalQuests = allQuests.length
  const completedCount = completedQuests.length

  return (
    <FloatingPanel
      title="Quest Log"
      subtitle={`${completedCount}/${totalQuests} quests completed`}
      onClose={onClose}
      width="md"
    >
      <div className="p-3 space-y-3">
        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg p-0.5" style={{ background: 'rgba(255,255,255,0.03)' }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1"
              style={{
                background: tab === t.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: tab === t.key ? '#ffffff' : 'rgba(255,255,255,0.35)',
                border: tab === t.key ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="text-[8px] rounded-full px-1.5 py-0.5 font-bold"
                  style={{
                    background: t.key === 'active' ? 'rgba(251,191,36,0.2)' : t.key === 'completed' ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)',
                    color: t.key === 'active' ? '#fbbf24' : t.key === 'completed' ? '#22c55e' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-white/40 text-[9px] uppercase tracking-wider font-medium">Overall Progress</span>
            <span className="text-white/50 text-[9px]">{Math.round((completedCount / totalQuests) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(completedCount / totalQuests) * 100}%`,
                background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                boxShadow: completedCount > 0 ? '0 0 8px rgba(34,197,94,0.3)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Quest list */}
        {currentList.length === 0 ? (
          <div className="text-center py-8">
            <PixelIcon
              icon={tab === 'active' ? '📋' : tab === 'completed' ? '🏅' : '🗺️'}
              size={42}
              variant={tab === 'completed' ? 'gold' : tab === 'available' ? 'travel' : 'item'}
              className="mb-2 mx-auto"
            />
            <p className="text-white/30 text-xs">
              {tab === 'active' ? 'No active quests. Visit a Ranger to pick one up!' : tab === 'completed' ? 'No completed quests yet.' : 'All quests accepted!'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {currentList.map(({ quest, rangerName, rangerSprite }) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                rangerName={rangerName}
                rangerSprite={rangerSprite}
                player={player}
                tab={tab}
              />
            ))}
          </div>
        )}
      </div>
    </FloatingPanel>
  )
}

function QuestCard({ quest, rangerName, rangerSprite, player, tab }: {
  quest: Quest
  rangerName: string
  rangerSprite: string
  player: PlayerState
  tab: Tab
}) {
  const objectiveDesc = describeObjective(quest.objective)
  const currentProgress = getQuestProgress(quest.objective, player)
  const target = getObjectiveTarget(quest.objective)
  const isComplete = currentProgress >= target
  const pct = Math.min(100, (currentProgress / target) * 100)

  const statusColor = tab === 'completed' ? '#22c55e' : isComplete ? '#4ade80' : '#fbbf24'

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${tab === 'completed' ? 'rgba(34,197,94,0.15)' : isComplete ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      {/* Header */}
      <div className="px-3 pt-2.5 pb-1.5 flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {tab === 'completed' && <PixelIcon icon="✅" size={16} variant="nature" />}
            {tab === 'active' && isComplete && <PixelIcon icon="🎉" size={16} variant="gold" />}
            <h3 className="text-white text-xs font-semibold truncate">{quest.title}</h3>
          </div>
          <p className="text-white/40 text-[10px] leading-relaxed">{quest.description}</p>
        </div>
        <div
          className="flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <span className="text-xs">{rangerSprite}</span>
          <span className="text-white/30 text-[8px]">{rangerName.replace('Ranger ', '')}</span>
        </div>
      </div>

      {/* Objective + Progress */}
      <div className="px-3 pb-2.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white/50 text-[9px]">{objectiveDesc}</span>
          <span className="text-[9px] font-medium" style={{ color: statusColor }}>
            {currentProgress}/{target}
          </span>
        </div>
        {tab !== 'completed' && (
          <div className="w-full h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                  : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                boxShadow: `0 0 6px ${isComplete ? 'rgba(34,197,94,0.3)' : 'rgba(251,191,36,0.2)'}`,
              }}
            />
          </div>
        )}

        {/* Rewards */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-white/25 text-[8px] uppercase tracking-wider">Reward:</span>
          <span className="text-amber-400/70 text-[9px] font-medium">{quest.reward.xp} XP</span>
          {quest.reward.items?.map((item, i) => (
            <span key={i} className="flex items-center gap-0.5">
              <PixelIcon icon={item.sprite} size={16} variant="item" />
              <span className="text-white/40 text-[8px]">×{item.quantity}</span>
            </span>
          ))}
        </div>

        {/* Status message */}
        {tab === 'active' && isComplete && (
          <div className="mt-1.5 rounded-md py-1 px-2 text-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <p className="text-emerald-400 text-[9px] font-medium">Ready to claim! Return to {rangerName}.</p>
          </div>
        )}
        {tab === 'available' && (
          <div className="mt-1.5 rounded-md py-1 px-2 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <p className="text-white/30 text-[9px]">Visit {rangerName} to accept this quest</p>
          </div>
        )}
      </div>
    </div>
  )
}
