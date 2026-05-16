import { useRef, useEffect, useState, useCallback, memo, useMemo } from 'react'
import type { MapTile, JournalEntry, TimeOfDay, WeatherType } from '@/types/game'
import type { WorldEvent } from './WorldEvents'
import { BIOME_COLORS, MAP_WIDTH, MAP_HEIGHT } from './bayAreaMap'

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
  journal: Record<string, JournalEntry>
  exploredTiles: Set<string>
  rangers?: { x: number; y: number }[]
  onFastTravel?: (x: number, y: number, subregion: string) => void
  timeOfDay?: TimeOfDay
  weather?: WeatherType
  activeEvent?: WorldEvent | null
}

// Rectangular minimap — map is 200x500 (2:5 ratio)
const SM_W = 96
const SM_H = 240
const LG_W = 176
const LG_H = 440

const WEATHER_INFO: Record<WeatherType, { icon: string; color: string }> = {
  clear: { icon: '☀', color: '#fbbf24' },
  sunny: { icon: '☀', color: '#f59e0b' },
  rain:  { icon: '☔', color: '#60a5fa' },
  fog:   { icon: '🌫', color: '#cbd5e1' },
  wind:  { icon: '💨', color: '#94a3b8' },
  thunderstorm: { icon: '⛈', color: '#a78bfa' },
}

const TIME_THEME: Record<TimeOfDay, { bg: string; fogColor: string; exploredBoost: number; playerColor: string }> = {
  dawn:  { bg: '#1a1228', fogColor: '#120920', exploredBoost: 0.85, playerColor: '#fbbf24' },
  day:   { bg: '#060e1e', fogColor: '#030510', exploredBoost: 1.0,  playerColor: '#4ade80' },
  dusk:  { bg: '#1a0a20', fogColor: '#0f0618', exploredBoost: 0.8,  playerColor: '#f97316' },
  night: { bg: '#030618', fogColor: '#01030c', exploredBoost: 0.65, playerColor: '#93c5fd' },
}

