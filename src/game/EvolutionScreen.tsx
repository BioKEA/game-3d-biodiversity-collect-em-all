import { useState, useEffect, useRef, useCallback } from 'react'
import type { CapturedCreature } from '@/types/game'
import { SFX } from './sounds'

interface Props {
  fromCreature: CapturedCreature
  toCreature: CapturedCreature
  description: string
  onComplete: () => void
}

type Phase = 'intro' | 'glow' | 'helix' | 'burst' | 'reveal' | 'stats'

// Particle types for the canvas effects
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: 'spark' | 'ring' | 'dna' | 'trail'
  angle?: number
  radius?: number
}

export default function EvolutionScreen({ fromCreature, toCreature, description, onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [shaking, setShaking] = useState(false)
  const [morphFlicker, setMorphFlicker] = useState(false) // rapid sprite alternation
  const [morphProgress, setMorphProgress] = useState(0) // 0-1 morph interpolation
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animFrameRef = useRef<number>(0)
  const phaseRef = useRef<Phase>('intro')
  const morphIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep phaseRef in sync
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const hexToRgb = useCallback((hex: string) => {
    const c = hex.replace('#', '')
    return {
      r: parseInt(c.substring(0, 2), 16) || 180,
      g: parseInt(c.substring(2, 4), 16) || 160,
      b: parseInt(c.substring(4, 6), 16) || 60,
    }
  }, [])

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = Math.min(400, window.innerWidth - 40)
    const w = canvas.width = size
    const h = canvas.height = size
    const cx = w / 2
    const cy = h / 2

    const color = hexToRgb(toCreature.color || '#fbbf24')

    const spawnSparks = (count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const speed = 1 + Math.random() * 3
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 60 + Math.random() * 40,
          maxLife: 100,
          size: 1 + Math.random() * 2,
          color: `${color.r}, ${color.g}, ${color.b}`,
          type: 'spark',
        })
      }
    }

    const spawnDNA = () => {
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 4
        particlesRef.current.push({
          x: cx, y: cy - 80 + (i / 30) * 160,
          vx: 0, vy: 0,
          life: 120, maxLife: 120,
          size: 3,
          color: i % 2 === 0
            ? `${color.r}, ${color.g}, ${color.b}`
            : '255, 255, 255',
          type: 'dna',
          angle: angle,
          radius: 40,
        })
      }
    }

    const spawnBurst = () => {
      for (let i = 0; i < 60; i++) {
        const angle = (i / 60) * Math.PI * 2
        const speed = 3 + Math.random() * 5
        particlesRef.current.push({
          x: cx, y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 40 + Math.random() * 30,
          maxLife: 70,
          size: 2 + Math.random() * 3,
          color: `${color.r}, ${color.g}, ${color.b}`,
          type: 'spark',
        })
      }
      // Add rings
      for (let i = 0; i < 3; i++) {
        particlesRef.current.push({
          x: cx, y: cy,
          vx: 0, vy: 0,
          life: 30 + i * 10,
          maxLife: 30 + i * 10,
          size: 1,
          color: `${color.r}, ${color.g}, ${color.b}`,
          type: 'ring',
          radius: 0,
        })
      }
    }

    const spawnTrail = () => {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2
        const dist = 60 + Math.random() * 80
        particlesRef.current.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          vx: (cx - (cx + Math.cos(angle) * dist)) * 0.02,
          vy: (cy - (cy + Math.sin(angle) * dist)) * 0.02,
          life: 60, maxLife: 60,
          size: 1 + Math.random(),
          color: `${color.r}, ${color.g}, ${color.b}`,
          type: 'trail',
        })
      }
    }

    let tickCount = 0
    const animate = () => {
      ctx.clearRect(0, 0, w, h)
      tickCount++

      const p = phaseRef.current

      // Spawn particles based on phase
      if (p === 'glow' && tickCount % 3 === 0) {
        spawnSparks(2)
        spawnTrail()
      }
      if (p === 'helix') {
        if (tickCount % 2 === 0) spawnSparks(1)
        if (tickCount === 1 || particlesRef.current.filter(pp => pp.type === 'dna').length === 0) {
          spawnDNA()
        }
      }
      if (p === 'burst' && tickCount < 5) {
        spawnBurst()
      }
      if (p === 'reveal' && tickCount % 5 === 0) {
        spawnTrail()
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life--
        if (particle.life <= 0) return false
        const alpha = Math.min(1, particle.life / (particle.maxLife * 0.3))

        if (particle.type === 'spark') {
          particle.x += particle.vx
          particle.y += particle.vy
          particle.vx *= 0.98
          particle.vy *= 0.98
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${particle.color}, ${alpha})`
          ctx.fill()
          // Glow
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${particle.color}, ${alpha * 0.15})`
          ctx.fill()
        }

        if (particle.type === 'dna' && particle.angle !== undefined && particle.radius !== undefined) {
          const progress = 1 - (particle.life / particle.maxLife)
          const spiralAngle = particle.angle + progress * Math.PI * 3
          const x = cx + Math.cos(spiralAngle) * particle.radius * (1 - progress * 0.5)
          const y = particle.y
          particle.x = x
          ctx.beginPath()
          ctx.arc(x, y, particle.size * (0.5 + alpha * 0.5), 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${particle.color}, ${alpha * 0.8})`
          ctx.fill()
          // Connect strands
          const mirrorX = cx + Math.cos(spiralAngle + Math.PI) * particle.radius * (1 - progress * 0.5)
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(mirrorX, y)
          ctx.strokeStyle = `rgba(${particle.color}, ${alpha * 0.15})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        if (particle.type === 'ring' && particle.radius !== undefined) {
          particle.radius += 4
          ctx.beginPath()
          ctx.arc(cx, cy, particle.radius, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(${particle.color}, ${alpha * 0.5})`
          ctx.lineWidth = 2
          ctx.stroke()
        }

        if (particle.type === 'trail') {
          particle.x += particle.vx
          particle.y += particle.vy
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${particle.color}, ${alpha * 0.7})`
          ctx.fill()
        }

        return true
      })

      // Central energy glow
      if (p === 'glow' || p === 'helix') {
        const pulse = 0.5 + Math.sin(tickCount * 0.08) * 0.3
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60 + pulse * 20)
        grad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${0.15 * pulse})`)
        grad.addColorStop(1, 'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [toCreature.color, hexToRgb])

  // Phase timeline with sound effects
  useEffect(() => {
    // Play evolution sound at start
    SFX.evolution()

    const timers = [
      setTimeout(() => setPhase('glow'), 1200),
      setTimeout(() => {
        setPhase('helix')
        // Start the morph flicker — sprites alternate rapidly, accelerating
        let flickerSpeed = 500
        let progress = 0
        const startFlicker = () => {
          if (morphIntervalRef.current) clearInterval(morphIntervalRef.current)
          morphIntervalRef.current = setInterval(() => {
            setMorphFlicker(prev => !prev)
            progress += 0.05
            setMorphProgress(Math.min(1, progress))
            // Accelerate the flicker as morph progresses
            if (flickerSpeed > 80) {
              flickerSpeed = Math.max(80, flickerSpeed - 30)
              clearInterval(morphIntervalRef.current!)
              startFlicker()
            }
          }, flickerSpeed)
        }
        startFlicker()
      }, 2800),
      setTimeout(() => {
        // Stop flicker, lock to new creature
        if (morphIntervalRef.current) clearInterval(morphIntervalRef.current)
        setMorphFlicker(false)
        setMorphProgress(1)
        setPhase('burst')
        setShaking(true)
        // Burst sound
        SFX.criticalHit()
        setTimeout(() => setShaking(false), 600)
      }, 5000),
      setTimeout(() => {
        setPhase('reveal')
        // Reveal fanfare
        SFX.capture()
      }, 5800),
      setTimeout(() => {
        setPhase('stats')
        SFX.levelUp()
      }, 7200),
    ]
    return () => {
      timers.forEach(clearTimeout)
      if (morphIntervalRef.current) clearInterval(morphIntervalRef.current)
    }
  }, [])

  const phaseIndex = ['intro', 'glow', 'helix', 'burst', 'reveal', 'stats'].indexOf(phase)

  return (
    <div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: phaseIndex >= 3
          ? `radial-gradient(circle at center, ${toCreature.color}15 0%, #050a15 60%)`
          : '#050a15',
        animation: shaking ? 'evo-shake 0.1s linear infinite' : 'none',
      }}
    >
      <style>{`
        @keyframes evo-shake {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-4px, 2px); }
          50% { transform: translate(3px, -3px); }
          75% { transform: translate(-2px, -1px); }
        }
        @keyframes evo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes evo-spin-glow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes evo-flash {
          0% { opacity: 1; }
          100% { opacity: 0; transform: scale(3); }
        }
        @keyframes evo-stat-pop {
          0% { transform: scale(0.5); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes evo-bg-pulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.15); }
        }
        @keyframes evo-ray {
          0% { opacity: 0; transform: rotate(0deg) scaleY(0); }
          50% { opacity: 0.3; transform: rotate(180deg) scaleY(1); }
          100% { opacity: 0; transform: rotate(360deg) scaleY(0); }
        }
        @keyframes evo-morph-pulse {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 8px var(--evo-color)); }
          50% { filter: brightness(1.8) drop-shadow(0 0 20px var(--evo-color)); }
        }
        @keyframes evo-silhouette-breathe {
          0%, 100% { transform: scale(1) scaleY(1); opacity: 0.3; }
          25% { transform: scale(1.08) scaleY(0.95); opacity: 0.5; }
          50% { transform: scale(0.95) scaleY(1.06); opacity: 0.2; }
          75% { transform: scale(1.04) scaleY(0.98); opacity: 0.45; }
        }
        @keyframes evo-energy-swirl {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes evo-new-creature-arrive {
          0% { transform: scale(3) rotate(-5deg); filter: brightness(5) blur(4px); opacity: 0; }
          30% { transform: scale(1.3) rotate(2deg); filter: brightness(2) blur(1px); opacity: 1; }
          60% { transform: scale(0.9) rotate(-1deg); filter: brightness(1.2) blur(0); }
          80% { transform: scale(1.05) rotate(0deg); filter: brightness(1); }
          100% { transform: scale(1) rotate(0deg); filter: brightness(1); opacity: 1; }
        }
      `}</style>

      {/* Canvas particle layer */}
      <canvas
        ref={canvasRef}
        className="absolute pointer-events-none"
        style={{
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: Math.min(400, window.innerWidth - 40), height: Math.min(400, window.innerWidth - 40),
          opacity: phaseIndex >= 1 ? 1 : 0,
          transition: 'opacity 0.5s',
        }}
      />

      {/* Rotating glow ring behind creature */}
      {phaseIndex >= 1 && phaseIndex < 4 && (
        <div
          className="absolute pointer-events-none"
          style={{
            width: 200, height: 200,
            left: '50%', top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-full h-full rounded-full"
            style={{
              border: `2px solid ${toCreature.color}40`,
              animation: 'evo-spin-glow 3s linear infinite',
              boxShadow: `0 0 30px ${toCreature.color}20`,
            }}
          />
          <div
            className="absolute inset-2 rounded-full"
            style={{
              border: `1px solid ${toCreature.color}25`,
              animation: 'evo-spin-glow 5s linear infinite reverse',
            }}
          />
        </div>
      )}

      {/* Light rays during glow/helix */}
      {(phaseIndex >= 1 && phaseIndex <= 3) && (
        <div className="absolute pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute"
              style={{
                width: 2,
                height: 120,
                left: '50%',
                bottom: '50%',
                transformOrigin: 'bottom center',
                transform: `rotate(${i * 45}deg)`,
                background: `linear-gradient(to top, ${toCreature.color}40, transparent)`,
                opacity: 0.2 + Math.sin(Date.now() * 0.001 + i) * 0.1,
                animation: `evo-bg-pulse ${2 + i * 0.3}s ease-in-out infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* White flash on burst */}
      {phase === 'burst' && (
        <div
          className="absolute inset-0 bg-white pointer-events-none z-10"
          style={{ animation: 'evo-flash 0.8s ease-out forwards' }}
        />
      )}

      {/* Central content */}
      <div className="relative flex flex-col items-center z-20">
        {/* Title */}
        <div className={`mb-6 text-center transition-all duration-1000 ${phaseIndex >= 0 ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-white/40 text-xs uppercase tracking-[0.3em] mb-1">
            {phaseIndex < 4 ? "What's happening?!" : 'Congratulations!'}
          </p>
          <h2 className="text-white text-lg font-bold">
            {phaseIndex < 4
              ? `${fromCreature.nickname || fromCreature.name} is evolving!`
              : `${fromCreature.nickname || fromCreature.name} evolved!`
            }
          </h2>
        </div>

        {/* Creature display area */}
        <div className="relative w-32 h-32 sm:w-44 sm:h-44 flex items-center justify-center" style={{
          '--evo-color': toCreature.color,
        } as React.CSSProperties}>
          {/* Radial glow */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-1000"
            style={{
              background: phaseIndex >= 1
                ? `radial-gradient(circle, ${toCreature.color}30 0%, transparent 70%)`
                : 'transparent',
              transform: phaseIndex >= 2 ? 'scale(1.8)' : 'scale(1)',
              opacity: phaseIndex === 3 ? 0 : 1,
            }}
          />

          {/* Energy swirl ring during helix */}
          {phaseIndex === 2 && (
            <div className="absolute pointer-events-none" style={{
              width: 140, height: 140,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'evo-energy-swirl 1.5s linear infinite',
            }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="absolute rounded-full" style={{
                  width: 8, height: 8,
                  background: `radial-gradient(circle, ${toCreature.color}, transparent)`,
                  left: '50%', top: '50%',
                  transform: `rotate(${i * 90}deg) translateY(-65px)`,
                  boxShadow: `0 0 12px ${toCreature.color}80`,
                }} />
              ))}
            </div>
          )}

          {/* Old creature — morphs via flickering during helix phase */}
          <span
            className="text-5xl sm:text-6xl absolute transition-all"
            style={{
              opacity: phaseIndex >= 3 ? 0
                : phaseIndex === 2 ? (morphFlicker ? 0 : 1)
                : 1,
              transform: phaseIndex >= 2
                ? `scale(${0.8 + morphProgress * 0.2})`
                : phaseIndex >= 1
                  ? 'scale(1.15)'
                  : 'scale(1)',
              filter: phaseIndex >= 2
                ? `brightness(${1.5 + morphProgress * 1.5}) blur(${morphProgress * 2}px)`
                : phaseIndex >= 1
                  ? 'brightness(1.5)'
                  : 'brightness(1)',
              transitionDuration: phaseIndex === 3 ? '0.2s' : phaseIndex === 2 ? '0.1s' : '1.5s',
              animation: phaseIndex === 2 ? 'evo-morph-pulse 0.8s ease-in-out infinite' : 'none',
            }}
          >
            {fromCreature.sprite}
          </span>

          {/* New creature peeking through during morph flicker */}
          {phaseIndex === 2 && (
            <span
              className="text-5xl sm:text-6xl absolute pointer-events-none"
              style={{
                opacity: morphFlicker ? (0.5 + morphProgress * 0.5) : 0,
                transform: `scale(${0.7 + morphProgress * 0.3})`,
                filter: `brightness(${2 - morphProgress}) drop-shadow(0 0 ${8 + morphProgress * 12}px ${toCreature.color})`,
                transition: 'opacity 0.05s, transform 0.15s',
              }}
            >
              {toCreature.sprite}
            </span>
          )}

          {/* New creature — dramatic entrance on reveal */}
          <span
            className="text-5xl sm:text-7xl absolute"
            style={{
              opacity: phaseIndex >= 4 ? 1 : 0,
              animation: phaseIndex === 4
                ? 'evo-new-creature-arrive 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
                : phaseIndex >= 5
                  ? 'evo-float 3s ease-in-out infinite'
                  : 'none',
              filter: phaseIndex >= 4 ? `drop-shadow(0 0 15px ${toCreature.color}50)` : 'none',
            }}
          >
            {toCreature.sprite}
          </span>

          {/* Energy silhouette during helix phase — breathing morph */}
          {phaseIndex === 2 && (
            <span
              className="text-5xl sm:text-6xl absolute pointer-events-none"
              style={{
                filter: `brightness(0) drop-shadow(0 0 ${12 + morphProgress * 8}px ${toCreature.color})`,
                animation: 'evo-silhouette-breathe 1.2s ease-in-out infinite',
              }}
            >
              {morphProgress > 0.5 ? toCreature.sprite : fromCreature.sprite}
            </span>
          )}
        </div>

        {/* New name reveal */}
        <div
          className="mt-6 text-center"
          style={{
            opacity: phaseIndex >= 4 ? 1 : 0,
            transform: phaseIndex >= 4 ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.8)',
            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <p className="text-2xl font-bold" style={{ color: toCreature.color }}>
            {toCreature.name}
          </p>
          <p className="text-white/30 text-[10px] italic">{toCreature.scientificName}</p>
        </div>

        {/* Arrow and type badge */}
        <div
          className="mt-2 flex items-center gap-2"
          style={{
            opacity: phaseIndex >= 4 ? 1 : 0,
            transition: 'opacity 0.5s 0.3s',
          }}
        >
          <span className="text-white/20 text-xs">{fromCreature.sprite}</span>
          <span className="text-white/30 text-xs">→</span>
          <span className="text-white/20 text-xs">{toCreature.sprite}</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full ml-1"
            style={{
              background: `${toCreature.color}20`,
              color: `${toCreature.color}`,
              border: `1px solid ${toCreature.color}30`,
            }}
          >
            {toCreature.type}
          </span>
        </div>

        {/* Description */}
        <div
          className="mt-4 max-w-xs text-center"
          style={{
            opacity: phaseIndex >= 5 ? 1 : 0,
            transform: phaseIndex >= 5 ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.7s 0.2s',
          }}
        >
          <p className="text-white/50 text-xs leading-relaxed">{description}</p>
        </div>

        {/* Stats comparison with animated pop-in */}
        <div
          className="mt-4"
          style={{
            opacity: phaseIndex >= 5 ? 1 : 0,
            transition: 'opacity 0.3s',
          }}
        >
          <div className="flex gap-3 sm:gap-4">
            {[
              { label: 'HP', from: fromCreature.stats.maxHp, to: toCreature.stats.maxHp },
              { label: 'ATK', from: fromCreature.stats.attack, to: toCreature.stats.attack },
              { label: 'DEF', from: fromCreature.stats.defense, to: toCreature.stats.defense },
              { label: 'SPD', from: fromCreature.stats.speed, to: toCreature.stats.speed },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="text-center"
                style={{
                  animation: phaseIndex >= 5 ? `evo-stat-pop 0.4s ease-out ${i * 0.1}s both` : 'none',
                }}
              >
                <StatChange label={stat.label} from={stat.from} to={stat.to} color={toCreature.color} />
              </div>
            ))}
          </div>
        </div>

        {/* New moves */}
        <div
          className="mt-3"
          style={{
            opacity: phaseIndex >= 5 ? 1 : 0,
            transform: phaseIndex >= 5 ? 'translateY(0)' : 'translateY(8px)',
            transition: 'all 0.5s 0.6s',
          }}
        >
          <p className="text-white/30 text-[9px] uppercase tracking-wider text-center mb-1">Moves</p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {toCreature.moves.map(move => (
              <div
                key={move.name}
                className="border rounded px-2 py-1"
                style={{
                  background: `${toCreature.color}08`,
                  borderColor: `${toCreature.color}20`,
                }}
              >
                <p className="text-white/70 text-[9px] font-medium">{move.name}</p>
                {move.power > 0 && <p className="text-white/30 text-[8px]">{move.power} pw</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Continue button */}
        <div className={`mt-6 transition-all duration-500 ${phaseIndex >= 5 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <button
            onClick={onComplete}
            className="px-8 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95"
            style={{
              background: `${toCreature.color}25`,
              borderColor: `${toCreature.color}50`,
              borderWidth: 1,
              color: toCreature.color,
              boxShadow: `0 0 20px ${toCreature.color}15`,
            }}
          >
            Amazing!
          </button>
        </div>
      </div>
    </div>
  )
}

function StatChange({ label, from, to, color }: { label: string; from: number; to: number; color: string }) {
  const diff = to - from
  return (
    <>
      <p className="text-white/30 text-[8px] uppercase">{label}</p>
      <p className="text-white/70 text-xs font-semibold">{to}</p>
      {diff > 0 && (
        <p className="text-[9px] font-bold" style={{ color }}>
          +{diff}
        </p>
      )}
      {diff < 0 && (
        <p className="text-[9px] text-red-400">
          {diff}
        </p>
      )}
    </>
  )
}
