import { useState, useRef, useEffect, useCallback } from 'react'
import type { InventoryItem } from '@/types/game'
import PixelIcon from './PixelIcon'
import { drawPixelJellyfish, drawPixelKelp, drawPixelSurfer } from './canvasPixelArt'

// ============================================================
// Steamer Lane Surfing Minigame
// Ride waves, dodge rocks, score tricks — earn rewards
// ============================================================

interface Props {
  playerLevel: number
  onClose: () => void
  onReward: (item: InventoryItem) => void
  onXp: (amount: number) => void
}

interface Obstacle {
  x: number
  y: number
  type: 'rock' | 'kelp' | 'jellyfish'
  width: number
  height: number
}

interface Wave {
  x: number
  height: number // 0-1, peak of wave
  speed: number
}

const REWARDS: { name: string; sprite: string; type: InventoryItem['type']; description: string; minScore: number }[] = [
  { name: 'Sea Glass', sprite: '💎', type: 'material', description: 'Smooth glass tumbled by the ocean.', minScore: 0 },
  { name: 'Surf Wax', sprite: '🧴', type: 'boost', description: 'Boosts speed by 20% for the next battle.', minScore: 100 },
  { name: 'Kelp Wrap', sprite: '🌿', type: 'heal', description: 'Restores 40 HP. Made from giant kelp.', minScore: 200 },
  { name: 'Golden Surfboard Charm', sprite: '🏄', type: 'boost', description: 'Water creatures gain +5 to all stats.', minScore: 400 },
  { name: 'Wave Crest Medallion', sprite: '🏅', type: 'boost', description: 'All marine creatures gain +10 to all stats.', minScore: 600 },
]

