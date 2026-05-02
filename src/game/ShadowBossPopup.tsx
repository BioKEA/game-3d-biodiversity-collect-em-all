import { useState, useEffect, useRef, memo } from 'react'
import type { Creature } from '@/types/game'

interface Props {
  boss: Creature
  onReady: () => void
  onFlee: () => void
}

const ShadowBossPopup = memo(function ShadowBossPopup({ boss, onReady, onFlee }: Props) {
  const [phase, setPhase] = useState<'dark' | 'reveal' | 'stats' | 'choose'>('dark')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 2000)
    const t2 = setTimeout(() => setPhase('stats'), 4000)
    const t3 = setTimeout(() => setPhase('choose'), 5500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width = window.innerWidth
    const h = canvas.height = window.innerHeight

    interface ShadowParticle {
      x: number; y: number; vx: number; vy: number
      size: number; alpha: number; decay: number
    }
    const particles: ShadowParticle[] = []

    let tick = 0
    const animate = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)'
      ctx.fillRect(0, 0, w, h)
      tick++

      if (tick % 3 === 0 && particles.length < 60) {
        particles.push({
          x: Math.random() * w,
          y: h + 10,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 3,
          size: 2 + Math.random() * 6,
          alpha: 0.2 + Math.random() * 0.4,
          decay: 0.003 + Math.random() * 0.005,
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
        ctx.fillStyle = `rgba(60, 20, 100, ${p.alpha})`
        ctx.fill()
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(40, 10, 80, ${p.alpha * 0.15})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center">
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(30,10,50,0.7) 0%, rgba(0,0,0,0.95) 50%, rgb(0,0,0) 100%)',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[1]" />

      <div
        className="relative z-[2] flex flex-col items-center gap-4 w-full max-w-md px-6"
        style={{
          animation: phase === 'dark' ? 'shadow-boss-flicker 0.3s ease-in-out infinite' : undefined,
        }}
      >
        {/* New Moon icon */}
        <div
          className="text-6xl"
          style={{
            filter: 'drop-shadow(0 0 20px rgba(80,20,120,0.6))',
            animation: 'shadow-boss-pulse 3s ease-in-out infinite',
            opacity: phase === 'dark' ? 0.3 : 1,
            transition: 'opacity 1s ease',
          }}
        >
          🌑
        </div>

        {/* Warning text */}
        <div
          className="text-center"
          style={{
            opacity: phase === 'dark' ? 1 : 0,
            transition: 'opacity 0.8s ease',
            position: phase !== 'dark' ? 'absolute' : 'relative',
            pointerEvents: 'none',
          }}
        >
          <p className="text-purple-400 text-sm font-bold tracking-widest uppercase animate-pulse">
            Something stirs in the void...
          </p>
        </div>

        {/* Boss reveal */}
        <div
          className="flex flex-col items-center gap-3"
          style={{
            opacity: phase === 'dark' ? 0 : 1,
            transform: phase === 'dark' ? 'scale(0.3)' : 'scale(1)',
            transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            className="relative"
            style={{
              filter: `drop-shadow(0 0 25px ${boss.color}90) drop-shadow(0 0 50px ${boss.color}50)`,
            }}
          >
            <span className="text-8xl" style={{
              animation: 'shadow-boss-breathe 4s ease-in-out infinite',
            }}>
              {boss.sprite}
            </span>
            <span className="absolute -top-2 -right-2 text-xl" style={{
              animation: 'shadow-boss-eye 2s ease-in-out infinite',
              filter: 'drop-shadow(0 0 6px rgba(168,85,247,0.8))',
            }}>🌑</span>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1" style={{
              color: '#a855f7',
              textShadow: '0 0 10px rgba(168,85,247,0.6)',
            }}>
              Shadow Boss
            </p>
            <h2 className="text-3xl font-black text-white tracking-wide" style={{
              textShadow: '0 2px 20px rgba(80,20,120,0.8)',
            }}>
              {boss.name}
            </h2>
            <p className="text-sm text-white/40 italic mt-1">{boss.description}</p>
          </div>

          <div
            className="flex items-center gap-3 mt-2"
            style={{
              opacity: phase === 'stats' || phase === 'choose' ? 1 : 0,
              transform: phase === 'stats' || phase === 'choose' ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.5s ease 0.2s',
            }}
          >
            <StatPill label="HP" value={boss.stats.hp} color="#a855f7" />
            <StatPill label="ATK" value={boss.stats.attack} color="#dc2626" />
            <StatPill label="DEF" value={boss.stats.defense} color="#6366f1" />
            <StatPill label="SPD" value={boss.stats.speed} color="#8b5cf6" />
          </div>

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
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.4)',
              }}
            >
              Flee
            </button>
            <button
              onClick={onReady}
              className="px-6 py-2.5 rounded-lg text-sm font-bold cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(168,85,247,0.5), rgba(80,20,120,0.4))',
                border: '1px solid rgba(168,85,247,0.5)',
                color: '#ffffff',
                boxShadow: '0 0 25px rgba(168,85,247,0.25)',
              }}
            >
              ⚔️ Challenge the Darkness
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shadow-boss-flicker {
          0%, 100% { opacity: 1; }
          30% { opacity: 0.6; }
          60% { opacity: 0.9; }
          80% { opacity: 0.4; }
        }
        @keyframes shadow-boss-pulse {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(80,20,120,0.6)); }
          50% { filter: drop-shadow(0 0 40px rgba(80,20,120,0.9)); }
        }
        @keyframes shadow-boss-breathe {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }
        @keyframes shadow-boss-eye {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
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

export default ShadowBossPopup
