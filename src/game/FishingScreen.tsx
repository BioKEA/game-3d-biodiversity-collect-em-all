import { useState, useEffect, useRef, useCallback } from 'react'
import type { BiomeType } from '@/types/game'
import { SFX } from './sounds'
import PixelCreatureToken from './PixelCreatureToken'
import PixelIcon from './PixelIcon'

interface FishDef {
  id: string
  name: string
  sprite: string
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  difficulty: number // 0.3 = easy, 0.8 = hard (how fast the fish moves)
  xpReward: number
  description: string
  biomes: BiomeType[]
}

const FISH: FishDef[] = [
  { id: 'striped-bass', name: 'Striped Bass', sprite: '🐟', rarity: 'common', difficulty: 0.3, xpReward: 10, description: 'A silvery game fish common in the Bay', biomes: ['water', 'beach', 'marsh'] },
  { id: 'leopard-shark', name: 'Leopard Shark', sprite: '🦈', rarity: 'uncommon', difficulty: 0.5, xpReward: 25, description: 'Spotted shark of the shallow Bay waters', biomes: ['water', 'beach'] },
  { id: 'dungeness-crab', name: 'Dungeness Crab', sprite: '🦀', rarity: 'uncommon', difficulty: 0.45, xpReward: 20, description: 'The prized catch of SF fishermen', biomes: ['water', 'beach', 'marsh'] },
  { id: 'chinook-salmon', name: 'Chinook Salmon', sprite: '🐠', rarity: 'rare', difficulty: 0.65, xpReward: 40, description: 'A powerful salmon running through the Bay', biomes: ['water', 'marsh'] },
  { id: 'bat-ray', name: 'Bat Ray', sprite: '🪸', rarity: 'rare', difficulty: 0.6, xpReward: 35, description: 'Graceful ray gliding along the muddy bottom', biomes: ['water', 'beach', 'marsh'] },
  { id: 'white-sturgeon', name: 'White Sturgeon', sprite: '🐋', rarity: 'legendary', difficulty: 0.8, xpReward: 80, description: 'An ancient giant lurking in the deep Bay', biomes: ['water'] },
  { id: 'pacific-herring', name: 'Pacific Herring', sprite: '🐟', rarity: 'common', difficulty: 0.25, xpReward: 8, description: 'Small schooling fish — a Bay staple', biomes: ['water', 'beach', 'marsh'] },
  { id: 'red-rock-crab', name: 'Red Rock Crab', sprite: '🦞', rarity: 'common', difficulty: 0.35, xpReward: 12, description: 'Scuttling along rocky tide pools', biomes: ['beach', 'urban'] },
  { id: 'halibut', name: 'California Halibut', sprite: '🐡', rarity: 'uncommon', difficulty: 0.55, xpReward: 30, description: 'Flat-bodied predator of the sandy bottom', biomes: ['water', 'beach'] },
  { id: 'golden-trout', name: 'Golden Trout', sprite: '✨', rarity: 'legendary', difficulty: 0.75, xpReward: 60, description: 'A mythical shimmer beneath the waves', biomes: ['water', 'marsh', 'forest'] },
]

const RARITY_COLORS: Record<string, string> = {
  common: '#9ca3af',
  uncommon: '#22c55e',
  rare: '#3b82f6',
  legendary: '#f59e0b',
}

interface Props {
  biome: BiomeType
  onClose: () => void
  onCatch: (fish: FishDef) => void
  fishLog?: string[]  // previously caught fish IDs
}

type Phase = 'casting' | 'waiting' | 'hooked' | 'reeling' | 'caught' | 'escaped'

export type { FishDef }

