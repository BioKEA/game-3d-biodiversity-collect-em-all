import { useState, useEffect, useRef, memo } from 'react'
import type { Creature } from '@/types/game'
import PixelCreatureToken from './PixelCreatureToken'

interface Props {
  boss: Creature
  onReady: () => void
  onFlee: () => void
}

const LunarBossPopup = memo(function LunarBossPopup({ boss, onReady, onFlee }: Props) {
  const [phase, setPhase] = useState<'shake' | 'reveal' | 'stats' | 'choose'>('shake')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1500)
    const t2 = setTimeout(() => setPhase('stats'), 3500)
    const t3 = setTimeout(() => setPhase('choose'), 5000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Moonlight particle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width = window.innerWidth
    const h = canvas.height = window.innerHeight

    interface MoonParticle {
      x: number; y: number; vx: number; vy: number
      size: number; alpha: number; decay: number
    }
    const particles: MoonParticle[] = []

    let tick = 0
    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      tick++

      if (tick % 2 === 0 && particles.length < 80) {
        const angle = Math.random() * Math.PI * 2
        const dist = 50 + Math.random() * 150
        particles.push({
          x: w / 2 + Math.cos(angle) * dist,
          y: h / 2 + Math.sin(angle) * dist,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -0.5 - Math.random() * 2,
          size: 1 + Math.random() * 3,
          alpha: 0.3 + Math.random() * 0.7,
          decay: 0.005 + Math.random() * 0.01,
        })
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay
        if (p.alpha <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 210, 255, ${p.alpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 210, 255, ${p.alpha * 0.1})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center">
      {/* Dark overlay with moon glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(100,100,180,0.15) 0%, rgba(0,0,0,0.85) 60%, rgba(0,0,0,0.95) 100%)',
        }}
      />

      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />

      {/* Screen shake during initial phase */}
      <div
        className="relative z-[2] flex flex-col items-center gap-4 w-full max-w-md px-6"
        style={{
          animation: phase === 'shake' ? 'lunar-boss-shake 0.15s ease-in-out infinite' : undefined,
        }}
      >
        {/* Full Moon icon */}
        <div
          className="text-6xl"
          style={{
            filter: 'drop-shadow(0 0 30px rgba(200,210,255,0.6))',
            animation: 'lunar-boss-pulse 2s ease-in-out infinite',
            opacity: phase === 'shake' ? 0.5 : 1,
            transition: 'opacity 0.5s ease',
          }}
        >
          🌕
        </div>

        {/* Warning text */}
        <div
          className="text-center"
          style={{
            opacity: phase === 'shake' ? 1 : 0,
            transform: phase === 'shake' ? 'translateY(0)' : 'translateY(-20px)',
            transition: 'all 0.5s ease',
            position: phase !== 'shake' ? 'absolute' : 'relative',
            pointerEvents: 'none',
          }}
        >
          <p className="text-red-400 text-sm font-bold tracking-widest uppercase animate-pulse">
            The ground trembles...
          </p>
        </div>

        {/* Boss reveal */}
        <div
          className="flex flex-col items-center gap-3"
          style={{
            opacity: phase === 'shake' ? 0 : 1,
            transform: phase === 'shake' ? 'scale(0.5)' : 'scale(1)',
            transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Boss sprite */}
          <div
            className="relative"
            style={{
              filter: `drop-shadow(0 0 20px ${boss.color}80) drop-shadow(0 0 40px ${boss.color}40)`,
            }}
          >
            <PixelCreatureToken
              creature={boss}
              size={104}
              selected
              style={{ animation: 'lunar-boss-float 3s ease-in-out infinite' }}
            />
            <span className="absolute -top-3 -right-3 text-2xl" style={{
              animation: 'lunar-boss-star 1.5s ease-in-out infinite',
            }}>⭐</span>
          </div>

          {/* Boss name */}
          <div className="text-center">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1" style={{
              color: `${boss.color}`,
              textShadow: `0 0 10px ${boss.color}60`,
            }}>
              Lunar Boss
            </p>
            <h2 className="text-3xl font-black text-white tracking-wide" style={{
              textShadow: '0 2px 20px rgba(0,0,0,0.8)',
            }}>
              {boss.name}
            </h2>
            <p className="text-sm text-white/50 italic mt-1">{boss.description}</p>
          </div>

          {/* Stats reveal */}
          <div
            className="flex items-center gap-3 mt-2"
            style={{
              opacity: phase === 'stats' || phase === 'choose' ? 1 : 0,
              transform: phase === 'stats' || phase === 'choose' ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.5s ease 0.2s',
            }}
          >
            <StatPill label="HP" value={boss.stats.hp} color="#ef4444" />
            <StatPill label="ATK" value={boss.stats.attack} color="#f59e0b" />
            <StatPill label="DEF" value={boss.stats.defense} color="#3b82f6" />
            <StatPill label="SPD" value={boss.stats.speed} color="#10b981" />
          </div>

          {/* Action buttons */}
          <div
            className="flex items-center gap-3 mt-4"
            style={{
              opacity: phase === 'choose' ? 1 : 0,
              transform: phase === 'choose' ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.4s ease',
              pointerEvents: phase === 'choose' ? 'auto' : 'none',
            }}
          >
            <button
              onClick={onFlee}
              className="px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              Flee
            </button>
            <button
              onClick={onReady}
              className="px-6 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${boss.color}80, ${boss.color}40)`,
                border: `1px solid ${boss.color}60`,
                color: '#ffffff',
                boxShadow: `0 0 20px ${boss.color}30`,
              }}
            >
              ⚔️ Challenge
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lunar-boss-shake {
          0%, 100% { transform: translateX(0) translateY(0); }
          25% { transform: translateX(-4px) translateY(2px); }
          50% { transform: translateX(3px) translateY(-3px); }
          75% { transform: translateX(-2px) translateY(1px); }
        }
        @keyframes lunar-boss-pulse {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(200,210,255,0.6)); }
          50% { filter: drop-shadow(0 0 50px rgba(200,210,255,0.9)); }
        }
        @keyframes lunar-boss-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes lunar-boss-star {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.3) rotate(15deg); }
        }
      `}</style>
    </div>
  )
})

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center px-2.5 py-1.5 rounded-lg" style={{
      background: `${color}15`,
      border: `1px solid ${color}30`,
    }}>
      <span className="text-[9px] font-bold tracking-wider uppercase" style={{ color: `${color}90` }}>{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  )
}

export default LunarBossPopup