const Minimap = memo(function Minimap({ map, playerX, playerY, journal, exploredTiles, rangers, onFastTravel, timeOfDay = 'day', weather = 'clear', activeEvent }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const frameRef = useRef(0)
  const tickRef = useRef(0)
  const labelPositionsRef = useRef<{ x: number; y: number; tileX: number; tileY: number; name: string }[]>([])
  const prevPlayerPos = useRef({ x: playerX, y: playerY })
  const eventCenterCache = useRef<{ subregion: string; cx: number; cy: number } | null>(null)

  const isMobile = useMemo(() => window.innerWidth < 640, [])

  // Offscreen tile bitmap — redrawn only when exploredTiles changes
  const tileCanvasRef = useRef<OffscreenCanvas | HTMLCanvasElement | null>(null)
  const lastExploredSizeRef = useRef(-1)
  const lastTimeOfDayRef = useRef(timeOfDay)

  const playerHeading = useRef(0)
  if (playerX !== prevPlayerPos.current.x || playerY !== prevPlayerPos.current.y) {
    const dx = playerX - prevPlayerPos.current.x
    const dy = playerY - prevPlayerPos.current.y
    if (dx !== 0 || dy !== 0) playerHeading.current = Math.atan2(dy, dx)
    prevPlayerPos.current = { x: playerX, y: playerY }
  }

  const smW = isMobile ? 64 : SM_W
  const smH = isMobile ? 160 : SM_H
  const mobileFullW = Math.min(window.innerWidth - 16, 360)
  const mobileFullH = Math.min(window.innerHeight - 80, Math.round(mobileFullW * 2.2))
  const lgW = isMobile ? mobileFullW : LG_W
  const lgH = isMobile ? mobileFullH : LG_H
  const w = expanded ? lgW : smW
  const h = expanded ? lgH : smH
  const totalExplorableTiles = useMemo(() => {
    let total = 0
    for (const row of map) {
      for (const tile of row) {
        if (tile.isWalkable && !tile.borderState) total++
      }
    }
    return Math.max(1, total)
  }, [map])

  // Build offscreen tile layer when explored set or time changes
  const buildTileLayer = useCallback(() => {
    const pw = w / MAP_WIDTH
    const ph = h / MAP_HEIGHT
    const theme = TIME_THEME[timeOfDay]

    let offscreen: OffscreenCanvas | HTMLCanvasElement
    try {
      offscreen = new OffscreenCanvas(w, h)
    } catch {
      offscreen = document.createElement('canvas')
      offscreen.width = w
      offscreen.height = h
    }
    const ctx = offscreen.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
    if (!ctx) return offscreen

    // Background
    ctx.fillStyle = theme.bg
    ctx.fillRect(0, 0, w, h)

    // Draw tiles
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y]?.[x]
        if (!tile) continue
        const isExplored = exploredTiles?.has(`${x},${y}`) ?? false
        const colors = BIOME_COLORS[tile.biome]

        if (isExplored) {
          ctx.fillStyle = tile.borderState ? '#6b7280' : colors.top
          ctx.globalAlpha = (tile.borderState ? 0.4 : tile.biome === 'water' ? 0.52 : 0.82) * theme.exploredBoost
        } else {
          ctx.fillStyle = tile.borderState ? '#4b5563' : colors.dark
          ctx.globalAlpha = 0.08
        }
        ctx.fillRect(x * pw, y * ph, Math.ceil(pw), Math.ceil(ph))
      }
    }
    ctx.globalAlpha = 1

    // Coastline and major water edges, so the California silhouette reads even before full exploration.
    ctx.save()
    ctx.strokeStyle = 'rgba(154, 183, 189, 0.38)'
    ctx.lineWidth = expanded ? 0.8 : 0.55
    ctx.beginPath()
    for (let y = 1; y < MAP_HEIGHT - 1; y++) {
      for (let x = 1; x < MAP_WIDTH - 1; x++) {
        const tile = map[y][x]
        if (tile.borderState || tile.biome === 'water' || tile.biome === 'kelp_forest') continue
        const touchesWater = map[y]?.[x - 1]?.biome === 'water' || map[y]?.[x + 1]?.biome === 'water' ||
          map[y - 1]?.[x]?.biome === 'water' || map[y + 1]?.[x]?.biome === 'water'
        if (!touchesWater) continue
        ctx.rect(x * pw, y * ph, Math.max(0.7, pw), Math.max(0.7, ph))
      }
    }
    ctx.stroke()
    ctx.restore()

    // State border line on minimap
    ctx.save()
    ctx.strokeStyle = 'rgba(245,158,11,0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const t = map[y][x]
        if (t.borderState) continue
        if (map[y]?.[x + 1]?.borderState) {
          ctx.moveTo((x + 1) * pw, y * ph)
          ctx.lineTo((x + 1) * pw, (y + 1) * ph)
        }
        if (map[y + 1]?.[x]?.borderState) {
          ctx.moveTo(x * pw, (y + 1) * ph)
          ctx.lineTo((x + 1) * pw, (y + 1) * ph)
        }
      }
    }
    ctx.stroke()
    ctx.restore()

    // Frontier glow — sample every 2nd tile for performance
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const key = `${x},${y}`
        if (!exploredTiles?.has(key)) continue
        const n = exploredTiles.has(`${x},${y-1}`)
        const s = exploredTiles.has(`${x},${y+1}`)
        const ww = exploredTiles.has(`${x-1},${y}`)
        const e = exploredTiles.has(`${x+1},${y}`)
        if (n && s && ww && e) continue
        ctx.fillStyle = 'rgba(74,222,128,0.08)'
        ctx.fillRect(x * pw, y * ph, Math.ceil(pw), Math.ceil(ph))
      }
    }
    ctx.restore()

    // Always-visible bridges
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const tile = map[y]?.[x]
        if (!tile) continue
        const isExplored = exploredTiles?.has(`${x},${y}`) ?? false
        if (tile.bridge) {
          ctx.fillStyle = isExplored ? 'rgba(251,191,36,0.85)' : 'rgba(251,191,36,0.28)'
          ctx.fillRect(x * pw, y * ph, Math.max(1, pw - 0.5), Math.max(1, ph - 0.5))
        } else if (tile.boatDock && isExplored) {
          ctx.fillStyle = 'rgba(251,191,36,0.7)'
          ctx.beginPath()
          ctx.arc(x * pw + pw / 2, y * ph + ph / 2, Math.max(1, pw * 0.4), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    tileCanvasRef.current = offscreen
    lastExploredSizeRef.current = exploredTiles?.size ?? 0
    lastTimeOfDayRef.current = timeOfDay
    return offscreen
  }, [map, exploredTiles, w, h, timeOfDay])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const pw = w / MAP_WIDTH
    const ph = h / MAP_HEIGHT
    tickRef.current++
    const tick = tickRef.current
    const theme = TIME_THEME[timeOfDay]

    // Rebuild tile layer if dirty
    const currentSize = exploredTiles?.size ?? 0
    if (!tileCanvasRef.current || currentSize !== lastExploredSizeRef.current || timeOfDay !== lastTimeOfDayRef.current) {
      buildTileLayer()
    }

    // Blit tile layer
    if (tileCanvasRef.current) {
      ctx.drawImage(tileCanvasRef.current as HTMLCanvasElement, 0, 0, w, h)
    }

    // Player vision cone
    const visionR = 12
    const vcx = playerX * pw + pw / 2
    const vcy = playerY * ph + ph / 2
    const visionRadius = visionR * Math.max(pw, ph)
    const visionGrad = ctx.createRadialGradient(vcx, vcy, 0, vcx, vcy, visionRadius)
    const visionTint = timeOfDay === 'night' ? '147,197,253' : '74,222,128'
    visionGrad.addColorStop(0, `rgba(${visionTint},0.22)`)
    visionGrad.addColorStop(0.55, `rgba(${visionTint},0.09)`)
    visionGrad.addColorStop(1, `rgba(${visionTint},0)`)
    ctx.fillStyle = visionGrad
    ctx.beginPath()
    ctx.arc(vcx, vcy, visionRadius, 0, Math.PI * 2)
    ctx.fill()

    // Creature markers (expanded only, skip every 2nd for performance)
    if (expanded) {
      for (let y = 0; y < MAP_HEIGHT; y += 2) {
        for (let x = 0; x < MAP_WIDTH; x += 2) {
          const tile = map[y]?.[x]
          if (!tile || !tile.hasCreature) continue
          if (!exploredTiles?.has(`${x},${y}`)) continue
          const cx = x * pw + pw / 2
          const cy = y * ph + ph / 2
          const pulse = 0.4 + Math.sin(tick * 0.04 + x * 0.3 + y * 0.5) * 0.3
          ctx.beginPath()
          ctx.arc(cx, cy, 2, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(251, 191, 36, ${pulse})`
          ctx.fill()
        }
      }
    }

    // Ranger markers (expanded only)
    if (expanded && rangers) {
      for (const ranger of rangers) {
        const rx = ranger.x * pw + pw / 2
        const ry = ranger.y * ph + ph / 2
        ctx.beginPath()
        ctx.arc(rx, ry, 4, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(96, 165, 250, 0.25)'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(rx, ry, 2, 0, Math.PI * 2)
        ctx.fillStyle = '#60a5fa'
        ctx.fill()
      }
    }

    // Subregion labels (expanded only) — use cached centers from journal keys
    if (expanded) {
      const visitedSubregions = Object.keys(journal)
      // Only recompute if journal changed
      if (labelPositionsRef.current.length !== visitedSubregions.length) {
        const newLabels: typeof labelPositionsRef.current = []
        for (const subregion of visitedSubregions) {
          let sumX = 0, sumY = 0, count = 0
          // Sample every 4th tile for performance on 100k grid
          for (let sy = 0; sy < MAP_HEIGHT; sy += 4) {
            for (let sx = 0; sx < MAP_WIDTH; sx += 4) {
              if (map[sy]?.[sx]?.subregion === subregion) {
                sumX += sx; sumY += sy; count++
              }
            }
          }
          if (count > 0) {
            newLabels.push({
              x: (sumX / count) * pw,
              y: (sumY / count) * ph,
              tileX: Math.round(sumX / count),
              tileY: Math.round(sumY / count),
              name: subregion,
            })
          }
        }
        labelPositionsRef.current = newLabels
      }

      ctx.font = '6px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      for (const label of labelPositionsRef.current) {
        const isHovered = hoveredRegion === label.name
        const metrics = ctx.measureText(label.name)
        const bw = metrics.width + 4
        ctx.fillStyle = isHovered ? 'rgba(74, 222, 128, 0.35)' : 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(label.x - bw / 2, label.y - 4.5, bw, 9)
        if (isHovered) {
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.6)'
          ctx.lineWidth = 0.5
          ctx.strokeRect(label.x - bw / 2, label.y - 4.5, bw, 9)
        }
        ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.5)'
        ctx.fillText(label.name, label.x, label.y)
      }

      if (onFastTravel && labelPositionsRef.current.length > 0) {
        ctx.font = '5px system-ui'
        ctx.textAlign = 'center'
        ctx.fillStyle = 'rgba(74, 222, 128, 0.3)'
        ctx.fillText('Click label to fast-travel', w / 2, h - 4)
      }
    }

    // View radius box
    const viewR = 12
    ctx.strokeStyle = `${theme.playerColor}33`
    ctx.lineWidth = 0.5
    ctx.strokeRect(
      (playerX - viewR) * pw,
      (playerY - viewR) * ph,
      viewR * 2 * pw,
      viewR * 2 * ph,
    )

    // Player dot with pulse + direction arrow
    const px = playerX * pw + pw / 2
    const py = playerY * ph + ph / 2
    const pulseR = 3 + Math.sin(tick * 0.08) * 1.5
    const playerColor = theme.playerColor

    ctx.beginPath()
    ctx.arc(px, py, pulseR + 2, 0, Math.PI * 2)
    ctx.fillStyle = `${playerColor}${Math.round((0.1 + Math.sin(tick * 0.08) * 0.05) * 255).toString(16).padStart(2, '0')}`
    ctx.fill()

    const heading = playerHeading.current
    const arrowLen = expanded ? 7 : 5
    const arrowX = px + Math.cos(heading) * arrowLen
    const arrowY = py + Math.sin(heading) * arrowLen
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(arrowX, arrowY)
    ctx.strokeStyle = `${playerColor}99`
    ctx.lineWidth = 1.5
    ctx.stroke()
    const tipAngle = 0.5
    ctx.beginPath()
    ctx.moveTo(arrowX, arrowY)
    ctx.lineTo(arrowX - Math.cos(heading - tipAngle) * 3, arrowY - Math.sin(heading - tipAngle) * 3)
    ctx.lineTo(arrowX - Math.cos(heading + tipAngle) * 3, arrowY - Math.sin(heading + tipAngle) * 3)
    ctx.closePath()
    ctx.fillStyle = playerColor
    ctx.fill()

    ctx.beginPath()
    ctx.arc(px, py, expanded ? 3 : 2, 0, Math.PI * 2)
    ctx.fillStyle = playerColor
    ctx.fill()
    ctx.beginPath()
    ctx.arc(px, py, 1, 0, Math.PI * 2)
    ctx.fillStyle = '#ffffff'
    ctx.fill()

    // Active world event indicator
    if (activeEvent) {
      const cached = eventCenterCache.current
      let ecx: number, ecy: number
      if (cached && cached.subregion === activeEvent.subregion) {
        ecx = cached.cx; ecy = cached.cy
      } else {
        let sumX = 0, sumY = 0, count = 0
        for (let ey = 0; ey < MAP_HEIGHT; ey += 4) {
          for (let ex = 0; ex < MAP_WIDTH; ex += 4) {
            if (map[ey]?.[ex]?.subregion === activeEvent.subregion) {
              sumX += ex; sumY += ey; count++
            }
          }
        }
        ecx = count > 0 ? sumX / count : MAP_WIDTH / 2
        ecy = count > 0 ? sumY / count : MAP_HEIGHT / 2
        eventCenterCache.current = { subregion: activeEvent.subregion, cx: ecx, cy: ecy }
      }

      const eventColor = activeEvent.type === 'rare_spawn' ? '#fbbf24'
        : activeEvent.type === 'swarm' ? '#34d399' : '#c084fc'
      const isExploredRegion = !!journal[activeEvent.subregion]

      if (isExploredRegion) {
        const evx = ecx * pw + pw / 2
        const evy = ecy * ph + ph / 2
        const pulse = Math.sin(tick * 0.06) * 0.5 + 0.5
        const ringR = 4 + pulse * 4
        ctx.beginPath()
        ctx.arc(evx, evy, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = eventColor
        ctx.globalAlpha = 0.6 - pulse * 0.5
        ctx.lineWidth = 1.5
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(evx, evy, expanded ? 3 : 2, 0, Math.PI * 2)
        ctx.fillStyle = eventColor
        ctx.globalAlpha = 0.7 + pulse * 0.3
        ctx.fill()
        if (expanded) {
          ctx.font = '8px system-ui'
          ctx.textAlign = 'center'
          ctx.globalAlpha = 0.8
          ctx.fillText(activeEvent.icon, evx, evy - 8)
        }
        ctx.globalAlpha = 1
      } else {
        const angle = Math.atan2(ecy - playerY, ecx - playerX)
        const margin = expanded ? 14 : 10
        const halfW = w / 2
        const halfH = h / 2
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const edgeDist = Math.min(
          Math.abs((halfW - margin) / (Math.abs(cos) || 0.001)),
          Math.abs((halfH - margin) / (Math.abs(sin) || 0.001)),
        )
        const chevX = halfW + cos * edgeDist
        const chevY = halfH + sin * edgeDist
        const pulse = Math.sin(tick * 0.06) * 0.5 + 0.5
        const glowR = expanded ? 10 : 7
        const glow = ctx.createRadialGradient(chevX, chevY, 0, chevX, chevY, glowR)
        glow.addColorStop(0, eventColor + Math.round((0.25 + pulse * 0.15) * 255).toString(16).padStart(2, '0'))
        glow.addColorStop(1, eventColor + '00')
        ctx.fillStyle = glow
        ctx.beginPath()
        ctx.arc(chevX, chevY, glowR, 0, Math.PI * 2)
        ctx.fill()
        const chevSize = expanded ? 5 : 3.5
        const spread = 0.5
        ctx.beginPath()
        ctx.moveTo(chevX + Math.cos(angle) * chevSize * 0.3, chevY + Math.sin(angle) * chevSize * 0.3)
        ctx.lineTo(chevX - Math.cos(angle - spread) * chevSize, chevY - Math.sin(angle - spread) * chevSize)
        ctx.lineTo(chevX - Math.cos(angle + spread) * chevSize, chevY - Math.sin(angle + spread) * chevSize)
        ctx.closePath()
        ctx.fillStyle = eventColor
        ctx.globalAlpha = 0.7 + pulse * 0.3
        ctx.fill()
        if (expanded) {
          ctx.font = '8px system-ui'
          ctx.textAlign = 'center'
          ctx.globalAlpha = 0.7
          ctx.fillText(activeEvent.icon, chevX - Math.cos(angle) * 10, chevY - Math.sin(angle) * 10)
        }
        ctx.globalAlpha = 1
      }
    }

    // Weather badge
    const wInfo = WEATHER_INFO[weather]
    if (wInfo) {
      const bx = w - (expanded ? 24 : 18)
      const by = expanded ? 6 : 4
      const bs = expanded ? 14 : 11
      ctx.fillStyle = 'rgba(0,0,0,0.5)'
      ctx.beginPath()
      if (typeof ctx.roundRect === 'function') ctx.roundRect(bx, by, bs + 4, bs + 2, 3)
      else ctx.rect(bx, by, bs + 4, bs + 2)
      ctx.fill()
      ctx.strokeStyle = `${wInfo.color}66`
      ctx.lineWidth = 0.5
      ctx.stroke()
      ctx.font = `${bs - 2}px system-ui`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = wInfo.color
      ctx.fillText(wInfo.icon, bx + (bs + 4) / 2, by + (bs + 2) / 2 + 0.5)
    }

    // Compass rose
    const compassX = expanded ? 20 : 14
    const compassY = h - (expanded ? 20 : 14)
    const compassR = expanded ? 10 : 7
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 0.5
    ctx.beginPath(); ctx.moveTo(compassX, compassY - compassR); ctx.lineTo(compassX, compassY + compassR); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(compassX - compassR, compassY); ctx.lineTo(compassX + compassR, compassY); ctx.stroke()
    ctx.strokeStyle = 'rgba(239,68,68,0.5)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(compassX, compassY); ctx.lineTo(compassX, compassY - compassR); ctx.stroke()
    ctx.font = `${expanded ? 6 : 5}px system-ui`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'rgba(239,68,68,0.5)'
    ctx.fillText('N', compassX, compassY - compassR - 4)
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillText('S', compassX, compassY + compassR + 4)

    // Explored percentage
    const exploredCount = exploredTiles?.size ?? 0
    const pct = Math.min(100, Math.round((exploredCount / totalExplorableTiles) * 100))
    ctx.font = expanded ? '8px system-ui' : '7px system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillText(`${pct}%`, 3, 3)

    frameRef.current = requestAnimationFrame(draw)
  }, [map, playerX, playerY, journal, exploredTiles, rangers, w, h, expanded, hoveredRegion, onFastTravel, timeOfDay, weather, activeEvent, buildTileLayer, totalExplorableTiles])

  useEffect(() => {
    // Invalidate tile cache on size change
    lastExploredSizeRef.current = -1
    tileCanvasRef.current = null
  }, [w, h])

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!expanded) {
      setExpanded(true)
      return
    }
    if (onFastTravel) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top
      for (const label of labelPositionsRef.current) {
        const labelW = label.name.length * 3.5 + 4
        const labelH = 9
        if (
          clickX >= label.x - labelW / 2 &&
          clickX <= label.x + labelW / 2 &&
          clickY >= label.y - labelH / 2 &&
          clickY <= label.y + labelH / 2
        ) {
          onFastTravel(label.tileX, label.tileY, label.name)
          return
        }
      }
    }
    setExpanded(false)
  }, [expanded, onFastTravel])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!expanded || !onFastTravel) {
      setHoveredRegion(null)
      return
    }
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    let found: string | null = null
    for (const label of labelPositionsRef.current) {
      const labelW = label.name.length * 3.5 + 4
      const labelH = 9
      if (
        mx >= label.x - labelW / 2 &&
        mx <= label.x + labelW / 2 &&
        my >= label.y - labelH / 2 &&
        my <= label.y + labelH / 2
      ) {
        found = label.name
        break
      }
    }
    setHoveredRegion(found)
  }, [expanded, onFastTravel])

  return (
    <div
      className={`${expanded && isMobile ? 'fixed inset-0 flex flex-col items-center justify-center' : 'absolute top-1.5 sm:top-28 right-1.5 sm:right-3'} ${expanded ? 'z-50' : 'z-20'} rounded-xl overflow-hidden border cursor-pointer transition-all duration-300`}
      style={{
        borderColor: expanded ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.1)',
        background: expanded && isMobile ? 'rgba(0,0,0,0.92)' : 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        boxShadow: expanded
          ? '0 0 20px rgba(74,222,128,0.1), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      }}
      onClick={handleCanvasClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredRegion(null)}
      title={expanded ? (onFastTravel ? 'Click a region to fast-travel' : 'Click to shrink') : 'Click to expand'}
    >
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: w, height: h, imageRendering: 'pixelated' }}
      />
      <div className={`flex items-center justify-between px-1.5 sm:px-3 py-0.5 sm:py-1 ${expanded && isMobile ? 'flex-wrap gap-1' : ''}`}>
        <p className="text-[9px] sm:text-sm text-white/35 font-bold tracking-wider">CA FIELD MAP</p>
        <div className={`flex items-center ${expanded && isMobile ? 'gap-2 flex-wrap' : 'gap-3'}`}>
          {expanded && (
            <>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#4ade80] inline-block" />
                <span className="text-[9px] sm:text-xs text-white/25">You</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#fbbf24] inline-block" />
                <span className="text-[9px] sm:text-xs text-white/25">Creatures</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#60a5fa] inline-block" />
                <span className="text-[9px] sm:text-xs text-white/25">Rangers</span>
              </span>
            </>
          )}
          {expanded && activeEvent && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#fbbf24] inline-block animate-pulse" />
              <span className="text-[9px] sm:text-xs text-white/25">Event</span>
            </span>
          )}
          {expanded && onFastTravel && (
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#4ade80]/50 inline-block animate-pulse" />
              <span className="text-[9px] sm:text-xs text-white/25">Fast-travel</span>
            </span>
          )}
          {!(expanded && isMobile) && (
            <span className="text-sm text-white/20">{expanded ? '−' : '+'}</span>
          )}
        </div>
      </div>
      {expanded && isMobile && (
        <button
          className="w-full py-2 text-white/50 text-xs font-medium tracking-wider uppercase hover:text-white/80 transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}
          onClick={(e) => { e.stopPropagation(); setExpanded(false) }}
        >
          Close Map
        </button>
      )}
    </div>
  )
})

export default Minimap
