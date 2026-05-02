import { useState, useRef, useEffect, useCallback } from 'react'
import type { InventoryItem, CapturedCreature } from '@/types/game'

// ============================================================
// Santa Cruz Beach Boardwalk Minigame
// Rides, carnival games, and prizes — a fun diversion
// ============================================================

interface Props {
  playerLevel: number
  team: CapturedCreature[]
  inventory: InventoryItem[]
  onClose: () => void
  onWinPrize: (item: InventoryItem) => void
  onHealTeam: () => void
}

type Activity = 'hub' | 'ring_toss' | 'roller_coaster' | 'whack_a_crab' | 'fortune'

interface Prize {
  name: string
  sprite: string
  type: InventoryItem['type']
  description: string
  rarity: number // 0-1, higher = rarer
}

const PRIZES: Prize[] = [
  { name: 'Cotton Candy', sprite: '🍭', type: 'heal', description: 'Sweet treat that restores 15 HP', rarity: 0.1 },
  { name: 'Boardwalk Funnel Cake', sprite: '🧇', type: 'heal', description: 'Restores 30 HP to active creature', rarity: 0.25 },
  { name: 'Lucky Seashell', sprite: '🐚', type: 'boost', description: 'Increases capture chance by 15%', rarity: 0.4 },
  { name: 'Giant Plushie', sprite: '🧸', type: 'boost', description: 'Boosts XP gain by 20% for 5 encounters', rarity: 0.55 },
  { name: 'Boardwalk Ticket Bundle', sprite: '🎟️', type: 'material', description: 'Trade for rare items at the Boardwalk', rarity: 0.7 },
  { name: 'Golden Surfboard Charm', sprite: '🏄', type: 'boost', description: 'Water creatures gain +5 to all stats', rarity: 0.85 },
]

function getPrize(): Prize {
  const roll = Math.random()
  // Higher roll = rarer prize
  const sorted = [...PRIZES].sort((a, b) => a.rarity - b.rarity)
  for (const prize of sorted) {
    if (roll <= prize.rarity + 0.15) return prize
  }
  return sorted[0]
}

// Ring Toss minigame — click when ring is over target
function RingToss({ onWin, onLose }: { onWin: () => void; onLose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [throws, setThrows] = useState(3)
  const [hits, setHits] = useState(0)
  const [ringPos, setRingPos] = useState(0)
  const [throwing, setThrowing] = useState(false)
  const [result, setResult] = useState<'hit' | 'miss' | null>(null)
  const animRef = useRef<number>(0)
  const speedRef = useRef(2)

  // Animate ring swinging
  useEffect(() => {
    if (throwing) return
    let pos = ringPos
    const tick = () => {
      pos += speedRef.current
      if (pos > 280 || pos < 0) speedRef.current *= -1
      setRingPos(pos)
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [throwing])

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)

    // Background — boardwalk stall
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, '#1e3a5f')
    grad.addColorStop(1, '#0f1e36')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Bottle targets
    const targetX = 140
    ctx.fillStyle = '#d4a574'
    ctx.fillRect(targetX - 3, H - 70, 6, 35)
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(targetX, H - 75, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '8px system-ui'
    ctx.textAlign = 'center'
    ctx.fillText('🎯', targetX, H - 72)

    // Ring
    if (!throwing) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.ellipse(ringPos, H - 50, 12, 6, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Result flash
    if (result === 'hit') {
      ctx.fillStyle = 'rgba(74,222,128,0.3)'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '24px system-ui'
      ctx.textAlign = 'center'
      ctx.fillText('🎉', W / 2, H / 2)
    } else if (result === 'miss') {
      ctx.fillStyle = 'rgba(239,68,68,0.2)'
      ctx.fillRect(0, 0, W, H)
      ctx.font = '16px system-ui'
      ctx.textAlign = 'center'
      ctx.fillStyle = '#ef4444'
      ctx.fillText('Miss!', W / 2, H / 2)
    }

    // UI
    ctx.fillStyle = '#fff'
    ctx.font = '10px system-ui'
    ctx.textAlign = 'left'
    ctx.fillText(`Throws: ${'🔴'.repeat(throws)}`, 10, 20)
    ctx.fillText(`Hits: ${hits}/1`, 10, 35)

  }, [ringPos, throws, hits, throwing, result])

  const handleThrow = useCallback(() => {
    if (throwing || throws <= 0) return
    setThrowing(true)

    const targetX = 140
    const dist = Math.abs(ringPos - targetX)
    const isHit = dist < 18

    setResult(isHit ? 'hit' : 'miss')

    setTimeout(() => {
      if (isHit) {
        setHits(h => h + 1)
        setTimeout(() => onWin(), 500)
      } else {
        const remaining = throws - 1
        setThrows(remaining)
        if (remaining <= 0) {
          setTimeout(() => onLose(), 500)
        } else {
          setThrowing(false)
          setResult(null)
        }
      }
    }, 600)
  }, [throwing, throws, ringPos, onWin, onLose])

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} width={Math.min(280, window.innerWidth - 48)} height={180} className="rounded-xl border border-white/10" style={{ maxWidth: 'calc(100vw - 48px)' }} />
      <button
        onClick={handleThrow}
        disabled={throwing || throws <= 0}
        className="px-6 py-2 rounded-lg text-xs font-bold transition-all active:scale-95"
        style={{
          background: throwing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: throwing ? 'rgba(255,255,255,0.3)' : '#000',
        }}
      >
        {throwing ? 'Throwing...' : 'Throw Ring!'}
      </button>
      <p className="text-white/30 text-[9px]">Click when the ring is over the target</p>
    </div>
  )
}

