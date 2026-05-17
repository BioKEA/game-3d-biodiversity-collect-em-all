import { useState, useEffect, memo } from 'react'
import type { QuestReward } from '@/types/game'
import PixelIcon from './PixelIcon'

interface Props {
  questTitle: string
  reward: QuestReward & { coins: number }
  onDone: () => void
}

const QuestRewardPopup = memo(function QuestRewardPopup({ questTitle, reward, onDone }: Props) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')
  const [revealedItems, setRevealedItems] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (phase !== 'show') return
    const totalItems = (reward.items?.length ?? 0) + 2
    if (revealedItems < totalItems) {
      const t = setTimeout(() => setRevealedItems(r => r + 1), 250)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setPhase('exit'), 2500)
    return () => clearTimeout(t)
  }, [phase, revealedItems, reward.items?.length])

  useEffect(() => {
    if (phase === 'exit') {
      const t = setTimeout(onDone, 500)
      return () => clearTimeout(t)
    }
  }, [phase, onDone])

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none"
      style={{
        opacity: phase === 'enter' ? 0 : phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative z-10 flex flex-col items-center gap-4"
        style={{
          transform: phase === 'show' ? 'scale(1)' : 'scale(0.8)',
          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <PixelIcon icon="🎉" size={64} variant="gold" selected className="mb-1" style={{
          animation: phase === 'show' ? 'quest-reward-bounce 0.6s ease' : undefined,
        }} />

        <h2 className="text-xl font-bold text-amber-300 tracking-wide text-center">
          Quest Complete!
        </h2>
        <p className="text-sm text-white/50 -mt-2">{questTitle}</p>

        <div className="flex flex-col items-center gap-2 mt-2">
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(74,222,128,0.12)',
              border: '1px solid rgba(74,222,128,0.25)',
              opacity: revealedItems >= 1 ? 1 : 0,
              transform: revealedItems >= 1 ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.3s ease',
            }}
          >
            <PixelIcon icon="⭐" size={24} variant="gold" />
            <span className="text-emerald-300 font-semibold text-sm">+{reward.xp} XP</span>
          </div>

          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg"
            style={{
              background: 'rgba(250,204,21,0.12)',
              border: '1px solid rgba(250,204,21,0.25)',
              opacity: revealedItems >= 2 ? 1 : 0,
              transform: revealedItems >= 2 ? 'translateY(0)' : 'translateY(8px)',
              transition: 'all 0.3s ease',
            }}
          >
            <PixelIcon icon="💰" size={24} variant="gold" />
            <span className="text-amber-300 font-semibold text-sm">+{reward.coins} coins</span>
          </div>

          {reward.items?.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg"
              style={{
                background: 'rgba(147,130,220,0.12)',
                border: '1px solid rgba(147,130,220,0.25)',
                opacity: revealedItems >= 3 + i ? 1 : 0,
                transform: revealedItems >= 3 + i ? 'translateY(0)' : 'translateY(8px)',
                transition: 'all 0.3s ease',
              }}
            >
              <PixelIcon icon={item.sprite} size={24} variant="item" />
              <span className="text-purple-300 font-semibold text-sm">{item.name} ×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes quest-reward-bounce {
          0% { transform: scale(0) rotate(-15deg); }
          50% { transform: scale(1.3) rotate(5deg); }
          70% { transform: scale(0.9) rotate(-2deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  )
})

export default QuestRewardPopup
