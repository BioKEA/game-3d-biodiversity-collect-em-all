import { useState } from 'react'
import type { CapturedCreature, WeatherType, TimeOfDay } from '@/types/game'
import { type ArenaTier, getTierConfig, generateArenaChallenger, type ArenaChallenger } from './arena'
import RangerBattleScreen from './RangerBattleScreen'
import FloatingPanel from './FloatingPanel'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface Props {
  team: CapturedCreature[]
  weather: WeatherType
  timeOfDay: TimeOfDay
  arenaWins: Record<ArenaTier, number>
  onWin: (xp: number, coins: number, tier: ArenaTier) => void
  onLose: () => void
  onClose: () => void
}

const TIERS: ArenaTier[] = ['bronze', 'silver', 'gold']

export default function ArenaScreen({ team, weather, timeOfDay, arenaWins, onWin, onLose, onClose }: Props) {
  const [phase, setPhase] = useState<'select' | 'matchup' | 'battle'>('select')
  const [selectedTier, setSelectedTier] = useState<ArenaTier | null>(null)
  const [round, setRound] = useState(0)
  const [challenger, setChallenger] = useState<ArenaChallenger | null>(null)

  const handleSelectTier = (tier: ArenaTier) => {
    setSelectedTier(tier)
    const c = generateArenaChallenger(tier, 0)
    setChallenger(c)
    setRound(0)
    setPhase('matchup')
  }

  const handleStartBattle = () => {
    setPhase('battle')
  }

  const handleBattleWin = (xp: number) => {
    if (!challenger || !selectedTier) return
    onWin(xp, challenger.reward.coins, selectedTier)

    // Next round or victory
    if (round >= 2) {
      // Completed 3 rounds — full arena clear
      setPhase('select')
      setSelectedTier(null)
      setChallenger(null)
    } else {
      // Next round
      const nextRound = round + 1
      setRound(nextRound)
      const c = generateArenaChallenger(selectedTier, nextRound)
      setChallenger(c)
      setPhase('matchup')
    }
  }

  const handleBattleLose = () => {
    onLose()
    setPhase('select')
    setSelectedTier(null)
    setChallenger(null)
  }

  if (phase === 'battle' && challenger) {
    return (
      <RangerBattleScreen
        ranger={challenger.ranger}
        playerTeam={team}
        weather={weather}
        timeOfDay={timeOfDay}
        onWin={handleBattleWin}
        onLose={handleBattleLose}
        onClose={() => { setPhase('select'); setSelectedTier(null); setChallenger(null) }}
      />
    )
  }

  if (phase === 'matchup' && challenger && selectedTier) {
    const config = getTierConfig(selectedTier)
    const opponentTeam = challenger.ranger.battleTeam ?? []
    return (
      <div className="absolute inset-0 z-50 flex flex-col" style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0f1729 50%, #1a1f3a 100%)',
      }}>
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <div>
              <h2 className="text-white font-bold text-sm">{config.label} Arena</h2>
              <p className="text-white/30 text-[9px]">Round {round + 1} of 3</p>
            </div>
          </div>
          <button onClick={() => { setPhase('select'); setSelectedTier(null); setChallenger(null) }}
            className="text-white/40 hover:text-white/80 text-xs px-2 py-1 rounded-lg transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            Forfeit
          </button>
        </div>

        {/* Matchup display */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          {/* VS display */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-white/40 text-[9px] uppercase mb-1">Your Team</p>
              <div className="flex gap-1">
                {team.slice(0, 3).map((c, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    <PixelCreatureToken creature={c} size={34} />
                  </div>
                ))}
              </div>
            </div>
            <div className="text-2xl font-black text-white/20">VS</div>
            <div className="text-center">
              <p className="text-white/40 text-[9px] uppercase mb-1">{challenger.ranger.name}</p>
              <div className="flex gap-1">
                {opponentTeam.map((_m, i) => (
                  <div key={i} className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <PixelIcon icon="❓" size={30} variant="danger" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Opponent info */}
          <div className="text-center" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12,
            padding: '12px 20px',
          }}>
            <p className="text-white/60 text-xs font-medium">{challenger.ranger.name}</p>
            <p className="text-white/30 text-[10px]">{challenger.ranger.title}</p>
            <p className="text-white/20 text-[9px] mt-1">{opponentTeam.length} creatures · Lv.{opponentTeam.map(m => m.level).join('/')}</p>
          </div>

          {/* Reward preview */}
          <div className="flex items-center gap-3 text-[10px]">
            <span className="text-yellow-400/60">Reward:</span>
            <span className="text-yellow-300 inline-flex items-center gap-1"><PixelIcon icon="💰" size={16} variant="gold" /> {challenger.reward.coins}</span>
            <span className="text-cyan-300 inline-flex items-center gap-1"><PixelIcon icon="✨" size={16} variant="mystic" /> {challenger.reward.xp} XP</span>
          </div>

          <button onClick={handleStartBattle}
            className="px-8 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
            style={{
              background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
              border: `1px solid ${config.color}50`,
              boxShadow: `0 4px 20px ${config.color}20`,
            }}>
            Battle!
          </button>
        </div>

        {/* Round indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {[0, 1, 2].map(r => (
            <div key={r} className="w-8 h-1.5 rounded-full" style={{
              background: r < round ? config.color : r === round ? `${config.color}80` : 'rgba(255,255,255,0.1)',
            }} />
          ))}
        </div>
      </div>
    )
  }

  // Tier selection screen
  return (
    <FloatingPanel title="Battle Arena" subtitle="Test your team against challengers" onClose={onClose} width="md">
      <div className="p-3 space-y-2">
        <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-2.5 mb-3">
          <p className="text-red-300/70 text-[10px] leading-relaxed">
            Face 3 rounds of increasingly tough opponents. Win all 3 to earn bonus rewards. Your team&apos;s HP carries between rounds!
          </p>
        </div>

        {TIERS.map(tier => {
          const config = getTierConfig(tier)
          const wins = arenaWins[tier] ?? 0
          const minLevel = config.levelRange[0]
          const maxTeamLevel = Math.max(...team.map(c => c.level))
          const tooWeak = maxTeamLevel < minLevel - 2

          return (
            <button
              key={tier}
              onClick={() => !tooWeak && handleSelectTier(tier)}
              disabled={tooWeak}
              className="w-full text-left rounded-xl p-3 transition-all disabled:opacity-40"
              style={{
                background: `rgba(${tier === 'gold' ? '255,215,0' : tier === 'silver' ? '192,192,192' : '205,127,50'},0.05)`,
                border: `1px solid ${config.color}30`,
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-xs font-bold">{config.label} Tier</span>
                    <span className="text-white/20 text-[9px]">Lv.{config.levelRange[0]}-{config.levelRange[1]}</span>
                  </div>
                  <p className="text-white/30 text-[9px] mt-0.5">
                    {config.teamSize}v{config.teamSize} · {wins > 0 ? `${wins} win${wins !== 1 ? 's' : ''}` : 'Unranked'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-yellow-400/60 text-[9px] inline-flex items-center gap-1 justify-end"><PixelIcon icon="💰" size={14} variant="gold" /> {config.coinBase}+</p>
                  <p className="text-cyan-400/60 text-[9px] inline-flex items-center gap-1 justify-end"><PixelIcon icon="✨" size={14} variant="mystic" /> {config.xpBase}+ XP</p>
                </div>
              </div>
              {tooWeak && (
                <p className="text-red-400/60 text-[9px] mt-1.5 ml-9">
                  Your team needs to be at least Lv.{minLevel - 2} to enter
                </p>
              )}
            </button>
          )
        })}

        {/* Win stats */}
        <div className="flex justify-between pt-2 mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="text-white/20 text-[9px]">Total Arena Wins</span>
          <span className="text-white/40 text-[10px] font-medium">
            {Object.values(arenaWins).reduce((a, b) => a + b, 0)}
          </span>
        </div>
      </div>
    </FloatingPanel>
  )
}