// Whack-a-Crab minigame — tap crabs as they pop up
function WhackACrab({ onWin, onLose }: { onWin: () => void; onLose: () => void }) {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [crabs, setCrabs] = useState<{ id: number; x: number; y: number; active: boolean }[]>([])
  const [gameOver, setGameOver] = useState(false)
  const nextIdRef = useRef(0)

  // Timer
  useEffect(() => {
    if (gameOver) return
    const iv = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setGameOver(true)
          clearInterval(iv)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [gameOver])

  // Spawn crabs
  useEffect(() => {
    if (gameOver) return
    const iv = setInterval(() => {
      const id = nextIdRef.current++
      const newCrab = {
        id,
        x: 20 + Math.random() * 220,
        y: 20 + Math.random() * 120,
        active: true,
      }
      setCrabs(prev => [...prev.slice(-5), newCrab])
      // Auto-hide after 1.2s
      setTimeout(() => {
        setCrabs(prev => prev.map(c => c.id === id ? { ...c, active: false } : c))
      }, 1200)
    }, 700)
    return () => clearInterval(iv)
  }, [gameOver])

  // Check win/lose
  useEffect(() => {
    if (!gameOver) return
    setTimeout(() => {
      if (score >= 5) onWin()
      else onLose()
    }, 1000)
  }, [gameOver, score, onWin, onLose])

  const whack = (id: number) => {
    setCrabs(prev => prev.map(c => c.id === id ? { ...c, active: false } : c))
    setScore(s => s + 1)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-4 mb-1">
        <span className="text-yellow-300 text-xs font-bold">Score: {score}/5</span>
        <span className="text-white/40 text-xs">⏱ {timeLeft}s</span>
      </div>
      <div
        className="relative rounded-xl border border-white/10 overflow-hidden"
        style={{
          width: Math.min(280, window.innerWidth - 48), height: 160,
          background: 'linear-gradient(180deg, #0c4a6e 0%, #164e63 100%)',
        }}
      >
        {/* Sand holes */}
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              left: 20 + (i % 3) * 90,
              top: 30 + Math.floor(i / 3) * 70,
              width: 40, height: 20,
              background: 'rgba(139,92,46,0.3)',
              border: '1px solid rgba(139,92,46,0.4)',
            }}
          />
        ))}

        {/* Crabs */}
        {crabs.filter(c => c.active).map(crab => (
          <button
            key={crab.id}
            onClick={() => whack(crab.id)}
            className="absolute text-2xl animate-bounce cursor-pointer active:scale-75 transition-transform"
            style={{ left: crab.x, top: crab.y }}
          >
            🦀
          </button>
        ))}

        {gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center">
              <p className="text-xl mb-1">{score >= 5 ? '🎉' : '😢'}</p>
              <p className="text-white text-sm font-bold">
                {score >= 5 ? 'You win!' : 'Not enough crabs!'}
              </p>
            </div>
          </div>
        )}
      </div>
      <p className="text-white/30 text-[9px]">Tap 5 crabs before time runs out!</p>
    </div>
  )
}

