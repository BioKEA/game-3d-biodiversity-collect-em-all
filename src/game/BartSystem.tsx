import { useState, useRef, useEffect, useCallback } from 'react'

// ============================================================
// BART Station definitions — 6 stations spanning the Bay Area
// Simplified system: one connected line with branches
// ============================================================

export interface BartStation {
  id: string
  name: string
  x: number  // grid x
  y: number  // grid y
}

// 6 stations spanning the Bay Area on the 200×500 California grid
export const BART_STATIONS: BartStation[] = [
  { id: 'richmond',      name: 'Richmond',      x: 63, y: 210 },
  { id: 'san_francisco',  name: 'San Francisco',  x: 53, y: 219 },
  { id: 'oakland',        name: 'Oakland',        x: 64, y: 218 },
  { id: 'antioch',        name: 'Antioch',        x: 76, y: 212 },
  { id: 'millbrae',       name: 'Millbrae',       x: 51, y: 226 },
  { id: 'milpitas',       name: 'Milpitas',       x: 62, y: 229 },
]

// Build lookup
const STATION_MAP = new Map<string, BartStation>()
for (const s of BART_STATIONS) {
  STATION_MAP.set(`${s.x},${s.y}`, s)
}

export function getBartStationAt(x: number, y: number): BartStation | undefined {
  return STATION_MAP.get(`${x},${y}`)
}

// Line colors
const LINE_COLORS = {
  red: '#ef4444',    // Richmond – Millbrae
  yellow: '#eab308', // Antioch – SF
  green: '#22c55e',  // Milpitas – Oakland
}

// Route connections — adjacency list
// The network is a simple hub-and-spoke through Oakland and SF
const CONNECTIONS: Record<string, string[]> = {
  richmond:      ['oakland'],
  oakland:       ['richmond', 'san_francisco', 'antioch', 'milpitas'],
  san_francisco: ['oakland', 'millbrae'],
  antioch:       ['oakland'],
  millbrae:      ['san_francisco'],
  milpitas:      ['oakland'],
}

// BFS shortest path
function findRoute(from: BartStation, to: BartStation): BartStation[] | null {
  if (from.id === to.id) return [from]
  const visited = new Set<string>([from.id])
  const queue: { id: string; path: string[] }[] = [{ id: from.id, path: [from.id] }]

  while (queue.length > 0) {
    const curr = queue.shift()!
    for (const next of (CONNECTIONS[curr.id] || [])) {
      if (visited.has(next)) continue
      const path = [...curr.path, next]
      if (next === to.id) {
        return path.map(id => BART_STATIONS.find(s => s.id === id)).filter((s): s is BartStation => s != null)
      }
      visited.add(next)
      queue.push({ id: next, path })
    }
  }
  return null
}

// ============================================================
// BART UI Component
// ============================================================

// Fare based on route length (number of hops)
export function getBartFare(hops: number): number {
  return 15 + (hops - 1) * 10 // 15 for adjacent, 25 for 2 hops, 35 for 3
}

interface Props {
  playerX: number
  playerY: number
  playerCoins: number
  onTravel: (destX: number, destY: number, destName: string, fare: number) => void
  onClose: () => void
}

