import { useState, useEffect, useRef, useCallback } from 'react'
import type { Creature } from '@/types/game'
import { ALL_CREATURES } from './creatures'
import { SFX } from './sounds'

interface Props {
  playerLevel: number
  onClose: () => void
  onEncounter: (creature: Creature) => void
  onCollect: (item: { id: string; name: string; type: 'material' | 'heal'; quantity: number; description: string; sprite: string }) => void
  captured: string[]
}

interface DiveEntity {
  id: string
  x: number
  y: number
  type: 'creature' | 'treasure' | 'obstacle' | 'bubble'
  sprite: string
  name: string
  vx: number
  vy: number
  collected?: boolean
}

// Underwater collectibles
const DIVE_TREASURES = [
  { id: 'sea-glass', name: 'Sea Glass', sprite: '💎', description: 'Smooth glass polished by the Bay. Used in crafting.', type: 'material' as const },
  { id: 'pearl', name: 'Bay Pearl', sprite: '🫧', description: 'A luminous pearl from the Bay floor.', type: 'material' as const },
  { id: 'kelp-wrap', name: 'Kelp Wrap', sprite: '🌿', description: 'Medicinal kelp that restores health.', type: 'heal' as const },
  { id: 'anchor-shard', name: 'Anchor Shard', sprite: '⚓', description: 'A rusted piece of maritime history.', type: 'material' as const },
  { id: 'abalone-shell', name: 'Abalone Shell', sprite: '🐚', description: 'A beautiful iridescent shell.', type: 'material' as const },
]

const WATER_CREATURES = ALL_CREATURES.filter(c =>
  c.biomes.includes('water') || c.biomes.includes('beach')
).filter(c => c.type === 'marine' || c.type === 'amphibian')

