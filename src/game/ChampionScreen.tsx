import { useState, useEffect, useRef } from 'react'
import type { CapturedCreature } from '@/types/game'
import type { PlayerStats } from './achievements'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  playerName: string
  playerLevel: number
  team: CapturedCreature[]
  stats: PlayerStats
  isGrand?: boolean
  onClose: () => void
}

export default function ChampionScreen({ playerName, playerLevel, team, stats, isGrand, onClose }: Props) {
  const [phase, setPhase] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2800),
      setTimeout(() => setPhase(4), 4000),
      setTimeout(() => setPhase(5), 5500),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  // Firework particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 400
    canvas.height = 600

    interface Spark {
      x: number; y: number; vx: number; vy: number
      life: number; color: string; size: number
    }
    const sparks: Spark[] = []
    const colors = ['#fbbf24', '#c084fc', '#4ade80', '#22d3ee', '#f87171', '#818cf8']

    function burst(cx: number, cy: number) {
      for (let i = 0; i < 30; i++) {
        const angle = (Math.PI * 2 * i) / 30 + Math.random() * 0.3
        const speed = 1.5 + Math.random() * 3
        sparks.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.random() * 40,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 1 + Math.random() * 2,
        })
      }
    }

    let frame = 0
    let animId: number
    const loop = () => {
      ctx.clearRect(0, 0, 400, 600)
      frame++
      if (frame % 45 === 0) burst(80 + Math.random() * 240, 60 + Math.random() * 200)
      if (frame % 70 === 0) burst(50 + Math.random() * 300, 40 + Math.random() * 150)

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx
        s.y += s.vy
        s.vy += 0.03
        s.vx *= 0.99
        s.life--
        if (s.life <= 0) { sparks.splice(i, 1); continue }
        ctx.globalAlpha = Math.min(1, s.life / 30)
        ctx.fillStyle = s.color
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2)
        ctx.fill()
        // Trail
        ctx.globalAlpha *= 0.3
        ctx.beginPath()
        ctx.arc(s.x - s.vx, s.y - s.vy, s.size * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      animId = requestAnimationFrame(loop)
    }
    burst(200, 120)
    burst(120, 180)
    burst(280, 100)
    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [])

  const speciesCount = new Set(stats.defeatedRangers).size
  const totalCreatures = stats.totalCreaturesCaught
  const statLines = [
    { label: 'Creatures Caught', value: totalCreatures, icon: '🔮' },
    { label: 'Battles Won', value: stats.totalBattlesWon, icon: '⚔️' },
    { label: 'Rangers Defeated', value: speciesCount, icon: '🏅' },
    { label: 'Steps Walked', value: stats.totalStepsWalked.toLocaleString(), icon: '👣' },
    { label: 'Fish Caught', value: stats.totalFishCaught, icon: '🐟' },
    { label: 'Evolutions', value: stats.totalEvolutions, icon: '✨' },
  ]

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center overflow-hidden" style={{
      background: 'linear-gradient(180deg, #0a0520 0%, #1a0a3a 30%, #0d1a30 60%, #061018 100%)',
    }}>
      <style>{`
        @keyframes crown-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-8px) rotate(2deg); }
        }
        @keyframes stat-slide {
          0% { opacity: 0; transform: translateX(-20px); }
          100% { opacity: 1; transform: translateX(0); }
        }
        @keyframes team-pop {
          0% { opacity: 0; transform: scale(0.3); }
          60% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gold-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes title-reveal {
          0% { opacity: 0; transform: translateY(20px) scale(0.9); letter-spacing: 12px; }
          100% { opacity: 1; transform: translateY(0) scale(1); letter-spacing: 4px; }
        }
      `}</style>

      {/* Firework canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: phase >= 1 ? 0.7 : 0 }} />

      {/* Radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.1), transparent 60%), radial-gradient(ellipse at 50% 50%, rgba(251,191,36,0.08), transparent 50%)',
        opacity: phase >= 2 ? 1 : 0,
        transition: 'opacity 1s ease',
      }} />

      <div className="relative z-10 text-center max-w-sm mx-auto px-4">
        {/* Crown */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          transition: 'opacity 0.5s ease',
          animation: phase >= 1 ? 'crown-float 3s ease-in-out infinite' : 'none',
        }}>
          <span className="text-5xl">👑</span>
        </div>

        {/* Title */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          animation: phase >= 2 ? 'title-reveal 1s ease-out' : 'none',
        }}>
          <h1 className="text-3xl font-black mt-3 mb-1" style={{
            background: isGrand
              ? 'linear-gradient(135deg, #c084fc 0%, #a855f7 20%, #fbbf24 40%, #ec4899 60%, #a855f7 80%, #c084fc 100%)'
              : 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 30%, #fcd34d 50%, #f59e0b 70%, #fbbf24 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gold-shimmer 3s linear infinite',
            filter: isGrand
              ? 'drop-shadow(0 0 20px rgba(192,132,252,0.5))'
              : 'drop-shadow(0 0 15px rgba(251,191,36,0.3))',
          }}>
            {isGrand ? 'GRAND CHAMPION' : 'BAY AREA CHAMPION'}
          </h1>
          {isGrand && (
            <p className="text-[10px] text-purple-300/50 italic mt-1">Guardian of California&apos;s Wild Places</p>
          )}
          <p className="text-purple-300/60 text-sm font-medium">{playerName} · Level {playerLevel}</p>
        </div>

        {/* Team display */}
        <div className="flex justify-center gap-2 mt-5 mb-5" style={{
          opacity: phase >= 3 ? 1 : 0,
        }}>
          {team.slice(0, 6).map((c, i) => (
            <div key={i} className="flex flex-col items-center" style={{
              animation: phase >= 3 ? `team-pop 0.5s ease-out ${i * 0.1}s both` : 'none',
            }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(168,85,247,0.08))',
                border: '1px solid rgba(251,191,36,0.2)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              }}>
                <PixelCreatureToken creature={c} size={34} selected={isGrand} />
              </div>
              <span className="text-[8px] text-white/30 mt-1">Lv.{c.level}</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="space-y-1.5" style={{
          opacity: phase >= 4 ? 1 : 0,
        }}>
          <p className="text-[9px] text-white/20 uppercase tracking-widest mb-2">Journey Stats</p>
          {statLines.map((s, i) => (
            <div key={s.label} className="flex items-center justify-between px-4 py-1.5 rounded-lg" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              animation: phase >= 4 ? `stat-slide 0.4s ease-out ${i * 0.08}s both` : 'none',
            }}>
              <div className="flex items-center gap-2">
                <span className="text-sm">{s.icon}</span>
                <span className="text-white/40 text-[10px]">{s.label}</span>
              </div>
              <span className="text-white/80 text-xs font-bold">{s.value}</span>
            </div>
          ))}
        </div>

        {/* Credits */}
        <div className="mt-5" style={{
          opacity: phase >= 5 ? 1 : 0,
          transition: 'opacity 0.8s ease',
        }}>
          <div className="h-px w-32 mx-auto mb-3" style={{
            background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.2), transparent)',
          }} />
          <p className="text-[9px] text-white/15 mb-1">Built with Claude Code</p>
          <p className="text-[10px] text-purple-300/30 italic mb-4">
            "The Bay Area's creatures thank you for your dedication."
          </p>
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(168,85,247,0.1))',
              border: '1px solid rgba(251,191,36,0.25)',
              color: '#fbbf24',
              boxShadow: '0 4px 16px rgba(251,191,36,0.1)',
            }}
          >
            Continue Exploring
          </button>
        </div>
      </div>
    </div>
  )
}
