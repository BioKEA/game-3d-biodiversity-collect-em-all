import { useState, useEffect, useRef, memo } from 'react'
import type { BiomeType } from '@/types/game'

interface Particle {
  id: number
  x: number
  y: number
  char: string
  color: string
  size: number
  duration: number
  offsetX: number
  offsetY: number
}

interface Props {
  playerX: number
  playerY: number
  biome: BiomeType
}

const BIOME_PARTICLES: Record<BiomeType, { chars: string[]; colors: string[]; size: [number, number] }> = {
  beach:        { chars: ['·', '·', '·', '°'],        colors: ['#eab308', '#d4a373', '#fbbf24'], size: [3, 5] },
  rocky_beach:  { chars: ['·', '·', '°', '·'],        colors: ['#a8a29e', '#78716c', '#d6d3d1'], size: [3, 5] },
  water:        { chars: ['💧', '·', '~', '°'],       colors: ['#38bdf8', '#7dd3fc', '#bae6fd'], size: [4, 8] },
  forest:       { chars: ['🍃', '🍂', '·', '·'],      colors: ['#22c55e', '#84cc16', '#65a30d'], size: [6, 10] },
  redwood:      { chars: ['🍂', '🌿', '·', '·'],      colors: ['#166534', '#14532d', '#a16207'], size: [6, 10] },
  grassland:    { chars: ['·', '·', '°', '🌱'],       colors: ['#4ade80', '#22c55e', '#86efac'], size: [3, 6] },
  marsh:        { chars: ['💧', '·', '~', '·'],        colors: ['#84cc16', '#65a30d', '#a3e635'], size: [4, 7] },
  mountain:     { chars: ['·', '·', '°', '·'],         colors: ['#78716c', '#a8a29e', '#d6d3d1'], size: [3, 5] },
  urban:        { chars: ['·', '·'],                    colors: ['#6b7280', '#9ca3af', '#d1d5db'], size: [2, 4] },
  tidepool:     { chars: ['💧', '·', '~', '°'],         colors: ['#67e8f9', '#0891b2', '#155e75'], size: [4, 7] },
  chaparral:    { chars: ['·', '·', '°', '🌵'],         colors: ['#a3a056', '#7c7c2f', '#bef264'], size: [3, 6] },
  oak_woodland: { chars: ['🍂', '·', '·', '🍃'],         colors: ['#65a30d', '#3f6212', '#a16207'], size: [4, 8] },
  kelp_forest:  { chars: ['🌿', '·', '~', '°'],          colors: ['#0f766e', '#115e59', '#5eead4'], size: [4, 8] },
  desert:       { chars: ['·', '·', '°', '·'],             colors: ['#d4a574', '#b8956a', '#e8d5a3'], size: [2, 4] },
  alpine:       { chars: ['·', '°', '·', '·'],             colors: ['#94a3b8', '#64748b', '#cbd5e1'], size: [2, 5] },
  snow:         { chars: ['❄', '·', '·', '°'],             colors: ['#e2e8f0', '#cbd5e1', '#f8fafc'], size: [3, 6] },
  valley:       { chars: ['·', '·', '🌱', '°'],            colors: ['#7cb342', '#558b2f', '#a3d977'], size: [3, 6] },
  volcanic:     { chars: ['·', '·', '°', '·'],             colors: ['#5c4033', '#4a332a', '#8b6914'], size: [2, 4] },
  scrubland:    { chars: ['·', '·', '°', '·'],             colors: ['#c4a882', '#a08868', '#dcc8a0'], size: [2, 5] },
  dunes:        { chars: ['·', '·', '°', '·'],             colors: ['#e8d5a3', '#d4c090', '#f0e6c0'], size: [3, 5] },
  canyon:       { chars: ['·', '°', '·', '·'],             colors: ['#c07040', '#a05a30', '#e09060'], size: [2, 4] },
  lakeshore:    { chars: ['💧', '·', '·', '°'],            colors: ['#5da87e', '#3d8860', '#7ec8a0'], size: [3, 6] },
  old_growth:   { chars: ['🍂', '🌿', '·', '·'],           colors: ['#0d4a20', '#0a3818', '#1a6b30'], size: [5, 9] },
}

let particleIdCounter = 0

const WalkParticles = memo(function WalkParticles({ playerX, playerY, biome }: Props) {
  const [particles, setParticles] = useState<Particle[]>([])
  const prevPos = useRef({ x: playerX, y: playerY })

  useEffect(() => {
    // Only spawn on position change
    if (prevPos.current.x === playerX && prevPos.current.y === playerY) return
    prevPos.current = { x: playerX, y: playerY }

    const config = BIOME_PARTICLES[biome]
    if (!config) return

    // Spawn 2-3 particles per step
    const count = 2 + Math.floor(Math.random() * 2)
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      const id = ++particleIdCounter
      newParticles.push({
        id,
        x: 50 + (Math.random() - 0.5) * 12, // % from center
        y: 58 + (Math.random() - 0.5) * 6,   // % near player feet
        char: config.chars[Math.floor(Math.random() * config.chars.length)],
        color: config.colors[Math.floor(Math.random() * config.colors.length)],
        size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
        duration: 600 + Math.random() * 400,
        offsetX: (Math.random() - 0.5) * 20,
        offsetY: -(5 + Math.random() * 15),
      })
    }

    setParticles(prev => [...prev, ...newParticles])

    // Clean up after animation completes
    const maxDur = Math.max(...newParticles.map(p => p.duration))
    const timer = setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)))
    }, maxDur + 50)

    return () => clearTimeout(timer)
  }, [playerX, playerY, biome])

  if (particles.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-[5] overflow-hidden">
      <style>{`
        @keyframes walk-particle-drift {
          0% { opacity: 0.9; transform: translate(0, 0) scale(1); }
          30% { opacity: 0.8; transform: translate(calc(var(--ox) * 0.4), calc(var(--oy) * 0.3)) scale(1.1); }
          100% { opacity: 0; transform: translate(var(--ox), var(--oy)) scale(0.3); }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: `${p.size}px`,
            color: p.color,
            textShadow: `0 0 3px ${p.color}`,
            '--ox': `${p.offsetX}px`,
            '--oy': `${p.offsetY}px`,
            animation: `walk-particle-drift ${p.duration}ms ease-out forwards`,
          } as React.CSSProperties}
        >
          {p.char}
        </div>
      ))}
    </div>
  )
})

export default WalkParticles