export default function DivingMinigame({ playerLevel: _playerLevel, onClose, onEncounter, onCollect, captured }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef(0)
  const [oxygen, setOxygen] = useState(100)
  const [depth, setDepth] = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<'diving' | 'surfaced' | 'encounter'>('diving')
  const [sessionFinds, setSessionFinds] = useState<string[]>([])
  const [encounterCreature, setEncounterCreature] = useState<Creature | null>(null)

  // Player state
  const playerRef = useRef({ x: 150, y: 80, vy: 0, vx: 0 })
  const entitiesRef = useRef<DiveEntity[]>([])
  const keysRef = useRef<Set<string>>(new Set())
  const depthRef = useRef(0)
  const oxygenRef = useRef(100)
  const tickRef = useRef(0)

  // Initialize entities
  useEffect(() => {
    const entities: DiveEntity[] = []

    // Spawn treasures at various depths
    for (let i = 0; i < 12; i++) {
      const treasure = DIVE_TREASURES[Math.floor(Math.random() * DIVE_TREASURES.length)]
      entities.push({
        id: `t-${i}`,
        x: 30 + Math.random() * 240,
        y: 120 + Math.random() * 500,
        type: 'treasure',
        sprite: treasure.sprite,
        name: treasure.name,
        vx: 0, vy: 0,
      })
    }

    // Spawn underwater creatures
    for (let i = 0; i < 8; i++) {
      const creature = WATER_CREATURES[Math.floor(Math.random() * WATER_CREATURES.length)]
      if (!creature) continue
      entities.push({
        id: `c-${i}-${creature.id}`,
        x: Math.random() * 260 + 20,
        y: 150 + Math.random() * 400,
        type: 'creature',
        sprite: creature.sprite,
        name: creature.name,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 0.5,
      })
    }

    // Jellyfish obstacles
    for (let i = 0; i < 6; i++) {
      entities.push({
        id: `o-${i}`,
        x: 40 + Math.random() * 220,
        y: 180 + Math.random() * 350,
        type: 'obstacle',
        sprite: '🪼',
        name: 'Jellyfish',
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.sin(i) * 0.2,
      })
    }

    // Ambient bubbles
    for (let i = 0; i < 15; i++) {
      entities.push({
        id: `b-${i}`,
        x: Math.random() * 300,
        y: 100 + Math.random() * 500,
        type: 'bubble',
        sprite: '○',
        name: '',
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.5 - Math.random() * 0.5,
      })
    }

    entitiesRef.current = entities
  }, [])

  // Keyboard controls
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key.toLowerCase())
      if (e.key === 'Escape') onClose()
    }
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(e.key.toLowerCase())
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp) }
  }, [onClose])

  // Main game loop
  const gameLoop = useCallback(() => {
    if (phase !== 'diving') return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const player = playerRef.current
    const keys = keysRef.current
    const entities = entitiesRef.current
    tickRef.current++
    const tick = tickRef.current

    // Input
    const accel = 0.3
    if (keys.has('arrowleft') || keys.has('a')) player.vx -= accel
    if (keys.has('arrowright') || keys.has('d')) player.vx += accel
    if (keys.has('arrowup') || keys.has('w')) player.vy -= accel
    if (keys.has('arrowdown') || keys.has('s')) player.vy += accel

    // Physics
    player.vx *= 0.92 // water drag
    player.vy *= 0.92
    player.vy += 0.05 // gentle sinking
    player.x += player.vx
    player.y += player.vy

    // Bounds
    player.x = Math.max(15, Math.min(w - 15, player.x))
    player.y = Math.max(30, Math.min(650, player.y))

    // Depth tracking
    depthRef.current = Math.max(0, Math.floor((player.y - 60) / 4))
    setDepth(depthRef.current)

    // Oxygen depletion
    oxygenRef.current -= 0.06 + depthRef.current * 0.0005
    if (player.y < 60) oxygenRef.current = Math.min(100, oxygenRef.current + 0.5) // surface refill
    setOxygen(Math.max(0, oxygenRef.current))

    if (oxygenRef.current <= 0) {
      setPhase('surfaced')
      SFX.defeat()
      return
    }

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Background gradient — deeper = darker
    const depthProgress = Math.min(1, depthRef.current / 120)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, `rgba(6,${Math.floor(182 - depthProgress * 120)},${Math.floor(212 - depthProgress * 140)},0.3)`)
    grad.addColorStop(1, `rgba(3,${Math.floor(50 - depthProgress * 40)},${Math.floor(80 - depthProgress * 60)},0.8)`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Light rays from surface
    if (depthRef.current < 80) {
      const rayAlpha = 0.08 * (1 - depthProgress)
      for (let i = 0; i < 5; i++) {
        const rx = 40 + i * 60 + Math.sin(tick * 0.01 + i) * 15
        ctx.save()
        ctx.globalAlpha = rayAlpha
        ctx.fillStyle = 'rgba(255,255,200,0.5)'
        ctx.beginPath()
        ctx.moveTo(rx - 8, 0)
        ctx.lineTo(rx + 8, 0)
        ctx.lineTo(rx + 30, h)
        ctx.lineTo(rx - 10, h)
        ctx.fill()
        ctx.restore()
      }
    }

    // Camera offset based on player Y
    const camY = Math.max(0, player.y - 150)

    // Update and draw entities
    for (const e of entities) {
      if (e.collected) continue

      // Movement
      e.x += e.vx
      e.y += e.vy

      // Bounce bubbles
      if (e.type === 'bubble') {
        if (e.y < -10) { e.y = h + camY + 20; e.x = Math.random() * w }
        continue // don't draw bubbles in entity pass
      }

      // Bounce creatures/obstacles
      if (e.x < 10 || e.x > w - 10) e.vx *= -1
      if (e.type === 'obstacle') {
        e.vy = Math.sin(tick * 0.02 + parseFloat(e.id.split('-')[1]) * 2) * 0.3
      }

      const screenY = e.y - camY
      if (screenY < -20 || screenY > h + 20) continue

      // Collision with player
      const dx = player.x - e.x
      const dy = (player.y - camY) - screenY
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 20) {
        if (e.type === 'treasure') {
          e.collected = true
          setScore(s => s + 10)
          setSessionFinds(f => [...f, e.sprite])
          SFX.levelUp()
          const treasure = DIVE_TREASURES.find(t => t.sprite === e.sprite)
          if (treasure) {
            onCollect({ ...treasure, quantity: 1 })
          }
        } else if (e.type === 'creature') {
          e.collected = true
          const creatureData = WATER_CREATURES.find(c => c.sprite === e.sprite)
          if (creatureData) {
            setEncounterCreature(creatureData)
            setPhase('encounter')
            SFX.battleStart()
          }
        } else if (e.type === 'obstacle') {
          // Jellyfish sting — lose oxygen
          oxygenRef.current = Math.max(0, oxygenRef.current - 15)
          SFX.hit()
          e.vx *= -1
          player.vx -= dx * 0.1
          player.vy -= dy * 0.1
        }
      }

      // Draw entity
      ctx.font = e.type === 'creature' ? '20px serif' : e.type === 'obstacle' ? '18px serif' : '16px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Glow for treasures
      if (e.type === 'treasure') {
        ctx.save()
        ctx.shadowColor = '#fbbf24'
        ctx.shadowBlur = 8 + Math.sin(tick * 0.05) * 4
        ctx.fillText(e.sprite, e.x, screenY)
        ctx.restore()
      } else {
        ctx.fillText(e.sprite, e.x, screenY)
      }

      // Name label for creatures
      if (e.type === 'creature' && dist < 60) {
        const isCaught = captured.includes(e.id.split('-').slice(2).join('-'))
        ctx.font = '8px sans-serif'
        ctx.fillStyle = isCaught ? 'rgba(74,222,128,0.7)' : 'rgba(255,255,255,0.5)'
        ctx.fillText(isCaught ? `✓ ${e.name}` : e.name, e.x, screenY - 16)
      }
    }

    // Draw ambient bubbles
    for (const e of entities) {
      if (e.type !== 'bubble') continue
      const screenY = e.y - camY
      if (screenY < -10 || screenY > h + 10) continue
      ctx.beginPath()
      ctx.arc(e.x, screenY, 2 + Math.sin(tick * 0.03 + e.x) * 1, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + Math.sin(tick * 0.02 + e.y) * 0.05})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    }

    // Draw player (diver)
    const playerScreenY = player.y - camY
    ctx.save()
    ctx.font = '22px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // Player bubble trail
    if (tick % 8 === 0) {
      entities.push({
        id: `pb-${tick}`,
        x: player.x + (Math.random() - 0.5) * 6,
        y: player.y - 8,
        type: 'bubble', sprite: '○', name: '',
        vx: (Math.random() - 0.5) * 0.3, vy: -0.8,
      })
    }
    ctx.fillText('🤿', player.x, playerScreenY)
    ctx.restore()

    // Oxygen bar overlay
    const barW = 80
    const barH = 4
    const barX = w / 2 - barW / 2
    const barY = 12
    ctx.fillStyle = 'rgba(0,0,0,0.4)'
    ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2)
    const oxyPct = oxygenRef.current / 100
    ctx.fillStyle = oxyPct > 0.5 ? '#22d3ee' : oxyPct > 0.25 ? '#eab308' : '#ef4444'
    ctx.fillRect(barX, barY, barW * oxyPct, barH)

    // Depth indicator
    ctx.font = '9px monospace'
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.textAlign = 'left'
    ctx.fillText(`${depthRef.current}m`, 8, 16)

    // Score
    ctx.textAlign = 'right'
    ctx.fillText(`${sessionFinds.length} found`, w - 8, 16)

    animRef.current = requestAnimationFrame(gameLoop)
  }, [phase, captured, onCollect, sessionFinds.length])

  useEffect(() => {
    if (phase === 'diving') {
      animRef.current = requestAnimationFrame(gameLoop)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [phase, gameLoop])

  const handleContinueDiving = () => {
    setEncounterCreature(null)
    setPhase('diving')
  }

  const handleBattleCreature = () => {
    if (encounterCreature) {
      onEncounter(encounterCreature)
    }
  }

  return (
    <div className="absolute inset-0 z-[55] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(180deg, rgba(6,182,212,0.1) 0%, rgba(3,8,30,0.98) 100%)' }}>

      {phase === 'diving' && (
        <div className="flex flex-col items-center gap-2 w-full max-w-[320px]">
          <div className="flex items-center justify-between w-full px-2">
            <div className="flex items-center gap-2">
              <span className="text-xs">🤿</span>
              <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${oxygen}%`,
                  background: oxygen > 50 ? 'linear-gradient(90deg, #06b6d4, #22d3ee)' : oxygen > 25 ? '#eab308' : '#ef4444',
                }} />
              </div>
              <span className="text-[8px] text-white/40">{Math.floor(oxygen)}% O₂</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] text-cyan-400">{depth}m deep</span>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 text-[10px]">✕</button>
            </div>
          </div>

          <canvas ref={canvasRef} width={300} height={400}
            className="rounded-xl border"
            style={{ borderColor: 'rgba(6,182,212,0.15)', boxShadow: '0 0 30px rgba(6,182,212,0.1)' }} />

          <div className="flex items-center gap-1.5">
            {sessionFinds.map((s, i) => (
              <span key={i} className="text-sm">{s}</span>
            ))}
            {sessionFinds.length === 0 && (
              <span className="text-white/20 text-[9px]">Dive deeper to find treasures!</span>
            )}
          </div>

          <p className="text-white/20 text-[7px]">WASD/Arrows to swim · Surface to refill O₂ · Avoid jellyfish</p>
        </div>
      )}

      {phase === 'encounter' && encounterCreature && (
        <div className="flex flex-col items-center gap-4 max-w-xs w-full px-4">
          <div className="text-center">
            <p className="text-[8px] text-cyan-400 font-black uppercase tracking-[4px] mb-1">UNDERWATER ENCOUNTER</p>
            <h2 className="text-white text-base font-bold">You found a {encounterCreature.name}!</h2>
          </div>

          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl" style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(59,130,246,0.1))',
              border: '2px solid rgba(6,182,212,0.3)',
              boxShadow: '0 0 20px rgba(6,182,212,0.15)',
              animation: 'pulse 2s ease-in-out infinite',
            }}>
              {encounterCreature.sprite}
            </div>
            {captured.includes(encounterCreature.id) && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-green-500/80 text-white px-1 rounded-full">✓</span>
            )}
          </div>

          <div className="rounded-xl p-3 w-full text-center" style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(6,182,212,0.15)',
          }}>
            <p className="text-white/40 text-[10px]">{encounterCreature.description}</p>
            <p className="text-cyan-400 text-[8px] mt-1">{encounterCreature.type} · {encounterCreature.rarity}</p>
          </div>

          <div className="flex gap-2">
            <button onClick={handleBattleCreature}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))',
                border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5',
              }}>
              Battle!
            </button>
            <button onClick={handleContinueDiving}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.15))',
                border: '1px solid rgba(6,182,212,0.35)', color: '#67e8f9',
              }}>
              Keep Diving
            </button>
          </div>
        </div>
      )}

      {phase === 'surfaced' && (
        <div className="flex flex-col items-center gap-4 max-w-xs w-full px-4">
          <div className="text-center">
            <span className="text-4xl block mb-2">🫧</span>
            <p className="text-[8px] text-cyan-400 font-black uppercase tracking-[4px] mb-1">SURFACED</p>
            <h2 className="text-white text-base font-bold">Dive Complete!</h2>
            <p className="text-white/30 text-[10px] mt-1">
              {oxygen <= 0 ? 'You ran out of oxygen!' : 'Back to the surface'}
            </p>
          </div>

          <div className="rounded-xl p-4 w-full" style={{
            background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)',
          }}>
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div>
                <p className="text-white/30 text-[7px] uppercase">Max Depth</p>
                <p className="text-cyan-400 text-sm font-bold">{depth}m</p>
              </div>
              <div>
                <p className="text-white/30 text-[7px] uppercase">Treasures</p>
                <p className="text-amber-400 text-sm font-bold">{sessionFinds.length}</p>
              </div>
              <div>
                <p className="text-white/30 text-[7px] uppercase">Score</p>
                <p className="text-green-400 text-sm font-bold">{score}</p>
              </div>
            </div>

            {sessionFinds.length > 0 && (
              <div className="flex gap-1 justify-center flex-wrap">
                {sessionFinds.map((s, i) => (
                  <span key={i} className="text-lg">{s}</span>
                ))}
              </div>
            )}
          </div>

          <button onClick={onClose}
            className="px-8 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.15))',
              border: '1px solid rgba(6,182,212,0.35)', color: '#67e8f9',
              boxShadow: '0 0 20px rgba(6,182,212,0.15)',
            }}>
            Return to Surface
          </button>
        </div>
      )}
    </div>
  )
}