export default function FishingScreen({ biome, onClose, onCatch, fishLog = [] }: Props) {
  const [phase, setPhase] = useState<Phase>('casting')
  const [fish, setFish] = useState<FishDef | null>(null)
  const [reelPos, setReelPos] = useState(50) // 0-100, fish position
  const [catchZone, setCatchZone] = useState(50) // 0-100, player cursor
  const [tension, setTension] = useState(0) // 0-100, catch progress
  const [castProgress, setCastProgress] = useState(0)
  const frameRef = useRef(0)
  const fishDirRef = useRef(1)
  const fishSpeedRef = useRef(0)
  const [catchLog, setCatchLog] = useState<string[]>([])
  const [streak, setStreak] = useState(0)
  const [sessionCaught, setSessionCaught] = useState<string[]>([])

  const biomeFishIds = new Set(FISH.filter(f => f.biomes.includes(biome)).map(f => f.id))
  const uniqueFish = new Set([...fishLog, ...sessionCaught].filter(id => biomeFishIds.has(id))).size
  const totalFish = biomeFishIds.size

  // Pick a fish based on biome
  const pickFish = useCallback(() => {
    const pool = FISH.filter(f => f.biomes.includes(biome))
    // Weighted by rarity
    const weights = pool.map(f => {
      switch (f.rarity) {
        case 'common': return 40
        case 'uncommon': return 25
        case 'rare': return 10
        case 'legendary': return 3
      }
    })
    const total = weights.reduce((a, b) => a + b, 0)
    let roll = Math.random() * total
    for (let i = 0; i < pool.length; i++) {
      roll -= weights[i]
      if (roll <= 0) return pool[i]
    }
    return pool[0]
  }, [biome])

  // Casting animation
  useEffect(() => {
    if (phase !== 'casting') return
    const interval = setInterval(() => {
      setCastProgress(p => {
        if (p >= 100) {
          clearInterval(interval)
          setPhase('waiting')
          return 100
        }
        return p + 4
      })
    }, 30)
    return () => clearInterval(interval)
  }, [phase])

  // Waiting for bite
  useEffect(() => {
    if (phase !== 'waiting') return
    const waitTime = 1500 + Math.random() * 3000
    const timer = setTimeout(() => {
      const picked = pickFish()
      setFish(picked)
      fishSpeedRef.current = picked.difficulty
      SFX.hit()
      setPhase('hooked')
      setCatchLog([`${picked.sprite} ${picked.name} on the line!`])

      // Auto-start reeling after short delay
      setTimeout(() => setPhase('reeling'), 800)
    }, waitTime)
    return () => clearTimeout(timer)
  }, [phase, pickFish])

  // Reeling game loop
  useEffect(() => {
    if (phase !== 'reeling' || !fish) return

    const loop = () => {
      // Fish AI: erratic movement
      setReelPos(prev => {
        const speed = fishSpeedRef.current
        // Random direction changes
        if (Math.random() < 0.05 + speed * 0.1) {
          fishDirRef.current = -fishDirRef.current
        }
        // Occasional lunges
        const lunge = Math.random() < 0.02 ? (Math.random() - 0.5) * 30 * speed : 0
        const delta = fishDirRef.current * (1 + speed * 3) + lunge
        return Math.max(5, Math.min(95, prev + delta))
      })

      // Check if player cursor is near the fish
      setTension(prev => {
        const dist = Math.abs(reelPos - catchZone)
        if (dist < 15) {
          // In the zone — progress builds
          const gain = dist < 8 ? 1.2 : 0.6
          const newVal = Math.min(100, prev + gain)
          if (newVal >= 100) {
            SFX.capture()
            setPhase('caught')
            setCatchLog(l => [...l, `Caught the ${fish.name}!`])
          }
          return newVal
        } else {
          // Out of zone — progress decays
          const loss = 0.4 + fish.difficulty * 0.3
          const newVal = Math.max(0, prev - loss)
          if (prev > 10 && newVal <= 0) {
            SFX.flee()
            setPhase('escaped')
            setCatchLog(l => [...l, `${fish.name} got away...`])
          }
          return newVal
        }
      })

      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [phase, fish, reelPos, catchZone])

  // Player input — move catch zone with keys or touch
  useEffect(() => {
    if (phase !== 'reeling') return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w') {
        e.preventDefault()
        setCatchZone(p => Math.max(0, p - 4))
      }
      if (e.key === 'ArrowDown' || e.key === 's') {
        e.preventDefault()
        setCatchZone(p => Math.min(100, p + 4))
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase])

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'reeling') return
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const pct = (y / rect.height) * 100
    setCatchZone(Math.max(0, Math.min(100, pct)))
  }

  const handleRetry = () => {
    setPhase('casting')
    setFish(null)
    setReelPos(50)
    setCatchZone(50)
    setTension(0)
    setCastProgress(0)
    setCatchLog([])
  }

  const rarityColor = fish ? RARITY_COLORS[fish.rarity] : '#9ca3af'

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{
      background: 'linear-gradient(180deg, rgba(6,26,50,0.95) 0%, rgba(2,12,28,0.98) 100%)',
    }}>
      {/* Water animation background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: 100 + i * 40,
              height: 100 + i * 40,
              left: `${10 + (i * 13) % 80}%`,
              top: `${20 + (i * 17) % 60}%`,
              background: `radial-gradient(circle, rgba(56,189,248,0.3), transparent)`,
              animation: `pulse ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center gap-4 max-w-sm w-full px-4">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-white text-lg font-bold tracking-wide flex items-center gap-2 justify-center">
            <PixelIcon icon="🎣" size={24} variant="water" selected />
            Fishing
          </h2>
          <p className="text-white/30 text-[10px] mt-0.5">
            {phase === 'casting' && 'Casting line...'}
            {phase === 'waiting' && 'Waiting for a bite...'}
            {phase === 'hooked' && 'Something bit!'}
            {phase === 'reeling' && 'Use ▲▼ keys or tap to keep the cursor on the fish!'}
            {phase === 'caught' && 'Nice catch!'}
            {phase === 'escaped' && 'The fish got away!'}
          </p>
        </div>

        {/* Main fishing UI */}
        {(phase === 'casting' || phase === 'waiting') && (
          <div className="flex flex-col items-center gap-3">
            {/* Cast animation */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-sky-500/20" />
              <div
                className="absolute rounded-full border-2 border-sky-400/40"
                style={{
                  width: `${castProgress}%`,
                  height: `${castProgress}%`,
                  transition: 'all 0.1s',
                }}
              />
              {phase === 'waiting' && (
                <div className="relative flex flex-col items-center gap-2">
                  <PixelIcon icon="🎣" size={44} variant="water" selected className="animate-bounce" />
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-sky-400 rounded-full animate-pulse" />
                    <div className="w-1 h-1 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                    <div className="w-1 h-1 bg-sky-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }} />
                  </div>
                </div>
              )}
              {phase === 'casting' && (
                <PixelIcon icon="🎣" size={44} variant="water" selected />
              )}
            </div>
          </div>
        )}

        {phase === 'hooked' && fish && (
          <div className="flex flex-col items-center gap-3 animate-in zoom-in duration-300">
            <PixelCreatureToken creature={{ ...fish, color: rarityColor }} size={64} selected style={{ animation: 'bounce 1s infinite' }} />
            <p className="text-white font-bold">{fish.name}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
              color: rarityColor,
              background: `${rarityColor}15`,
              border: `1px solid ${rarityColor}30`,
            }}>
              {fish.rarity.toUpperCase()}
            </span>
          </div>
        )}

        {phase === 'reeling' && fish && (
          <div className="flex gap-3 sm:gap-4 items-stretch w-full">
            {/* Reel bar */}
            <div
              className="relative w-10 sm:w-12 rounded-lg overflow-hidden cursor-pointer"
              style={{
                height: window.innerWidth < 640 ? 180 : 240,
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onClick={handleBarClick}
            >
              {/* Water gradient */}
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(180deg, rgba(56,189,248,0.1) 0%, rgba(2,132,199,0.2) 100%)',
              }} />

              {/* Catch zone (player cursor) */}
              <div
                className="absolute left-0 right-0 h-8 rounded transition-all duration-75"
                style={{
                  top: `${catchZone - 3.3}%`,
                  background: 'rgba(74,222,128,0.2)',
                  border: '1px solid rgba(74,222,128,0.4)',
                  boxShadow: '0 0 8px rgba(74,222,128,0.2)',
                }}
              />

              {/* Fish position */}
              <div
                className="absolute left-1/2 -translate-x-1/2 transition-none"
                style={{ top: `${reelPos - 2}%` }}
              >
                <PixelCreatureToken creature={{ ...fish, color: rarityColor }} size={24} />
              </div>
            </div>

            {/* Info panel */}
            <div className="flex-1 flex flex-col gap-3">
              {/* Fish info */}
              <div className="rounded-lg p-2" style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div className="flex items-center gap-2 mb-1">
                  <PixelCreatureToken creature={{ ...fish, color: rarityColor }} size={28} />
                  <div>
                    <p className="text-white text-xs font-semibold">{fish.name}</p>
                    <span className="text-[8px] font-semibold" style={{ color: rarityColor }}>
                      {fish.rarity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <p className="text-white/30 text-[9px]">{fish.description}</p>
              </div>

              {/* Tension meter */}
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-white/40 text-[9px] uppercase tracking-wider">Catch Progress</span>
                  <span className="text-white/50 text-[9px]">{Math.round(tension)}%</span>
                </div>
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-100"
                    style={{
                      width: `${tension}%`,
                      background: tension > 70
                        ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                        : tension > 30
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                      boxShadow: tension > 70 ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                    }}
                  />
                </div>
              </div>

              {/* Difficulty */}
              <div className="flex items-center gap-2">
                <span className="text-white/30 text-[9px]">Difficulty:</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-sm"
                      style={{
                        background: i < Math.ceil(fish.difficulty * 5)
                          ? `${rarityColor}80`
                          : 'rgba(255,255,255,0.06)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Controls hint */}
              <div className="mt-auto rounded-md p-1.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <p className="text-white/25 text-[8px] text-center">
                  ▲▼ or tap the bar to move cursor
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result screens */}
        {phase === 'caught' && fish && (
          <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-500">
            <div className="relative">
              <PixelCreatureToken creature={{ ...fish, color: rarityColor }} size={76} selected />
              <div className="absolute -inset-4 rounded-full animate-ping opacity-20" style={{
                background: `radial-gradient(circle, ${rarityColor}, transparent)`,
              }} />
            </div>
            <div className="text-center">
              <p className="text-white text-base font-bold">{fish.name}</p>
              <div className="flex items-center gap-2 justify-center mt-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{
                  color: rarityColor,
                  background: `${rarityColor}15`,
                  border: `1px solid ${rarityColor}30`,
                }}>
                  {fish.rarity.toUpperCase()}
                </span>
                {!fishLog.includes(fish.id) && !sessionCaught.includes(fish.id) && (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{
                    background: 'rgba(74,222,128,0.15)',
                    color: '#4ade80',
                    border: '1px solid rgba(74,222,128,0.3)',
                  }}>
                    NEW!
                  </span>
                )}
              </div>
              <p className="text-white/40 text-[10px] mt-2">{fish.description}</p>
              <div className="flex items-center gap-3 justify-center mt-2">
                <p className="text-amber-400 text-xs font-semibold">+{fish.xpReward} XP</p>
                {streak > 1 && (
                  <p className="text-cyan-400 text-[10px] font-semibold inline-flex items-center gap-1">
                    <PixelIcon icon="🔥" size={16} variant="danger" />
                    {streak} streak!
                  </p>
                )}
              </div>
            </div>

            {/* Collection progress */}
            <div className="w-full rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/30 text-[8px] uppercase tracking-wider">Fish Collection</span>
                <span className="text-cyan-400 text-[9px] font-mono">{uniqueFish}/{totalFish}</span>
              </div>
              <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${totalFish > 0 ? (uniqueFish / totalFish) * 100 : 0}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                }} />
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => { onCatch(fish); setSessionCaught(prev => [...new Set([...prev, fish.id])]); setStreak(s => s + 1); handleRetry() }}
                className="px-4 py-2 rounded-lg text-white text-xs font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.15))',
                  border: '1px solid rgba(34,197,94,0.3)',
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  Cast Again
                  <PixelIcon icon="🎣" size={18} variant="water" />
                </span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-white/60 text-xs font-medium transition-all hover:text-white hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        )}

        {phase === 'escaped' && fish && (
          <div className="flex flex-col items-center gap-4">
            <PixelIcon icon="💨" size={56} variant="water" className="opacity-70" />
            <div className="text-center">
              <p className="text-white/60 text-base font-medium">The {fish.name} escaped!</p>
              <p className="text-white/30 text-[10px] mt-1">Better luck next time.</p>
              {streak > 0 && (
                <p className="text-red-400/60 text-[9px] mt-1">Streak broken!</p>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { setStreak(0); handleRetry() }}
                className="px-4 py-2 rounded-lg text-white text-xs font-medium transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.3), rgba(56,189,248,0.15))',
                  border: '1px solid rgba(56,189,248,0.3)',
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  Try Again
                  <PixelIcon icon="🎣" size={18} variant="water" />
                </span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-white/60 text-xs font-medium transition-all hover:text-white hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        )}

        {/* Catch log */}
        {catchLog.length > 0 && (
          <div className="w-full max-h-16 overflow-y-auto rounded-lg p-2 mt-2" style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            {catchLog.map((msg, i) => (
              <p key={i} className="text-white/40 text-[9px]">{msg}</p>
            ))}
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors text-xs"
        >
          ✕ ESC
        </button>
      </div>
    </div>
  )
}