export default function SurfingMinigame({ onClose, onReward, onXp }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gamePhase, setGamePhase] = useState<'ready' | 'surfing' | 'wipeout' | 'results'>('ready')
  const [score, setScore] = useState(0)
  const [, setCombo] = useState(0)
  const [bestTrick, setBestTrick] = useState('')
  const gameRef = useRef({
    surferX: 150,
    surferY: 100,
    velocityY: 0,
    onWave: false,
    score: 0,
    combo: 0,
    distance: 0,
    obstacles: [] as Obstacle[],
    waves: [] as Wave[],
    tricks: 0,
    airborne: false,
    rotation: 0,
    alive: true,
    lastObstacleX: 400,
  })
  const animRef = useRef<number>(0)
  const keysRef = useRef<Set<string>>(new Set())

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key)
      if (e.key === ' ') e.preventDefault()
    }
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const startSurfing = useCallback(() => {
    const g = gameRef.current
    g.surferX = 100
    g.surferY = 120
    g.velocityY = 0
    g.score = 0
    g.combo = 0
    g.distance = 0
    g.obstacles = []
    g.waves = []
    g.tricks = 0
    g.airborne = false
    g.rotation = 0
    g.alive = true
    g.lastObstacleX = 400

    // Generate initial waves
    for (let i = 0; i < 8; i++) {
      g.waves.push({
        x: i * 80,
        height: 0.3 + Math.random() * 0.5,
        speed: 1.5 + Math.random() * 0.5,
      })
    }

    setScore(0)
    setCombo(0)
    setBestTrick('')
    setGamePhase('surfing')
  }, [])

  // Main game loop
  useEffect(() => {
    if (gamePhase !== 'surfing') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const keys = keysRef.current
    const g = gameRef.current

    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 16, 3) // normalize to ~60fps
      lastTime = now

      if (!g.alive) {
        setGamePhase('wipeout')
        return
      }

      // Input
      const up = keys.has('ArrowUp') || keys.has('w') || keys.has('W')
      const down = keys.has('ArrowDown') || keys.has('s') || keys.has('S')
      const jump = keys.has(' ')

      // Move surfer Y
      if (up) g.surferY -= 2.5 * dt
      if (down) g.surferY += 2.5 * dt
      g.surferY = Math.max(30, Math.min(H - 40, g.surferY))

      // Jump / trick
      if (jump && !g.airborne) {
        g.velocityY = -6
        g.airborne = true
        g.rotation = 0
      }

      if (g.airborne) {
        g.velocityY += 0.25 * dt // gravity
        g.surferY += g.velocityY * dt
        g.rotation += 8 * dt // spin

        if (g.rotation > 360) {
          g.tricks++
          g.combo++
          const trickScore = 50 * g.combo
          g.score += trickScore
          setScore(g.score)
          setCombo(g.combo)
          if (g.combo >= 3) setBestTrick('Triple Spin!')
          else if (g.combo >= 2) setBestTrick('Double Flip!')
          else setBestTrick('Aerial 360!')
          g.rotation -= 360
        }

        // Land on water
        const waterLevel = getWaterLevel(g.surferX, g.waves)
        if (g.surferY >= waterLevel) {
          g.surferY = waterLevel
          g.airborne = false
          g.velocityY = 0
          g.rotation = 0
        }
      }

      // Advance distance
      g.distance += 2 * dt
      g.score += Math.floor(dt)
      setScore(g.score)

      // Scroll waves
      for (const wave of g.waves) {
        wave.x -= wave.speed * dt
      }
      // Add new waves
      const lastWave = g.waves[g.waves.length - 1]
      if (lastWave && lastWave.x < W) {
        g.waves.push({
          x: lastWave.x + 60 + Math.random() * 40,
          height: 0.3 + Math.random() * 0.6,
          speed: 1.5 + Math.random() * 0.8 + g.distance * 0.0003,
        })
      }
      // Remove off-screen waves
      g.waves = g.waves.filter(w => w.x > -100)

      // Spawn obstacles
      if (g.distance > 50) {
        const spawnChance = 0.008 + g.distance * 0.00002
        if (Math.random() < spawnChance * dt && g.lastObstacleX > W * 0.6) {
          const types: Obstacle['type'][] = ['rock', 'kelp', 'jellyfish']
          const type = types[Math.floor(Math.random() * types.length)]
          g.obstacles.push({
            x: W + 20,
            y: 60 + Math.random() * (H - 100),
            type,
            width: type === 'rock' ? 20 : 14,
            height: type === 'rock' ? 18 : 14,
          })
          g.lastObstacleX = 0
        }
      }
      g.lastObstacleX += 2 * dt

      // Move obstacles
      for (const obs of g.obstacles) {
        obs.x -= (2 + g.distance * 0.002) * dt
        if (obs.type === 'jellyfish') {
          obs.y += Math.sin(now * 0.003 + obs.x * 0.1) * 0.5
        }
      }
      g.obstacles = g.obstacles.filter(o => o.x > -30)

      // Collision detection
      for (const obs of g.obstacles) {
        const dx = g.surferX - obs.x
        const dy = g.surferY - obs.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < (obs.width / 2 + 8) && !g.airborne) {
          g.alive = false
          g.combo = 0
          setCombo(0)
        }
      }

      // === RENDER ===
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.4)
      skyGrad.addColorStop(0, '#0c4a6e')
      skyGrad.addColorStop(1, '#0ea5e9')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, W, H * 0.4)

      // Ocean gradient
      const seaGrad = ctx.createLinearGradient(0, H * 0.3, 0, H)
      seaGrad.addColorStop(0, '#0284c7')
      seaGrad.addColorStop(0.5, '#0369a1')
      seaGrad.addColorStop(1, '#0c4a6e')
      ctx.fillStyle = seaGrad
      ctx.fillRect(0, H * 0.3, W, H * 0.7)

      // Sun
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(W - 50, 35, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(251,191,36,0.15)'
      ctx.beginPath()
      ctx.arc(W - 50, 35, 35, 0, Math.PI * 2)
      ctx.fill()

      // Draw waves
      for (const wave of g.waves) {
        const waveTop = H * 0.4 + (1 - wave.height) * H * 0.3
        // Wave body
        ctx.fillStyle = 'rgba(14,165,233,0.3)'
        ctx.beginPath()
        ctx.moveTo(wave.x - 30, H)
        ctx.quadraticCurveTo(wave.x, waveTop, wave.x + 30, H * 0.7)
        ctx.lineTo(wave.x + 30, H)
        ctx.fill()
        // Wave crest (white foam)
        ctx.strokeStyle = 'rgba(255,255,255,0.4)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(wave.x - 25, waveTop + 5)
        ctx.quadraticCurveTo(wave.x, waveTop - 3, wave.x + 25, waveTop + 8)
        ctx.stroke()
      }

      // Draw obstacles
      for (const obs of g.obstacles) {
        if (obs.type === 'rock') {
          ctx.fillStyle = '#57534e'
          ctx.beginPath()
          ctx.moveTo(obs.x, obs.y - 10)
          ctx.lineTo(obs.x + 10, obs.y + 5)
          ctx.lineTo(obs.x - 10, obs.y + 5)
          ctx.fill()
          ctx.fillStyle = '#78716c'
          ctx.beginPath()
          ctx.moveTo(obs.x - 2, obs.y - 8)
          ctx.lineTo(obs.x + 8, obs.y + 3)
          ctx.lineTo(obs.x - 5, obs.y + 3)
          ctx.fill()
        } else if (obs.type === 'kelp') {
          drawPixelKelp(ctx, obs.x, obs.y + 5, 1.5)
        } else {
          drawPixelJellyfish(ctx, obs.x, obs.y + 5, 1.4)
        }
      }

      // Draw surfer
      ctx.save()
      ctx.translate(g.surferX, g.surferY)
      if (g.airborne) {
        ctx.rotate((g.rotation * Math.PI) / 180)
      }
      drawPixelSurfer(ctx, 0, 3, 1.3)
      ctx.restore()

      // Spray particles when on water
      if (!g.airborne) {
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = 0.3 + Math.random() * 0.2
          ctx.fillStyle = 'white'
          ctx.beginPath()
          ctx.arc(
            g.surferX - 10 - Math.random() * 15,
            g.surferY + Math.random() * 5 - 2,
            1 + Math.random() * 2,
            0, Math.PI * 2
          )
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }

      // HUD overlay
      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.fillRect(0, 0, W, 28)
      ctx.font = 'bold 11px system-ui'
      ctx.fillStyle = '#fff'
      ctx.textAlign = 'left'
      ctx.fillText(`Score: ${g.score}`, 8, 18)
      ctx.textAlign = 'center'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(`${Math.floor(g.distance)}m`, W / 2, 18)
      if (g.combo > 1) {
        ctx.fillStyle = '#4ade80'
        ctx.textAlign = 'right'
        ctx.fillText(`${g.combo}x Combo!`, W - 8, 18)
      }

      // Trick popup
      if (bestTrick && g.airborne) {
        ctx.font = 'bold 14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#fbbf24'
        ctx.fillText(bestTrick, g.surferX, g.surferY - 25)
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [gamePhase, bestTrick])

  // Wipeout → results after delay
  useEffect(() => {
    if (gamePhase !== 'wipeout') return
    const timer = setTimeout(() => setGamePhase('results'), 1500)
    return () => clearTimeout(timer)
  }, [gamePhase])

  // Award rewards on results
  useEffect(() => {
    if (gamePhase !== 'results') return
    const g = gameRef.current
    const xpEarned = Math.floor(g.score / 5) + g.tricks * 20
    onXp(xpEarned)

    // Find best reward the score qualifies for
    const eligible = REWARDS.filter(r => g.score >= r.minScore)
    if (eligible.length > 0) {
      const reward = eligible[eligible.length - 1]
      onReward({
        id: `surf_${reward.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
        name: reward.name,
        sprite: reward.sprite,
        type: reward.type,
        quantity: 1,
        description: reward.description,
      })
    }
  }, [gamePhase, onXp, onReward])

  if (gamePhase === 'ready') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{
        background: 'linear-gradient(180deg, #0c4a6e 0%, #0369a1 50%, #0f172a 100%)',
      }}>
        <PixelIcon icon="🏄" size={64} variant="water" selected className="mb-4" />
        <h1 className="text-white font-black text-xl mb-1">Steamer Lane</h1>
        <p className="text-cyan-300/60 text-xs mb-6">Ride the legendary waves of Santa Cruz</p>

        <div className="space-y-2 mb-6 text-center">
          <p className="text-white/50 text-[10px]">↑↓ or W/S — Move up and down</p>
          <p className="text-white/50 text-[10px]">SPACE — Jump and do tricks</p>
          <p className="text-white/50 text-[10px]">Spin 360° in the air for trick bonuses</p>
          <p className="text-white/50 text-[10px]">Dodge rocks, kelp, and jellyfish</p>
        </div>

        <button
          onClick={startSurfing}
          className="px-8 py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: '#fff',
            boxShadow: '0 4px 16px rgba(14,165,233,0.4)',
          }}
        >
          Paddle Out
        </button>

        <button onClick={onClose} className="mt-4 text-white/25 text-[10px] hover:text-white/50">
          Back to shore
        </button>
      </div>
    )
  }

  if (gamePhase === 'wipeout') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center" style={{
        background: 'rgba(12,74,110,0.95)',
      }}>
        <div className="text-center">
          <PixelIcon icon="💦" size={58} variant="water" selected className="mb-3 animate-bounce" />
          <h2 className="text-white font-bold text-lg">Wipeout!</h2>
          <p className="text-cyan-300/50 text-xs mt-1">Score: {score}</p>
        </div>
      </div>
    )
  }

  if (gamePhase === 'results') {
    const g = gameRef.current
    const xpEarned = Math.floor(g.score / 5) + g.tricks * 20
    const eligible = REWARDS.filter(r => g.score >= r.minScore)
    const reward = eligible.length > 0 ? eligible[eligible.length - 1] : null

    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{
        background: 'linear-gradient(180deg, #0c4a6e 0%, #0f172a 100%)',
      }}>
        <PixelIcon icon="🏄" size={52} variant="water" selected className="mb-3" />
        <h2 className="text-white font-black text-lg mb-1">Session Complete</h2>

        <div className="space-y-2 my-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="text-center">
              <p className="text-cyan-400 text-lg font-black">{g.score}</p>
              <p className="text-white/30 text-[8px]">SCORE</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-yellow-400 text-lg font-black">{Math.floor(g.distance)}m</p>
              <p className="text-white/30 text-[8px]">DISTANCE</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="text-center">
              <p className="text-green-400 text-lg font-black">{g.tricks}</p>
              <p className="text-white/30 text-[8px]">TRICKS</p>
            </div>
          </div>

          <div className="rounded-lg px-4 py-2 mx-auto" style={{
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.15)',
          }}>
            <p className="text-green-400 text-xs font-bold">+{xpEarned} XP</p>
          </div>

          {reward && (
            <div className="rounded-lg px-4 py-2 mx-auto" style={{
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.15)',
            }}>
              <div className="flex items-center gap-2">
                <PixelIcon icon={reward.sprite} size={28} variant={reward.type === 'heal' ? 'nature' : reward.type === 'boost' ? 'gold' : 'item'} selected />
                <div className="text-left">
                  <p className="text-yellow-300 text-xs font-bold">{reward.name}</p>
                  <p className="text-white/30 text-[8px]">{reward.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={startSurfing}
            className="px-5 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#fff',
            }}
          >
            Surf Again
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'rgba(255,255,255,0.05)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            Back to Shore
          </button>
        </div>
      </div>
    )
  }

  // Surfing phase
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black">
      <canvas
        ref={canvasRef}
        width={400}
        height={240}
        className="w-full max-h-full"
        style={{ imageRendering: 'auto' }}
      />
    </div>
  )
}

// Helper: get water surface Y at a given X based on nearby waves
function getWaterLevel(x: number, waves: Wave[]): number {
  let closest = 120 // default water level
  let minDist = Infinity
  for (const w of waves) {
    const dist = Math.abs(w.x - x)
    if (dist < minDist) {
      minDist = dist
      closest = 96 + (1 - w.height) * 72 // higher wave = lower Y (higher on screen)
    }
  }
  return closest
}