export default function BartSystem({ playerX, playerY, playerCoins, onTravel, onClose }: Props) {
  const [selectedStation, setSelectedStation] = useState<BartStation | null>(null)
  const [traveling, setTraveling] = useState(false)
  const [travelProgress, setTravelProgress] = useState(0)
  const [travelRoute, setTravelRoute] = useState<BartStation[]>([])
  const [currentStopIdx, setCurrentStopIdx] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  // Find the station the player is at (or nearest)
  const currentStation = getBartStationAt(playerX, playerY)
  const nearestStation = currentStation || BART_STATIONS.reduce((best, s) => {
    const d = Math.abs(s.x - playerX) + Math.abs(s.y - playerY)
    const bd = Math.abs(best.x - playerX) + Math.abs(best.y - playerY)
    return d < bd ? s : best
  }, BART_STATIONS[0])

  // Compute route and fare for selected station
  const selectedRoute = selectedStation ? findRoute(nearestStation, selectedStation) : null
  const selectedFare = selectedRoute ? getBartFare(selectedRoute.length - 1) : 0
  const canAfford = playerCoins >= selectedFare

  const handleTravel = useCallback(() => {
    if (!selectedStation || !selectedRoute || !canAfford) return

    setTraveling(true)
    setTravelRoute(selectedRoute)
    setCurrentStopIdx(0)
    setTravelProgress(0)
  }, [selectedStation, selectedRoute, canAfford])

  // Animate travel
  useEffect(() => {
    if (!traveling || travelRoute.length === 0) return

    const totalStops = travelRoute.length - 1
    if (totalStops <= 0) {
      setTraveling(false)
      return
    }

    const msPerStop = 600
    let elapsed = 0
    let lastTime = performance.now()

    const tick = (now: number) => {
      const dt = now - lastTime
      lastTime = now
      elapsed += dt

      const progress = Math.min(elapsed / (totalStops * msPerStop), 1)
      setTravelProgress(progress)

      const stopFloat = progress * totalStops
      setCurrentStopIdx(Math.min(Math.floor(stopFloat), totalStops - 1))

      if (progress >= 1) {
        const dest = travelRoute[travelRoute.length - 1]
        setTimeout(() => {
          onTravel(dest.x, dest.y, dest.name, getBartFare(travelRoute.length - 1))
        }, 300)
        return
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [traveling, travelRoute, onTravel])

  // Draw the schematic map on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Dark background
    ctx.fillStyle = '#0a1628'
    ctx.fillRect(0, 0, W, H)

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'
    ctx.lineWidth = 0.5
    for (let gx = 0; gx < W; gx += 35) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke()
    }
    for (let gy = 0; gy < H; gy += 35) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke()
    }

    // Schematic station positions on canvas
    const pos = new Map<string, { cx: number; cy: number }>()
    const pad = 50
    const uW = W - pad * 2
    const uH = H - pad * 2

    // Layout: geographically inspired schematic
    //   Richmond (top-left)     Antioch (top-right)
    //       \                      /
    //     SF ---- Oakland --------
    //     |          |
    //   Millbrae   Milpitas
    pos.set('richmond',      { cx: pad + uW * 0.18, cy: pad + uH * 0.1 })
    pos.set('san_francisco',  { cx: pad + uW * 0.15, cy: pad + uH * 0.45 })
    pos.set('oakland',        { cx: pad + uW * 0.50, cy: pad + uH * 0.40 })
    pos.set('antioch',        { cx: pad + uW * 0.90, cy: pad + uH * 0.15 })
    pos.set('millbrae',       { cx: pad + uW * 0.10, cy: pad + uH * 0.85 })
    pos.set('milpitas',       { cx: pad + uW * 0.55, cy: pad + uH * 0.88 })

    // Draw line helper
    function drawSegment(c: CanvasRenderingContext2D, from: string, to: string, color: string) {
      const a = pos.get(from)
      const b = pos.get(to)
      if (!a || !b) return
      c.strokeStyle = color
      c.lineWidth = 6
      c.lineCap = 'round'
      c.beginPath()
      c.moveTo(a.cx, a.cy)
      c.lineTo(b.cx, b.cy)
      c.stroke()
    }

    // Draw the lines (colored by route)
    // Red line: Richmond – Oakland – SF – Millbrae
    drawSegment(ctx, 'richmond', 'oakland', LINE_COLORS.red)
    drawSegment(ctx, 'oakland', 'san_francisco', LINE_COLORS.red)
    drawSegment(ctx, 'san_francisco', 'millbrae', LINE_COLORS.red)

    // Yellow line: Antioch – Oakland (overlaps red through Oakland–SF)
    drawSegment(ctx, 'antioch', 'oakland', LINE_COLORS.yellow)

    // Green line: Oakland – Milpitas
    drawSegment(ctx, 'oakland', 'milpitas', LINE_COLORS.green)

    // Draw stations
    for (const station of BART_STATIONS) {
      const p = pos.get(station.id)
      if (!p) continue

      const isSelected = selectedStation?.id === station.id
      const isCurrent = nearestStation?.id === station.id
      const isOnRoute = traveling && travelRoute.some(s => s?.id === station.id)

      // Station dot
      const r = isSelected ? 10 : isCurrent ? 9 : 7
      ctx.beginPath()
      ctx.arc(p.cx, p.cy, r, 0, Math.PI * 2)

      if (isCurrent) {
        ctx.fillStyle = '#4ade80'
        ctx.fill()
        ctx.strokeStyle = '#4ade80'
        ctx.lineWidth = 2
        ctx.stroke()
        // Glow
        ctx.beginPath()
        ctx.arc(p.cx, p.cy, 18, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(74,222,128,0.15)'
        ctx.fill()
      } else if (isSelected) {
        ctx.fillStyle = '#38bdf8'
        ctx.fill()
        ctx.strokeStyle = '#38bdf8'
        ctx.lineWidth = 2
        ctx.stroke()
      } else if (isOnRoute) {
        ctx.fillStyle = '#fbbf24'
        ctx.fill()
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.8)'
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // Station label
      ctx.font = isCurrent || isSelected ? 'bold 14px system-ui' : '13px system-ui'
      ctx.fillStyle = isCurrent ? '#4ade80' : isSelected ? '#38bdf8' : 'rgba(255,255,255,0.7)'

      // Position labels to avoid overlap
      const labelOffsetX = station.id === 'antioch' ? 16 : station.id === 'milpitas' ? 16 : -16
      ctx.textAlign = labelOffsetX > 0 ? 'left' : 'right'
      ctx.fillText(station.name, p.cx + labelOffsetX, p.cy + 5)
    }

    // Draw train position during travel
    if (traveling && travelRoute.length > 1) {
      const totalStops = travelRoute.length - 1
      const stopFloat = travelProgress * totalStops
      const fromIdx = Math.min(Math.floor(stopFloat), totalStops - 1)
      const toIdx = fromIdx + 1
      const t = stopFloat - fromIdx

      const fromStation = travelRoute[fromIdx]
      const toStation = travelRoute[Math.min(toIdx, travelRoute.length - 1)]
      const fromPos = fromStation ? pos.get(fromStation.id) : undefined
      const toPos = toStation ? pos.get(toStation.id) : undefined

      if (fromPos && toPos) {
        const tx = fromPos.cx + (toPos.cx - fromPos.cx) * t
        const ty = fromPos.cy + (toPos.cy - fromPos.cy) * t

        // Train glow
        const grad = ctx.createRadialGradient(tx, ty, 0, tx, ty, 24)
        grad.addColorStop(0, 'rgba(251,191,36,0.5)')
        grad.addColorStop(1, 'rgba(251,191,36,0)')
        ctx.fillStyle = grad
        ctx.fillRect(tx - 24, ty - 24, 48, 48)

        // Train icon
        ctx.font = '20px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('🚇', tx, ty + 6)
      }
    }

  }, [selectedStation, nearestStation, traveling, travelProgress, travelRoute, currentStopIdx])

  if (traveling) {
    const nextStop = travelRoute[Math.min(currentStopIdx + 1, travelRoute.length - 1)]
    const isArriving = travelProgress > 0.9
    const dest = travelRoute[travelRoute.length - 1]

    return (
      <div className="absolute inset-0 z-50 flex flex-col" style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #0f172a 100%)',
      }}>
        {/* Top announcement bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="rounded-xl px-4 py-3" style={{
            background: isArriving
              ? 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(34,197,94,0.08))'
              : 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(251,191,36,0.05))',
            border: isArriving
              ? '1px solid rgba(74,222,128,0.2)'
              : '1px solid rgba(234,179,8,0.15)',
          }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">
                  {isArriving ? 'Now arriving at' : 'Next stop'}
                </p>
                <p className={`text-sm font-bold ${isArriving ? 'text-green-300' : 'text-yellow-300'}`}>
                  {isArriving ? dest?.name : nextStop?.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">Route</p>
                <p className="text-xs text-white/50">
                  {nearestStation.name} → {dest?.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Canvas map — larger during travel */}
        <div className="flex-1 flex items-center justify-center px-4">
          <canvas
            ref={canvasRef}
            width={700}
            height={400}
            className="rounded-xl border border-white/10"
            style={{ width: '95%', maxWidth: 700, aspectRatio: '7/4' }}
          />
        </div>

        {/* Bottom: stop list + progress */}
        <div className="px-4 pb-4">
          {/* Station progress dots */}
          <div className="flex items-center justify-center gap-1 mb-3">
            {travelRoute.map((stop, i) => {
              const isPassed = i <= currentStopIdx
              const isCurrStop = i === currentStopIdx
              return (
                <div key={stop.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`rounded-full transition-all ${isCurrStop ? 'animate-pulse' : ''}`}
                      style={{
                        width: isCurrStop ? 10 : 6,
                        height: isCurrStop ? 10 : 6,
                        background: isPassed ? '#eab308' : 'rgba(255,255,255,0.15)',
                        boxShadow: isCurrStop ? '0 0 8px rgba(234,179,8,0.5)' : 'none',
                      }}
                    />
                    <p className="text-[7px] text-white/30 mt-1 max-w-[60px] text-center truncate">
                      {stop.name}
                    </p>
                  </div>
                  {i < travelRoute.length - 1 && (
                    <div className="mx-1 mt-[-12px]" style={{
                      width: 20,
                      height: 2,
                      background: isPassed ? '#eab308' : 'rgba(255,255,255,0.08)',
                      borderRadius: 1,
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${travelProgress * 100}%`,
                background: isArriving
                  ? 'linear-gradient(90deg, #eab308, #22c55e)'
                  : 'linear-gradient(90deg, #eab308, #f59e0b)',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{
      background: 'linear-gradient(180deg, #0a1628 0%, #0f172a 100%)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚇</span>
          <div>
            <h2 className="text-white font-bold text-sm">BART</h2>
            <p className="text-white/30 text-[9px]">Bay Area Rapid Transit</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white/80 text-xs px-2 py-1 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          Close
        </button>
      </div>

      {/* Current station */}
      <div className="mx-4 mb-2 rounded-lg px-3 py-2" style={{
        background: 'rgba(74,222,128,0.08)',
        border: '1px solid rgba(74,222,128,0.15)',
      }}>
        <p className="text-[9px] text-white/30 uppercase tracking-wider mb-0.5">You are at</p>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <p className="text-green-300 text-xs font-semibold">{nearestStation.name}</p>
        </div>
      </div>

      {/* Map canvas */}
      <div className="mx-4 mb-3 flex justify-center">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="rounded-xl border border-white/10"
          style={{ width: '100%', maxWidth: 700, aspectRatio: '7/4' }}
        />
      </div>

      {/* Station list — simple single row since only 6 stations */}
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {/* Line legend */}
        <div className="flex items-center gap-4 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ background: LINE_COLORS.red }} />
            <span className="text-[9px] text-white/40">Richmond–Millbrae</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ background: LINE_COLORS.yellow }} />
            <span className="text-[9px] text-white/40">Antioch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-1.5 rounded-full" style={{ background: LINE_COLORS.green }} />
            <span className="text-[9px] text-white/40">Milpitas</span>
          </div>
        </div>

        {/* Station buttons */}
        <div className="grid grid-cols-2 gap-1">
          {BART_STATIONS.filter(s => s.id !== nearestStation.id).map(station => {
            const isSelected = selectedStation?.id === station.id
            return (
              <button
                key={station.id}
                onClick={() => setSelectedStation(station)}
                className="text-left px-3 py-2 rounded-lg transition-all text-xs"
                style={{
                  background: isSelected ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '1px solid rgba(56,189,248,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  color: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                }}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-2" style={{
                  background: isSelected ? '#38bdf8' : 'rgba(255,255,255,0.3)',
                }} />
                {station.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Travel button */}
      <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {selectedStation ? (
          <div className="space-y-2">
            {/* Fare info */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 uppercase tracking-wider">Fare</span>
                <span className="text-xs font-bold text-yellow-400">💰 {selectedFare}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-white/30 uppercase tracking-wider">Balance</span>
                <span className={`text-xs font-mono ${canAfford ? 'text-white/50' : 'text-red-400'}`}>
                  💰 {playerCoins}
                </span>
              </div>
            </div>
            <button
              onClick={handleTravel}
              disabled={!canAfford}
              className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: canAfford
                  ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                  : 'rgba(255,255,255,0.05)',
                color: '#fff',
                boxShadow: canAfford ? '0 4px 12px rgba(2,132,199,0.3)' : 'none',
              }}
            >
              {canAfford
                ? `🚇 Ride to ${selectedStation.name}`
                : `Not enough coins (need 💰 ${selectedFare})`
              }
            </button>
          </div>
        ) : (
          <div className="text-center py-2.5">
            <p className="text-white/25 text-[10px]">Select a destination station</p>
          </div>
        )}
      </div>
    </div>
  )
}