export default function BoardwalkMinigame({ playerLevel, onClose, onWinPrize, onHealTeam }: Props) {
  const [activity, setActivity] = useState<Activity>('hub')
  const [tickets, setTickets] = useState(3 + Math.floor(playerLevel / 3))
  const [prizeWon, setPrizeWon] = useState<Prize | null>(null)
  const [coasterRiding, setCoasterRiding] = useState(false)
  const [coasterPhase, setCoasterPhase] = useState(0)
  const [fortune, setFortune] = useState<string | null>(null)

  const FORTUNES = [
    'A rare creature awaits you in the fog...',
    'The redwoods hold secrets for the patient explorer.',
    'Look beneath the waves near the Golden Gate.',
    'Your next evolution is closer than you think!',
    'A legendary creature stirs in the mountains at dusk.',
    'The marshlands reward those who tread carefully.',
    'Trade wisely — fortune favors the bold.',
    'Sometimes the smallest creature holds the greatest power.',
  ]

  const handleGameWin = useCallback(() => {
    const prize = getPrize()
    setPrizeWon(prize)
    onWinPrize({
      id: `boardwalk_${prize.name.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
      name: prize.name,
      sprite: prize.sprite,
      type: prize.type,
      quantity: 1,
      description: prize.description,
    })
    setActivity('hub')
  }, [onWinPrize])

  const handleGameLose = useCallback(() => {
    setPrizeWon(null)
    setActivity('hub')
  }, [])

  // Roller coaster animation
  useEffect(() => {
    if (!coasterRiding) return
    const phases = ['Climbing...', 'Higher...', 'Almost there...', 'WHOOOOSH!', 'Loop-de-loop!', 'Splash zone!', 'Slowing down...']
    let i = 0
    const iv = setInterval(() => {
      i++
      setCoasterPhase(i)
      if (i >= phases.length) {
        clearInterval(iv)
        setCoasterRiding(false)
        setCoasterPhase(0)
        // Heal team after ride!
        onHealTeam()
      }
    }, 800)
    return () => clearInterval(iv)
  }, [coasterRiding, onHealTeam])

  const coasterPhases = ['Climbing...', 'Higher...', 'Almost there...', 'WHOOOOSH!', 'Loop-de-loop!', 'Splash zone!', 'Slowing down...']

  if (activity === 'ring_toss') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0f172a 100%)',
      }}>
        <h2 className="text-yellow-300 font-bold text-sm mb-3">🎯 Ring Toss</h2>
        <RingToss onWin={handleGameWin} onLose={handleGameLose} />
        <button onClick={() => setActivity('hub')} className="mt-3 text-white/30 text-[10px] hover:text-white/60">
          Back to Boardwalk
        </button>
      </div>
    )
  }

  if (activity === 'whack_a_crab') {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center" style={{
        background: 'linear-gradient(180deg, #1a0a2e 0%, #0f172a 100%)',
      }}>
        <h2 className="text-yellow-300 font-bold text-sm mb-3">🦀 Whack-a-Crab</h2>
        <WhackACrab onWin={handleGameWin} onLose={handleGameLose} />
        <button onClick={() => setActivity('hub')} className="mt-3 text-white/30 text-[10px] hover:text-white/60">
          Back to Boardwalk
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-y-auto" style={{
      background: 'linear-gradient(180deg, #1a0a2e 0%, #0f1729 50%, #0a1628 100%)',
    }}>
      {/* Header with boardwalk banner */}
      <div className="relative px-4 pt-4 pb-3 text-center" style={{
        background: 'linear-gradient(180deg, rgba(245,158,11,0.12) 0%, transparent 100%)',
      }}>
        <div className="text-3xl mb-1">🎡</div>
        <h1 className="text-white font-black text-lg tracking-tight">Santa Cruz Boardwalk</h1>
        <p className="text-white/30 text-[10px]">Rides, games, and prizes await!</p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="text-yellow-400 text-xs font-bold">🎟️ {tickets} tickets</span>
        </div>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 text-xs"
        >
          Leave
        </button>
      </div>

      {/* Prize notification */}
      {prizeWon && (
        <div className="mx-4 mt-2 rounded-xl p-3 text-center" style={{
          background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(74,222,128,0.05))',
          border: '1px solid rgba(74,222,128,0.2)',
        }}>
          <p className="text-[10px] text-green-400/60 uppercase tracking-wider mb-1">Prize Won!</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl">{prizeWon.sprite}</span>
            <div className="text-left">
              <p className="text-green-300 text-xs font-bold">{prizeWon.name}</p>
              <p className="text-white/30 text-[9px]">{prizeWon.description}</p>
            </div>
          </div>
          <button
            onClick={() => setPrizeWon(null)}
            className="mt-2 text-[9px] text-white/30 hover:text-white/60"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Activities grid */}
      <div className="flex-1 px-4 py-3 grid grid-cols-2 gap-2.5">
        {/* Ring Toss */}
        <button
          onClick={() => {
            if (tickets > 0) {
              setTickets(t => t - 1)
              setActivity('ring_toss')
            }
          }}
          disabled={tickets <= 0}
          className="rounded-xl p-3 text-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(245,158,11,0.03))',
            border: '1px solid rgba(245,158,11,0.15)',
            opacity: tickets <= 0 ? 0.4 : 1,
          }}
        >
          <div className="text-2xl mb-1.5">🎯</div>
          <p className="text-white text-xs font-bold">Ring Toss</p>
          <p className="text-white/30 text-[9px] mt-0.5">Land the ring for a prize</p>
          <p className="text-yellow-400/50 text-[8px] mt-1">1 ticket</p>
        </button>

        {/* Whack-a-Crab */}
        <button
          onClick={() => {
            if (tickets > 0) {
              setTickets(t => t - 1)
              setActivity('whack_a_crab')
            }
          }}
          disabled={tickets <= 0}
          className="rounded-xl p-3 text-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(239,68,68,0.03))',
            border: '1px solid rgba(239,68,68,0.15)',
            opacity: tickets <= 0 ? 0.4 : 1,
          }}
        >
          <div className="text-2xl mb-1.5">🦀</div>
          <p className="text-white text-xs font-bold">Whack-a-Crab</p>
          <p className="text-white/30 text-[9px] mt-0.5">Tap 5 crabs to win</p>
          <p className="text-yellow-400/50 text-[8px] mt-1">1 ticket</p>
        </button>

        {/* Giant Dipper Roller Coaster */}
        <button
          onClick={() => {
            if (tickets > 0 && !coasterRiding) {
              setTickets(t => t - 1)
              setCoasterRiding(true)
            }
          }}
          disabled={tickets <= 0 || coasterRiding}
          className="rounded-xl p-3 text-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.03))',
            border: '1px solid rgba(168,85,247,0.15)',
            opacity: tickets <= 0 ? 0.4 : 1,
          }}
        >
          <div className="text-2xl mb-1.5">🎢</div>
          <p className="text-white text-xs font-bold">Giant Dipper</p>
          <p className="text-white/30 text-[9px] mt-0.5">Classic coaster — heals your team!</p>
          <p className="text-yellow-400/50 text-[8px] mt-1">1 ticket</p>
        </button>

        {/* Fortune Teller */}
        <button
          onClick={() => {
            if (tickets > 0) {
              setTickets(t => t - 1)
              setFortune(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])
            }
          }}
          disabled={tickets <= 0}
          className="rounded-xl p-3 text-center transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(139,92,246,0.03))',
            border: '1px solid rgba(139,92,246,0.15)',
            opacity: tickets <= 0 ? 0.4 : 1,
          }}
        >
          <div className="text-2xl mb-1.5">🔮</div>
          <p className="text-white text-xs font-bold">Fortune Teller</p>
          <p className="text-white/30 text-[9px] mt-0.5">Mystic hints about rare creatures</p>
          <p className="text-yellow-400/50 text-[8px] mt-1">1 ticket</p>
        </button>
      </div>

      {/* Roller coaster animation overlay */}
      {coasterRiding && (
        <div className="absolute inset-0 z-50 flex items-center justify-center" style={{
          background: 'linear-gradient(180deg, rgba(88,28,135,0.9), rgba(15,23,42,0.95))',
        }}>
          <div className="text-center">
            <div className="text-5xl mb-4 animate-bounce">🎢</div>
            <p className="text-purple-300 text-sm font-bold mb-2">
              {coasterPhases[Math.min(coasterPhase, coasterPhases.length - 1)]}
            </p>
            <div className="flex justify-center gap-1 mb-3">
              {coasterPhases.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{
                    background: i <= coasterPhase ? '#a855f7' : 'rgba(255,255,255,0.1)',
                    transform: i === coasterPhase ? 'scale(1.5)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
            <p className="text-white/30 text-[9px]">Your team is loving this ride!</p>
          </div>
        </div>
      )}

      {/* Fortune display */}
      {fortune && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setFortune(null)}>
          <div className="mx-8 rounded-2xl p-5 text-center" style={{
            background: 'linear-gradient(135deg, rgba(88,28,135,0.9), rgba(49,10,101,0.95))',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 8px 32px rgba(88,28,135,0.4)',
          }}>
            <div className="text-3xl mb-3">🔮</div>
            <p className="text-purple-200 text-sm font-medium italic leading-relaxed mb-3">
              &ldquo;{fortune}&rdquo;
            </p>
            <p className="text-white/20 text-[9px]">Tap to dismiss</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 pb-3 pt-2 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-white/20 text-[8px]">
          {tickets > 0
            ? `You have ${tickets} ticket${tickets > 1 ? 's' : ''} remaining`
            : 'Out of tickets! Come back later for more fun.'}
        </p>
      </div>
    </div>
  )
}
