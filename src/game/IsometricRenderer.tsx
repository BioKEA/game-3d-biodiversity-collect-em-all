import { useRef, useEffect, useCallback, memo } from 'react'
import type { MapTile, BiomeType, TimeOfDay, WeatherType } from '@/types/game'
import { BIOME_COLORS, getSignpostAt } from './bayAreaMap'
import { getBartStationAt } from './BartSystem'
import { MIGRATION_HERDS, getHerdPositions } from './migration'
import { LANDMARKS } from './landmarks'

type RangerActivityType = 'patrol' | 'rest' | 'campfire' | 'observe' | 'fishing' | 'research'

interface RangerPosition {
  x: number
  y: number
  sprite: string
  activity?: RangerActivityType
}

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
  viewRadius?: number
  onTileClick?: (x: number, y: number) => void
  rangers?: RangerPosition[]
  timeOfDay?: TimeOfDay
  weather?: WeatherType
  gameMinutes?: number
}

// Time-of-day ambient lighting configuration
interface TimeLighting {
  tint: string; alpha: number; bgColor: string; shadowAlpha: number; particleColor: string
  skyGradient: [string, string, string] // top, mid, bottom
  sunMoon?: { emoji: string; y: number; glow: string } // y = 0-1 position
}
const TIME_LIGHTING: Record<TimeOfDay, TimeLighting> = {
  dawn: {
    tint: 'rgba(255,180,120,0.12)', alpha: 0.12, bgColor: '#1a1428', shadowAlpha: 0.2, particleColor: '#fcd34d',
    skyGradient: ['#1a1035', '#c2505a', '#f5b041'],
    sunMoon: { emoji: '☀️', y: 0.75, glow: 'rgba(245,176,65,0.15)' },
  },
  day: {
    tint: 'rgba(255,255,240,0.05)', alpha: 0.05, bgColor: '#0e1a2e', shadowAlpha: 0.25, particleColor: '#ffffff',
    skyGradient: ['#1a3a5c', '#2d6a9f', '#87ceeb'],
    sunMoon: { emoji: '☀️', y: 0.25, glow: 'rgba(255,255,200,0.1)' },
  },
  dusk: {
    tint: 'rgba(200,100,60,0.18)', alpha: 0.18, bgColor: '#1a1020', shadowAlpha: 0.3, particleColor: '#f59e0b',
    skyGradient: ['#1a0a2e', '#8b3a62', '#e8723a'],
    sunMoon: { emoji: '☀️', y: 0.7, glow: 'rgba(232,114,58,0.15)' },
  },
  night: {
    tint: 'rgba(30,50,120,0.25)', alpha: 0.25, bgColor: '#060a14', shadowAlpha: 0.4, particleColor: '#93c5fd',
    skyGradient: ['#030810', '#0a1628', '#101e38'],
    sunMoon: { emoji: '🌙', y: 0.2, glow: 'rgba(147,197,253,0.08)' },
  },
}

// Continuous lighting keyframes keyed by game-minute (0-1440).
// Interpolated at render time for smooth sunrise/sunset transitions.
interface LightKeyframe {
  m: number // game-minute
  tintR: number; tintG: number; tintB: number; tintA: number
  shadowAlpha: number
  bloomIntensity: number
  vignetteStrength: number
  // Multiplier tint for the final color-grading pass
  gradeR: number; gradeG: number; gradeB: number; gradeA: number
}

const LIGHT_KEYFRAMES: LightKeyframe[] = [
  { m: 0,    tintR: 30,  tintG: 50,  tintB: 120, tintA: 0.25, shadowAlpha: 0.40, bloomIntensity: 0.35, vignetteStrength: 0.55, gradeR: 68, gradeG: 102, gradeB: 170, gradeA: 0.25 },
  { m: 300,  tintR: 80,  tintG: 60,  tintB: 100, tintA: 0.18, shadowAlpha: 0.30, bloomIntensity: 0.30, vignetteStrength: 0.45, gradeR: 120, gradeG: 80, gradeB: 100, gradeA: 0.15 },
  { m: 360,  tintR: 255, tintG: 180, tintB: 120, tintA: 0.14, shadowAlpha: 0.22, bloomIntensity: 0.28, vignetteStrength: 0.40, gradeR: 255, gradeG: 150, gradeB: 100, gradeA: 0.12 },
  { m: 420,  tintR: 255, tintG: 220, tintB: 180, tintA: 0.08, shadowAlpha: 0.22, bloomIntensity: 0.20, vignetteStrength: 0.32, gradeR: 255, gradeG: 240, gradeB: 220, gradeA: 0.05 },
  { m: 540,  tintR: 255, tintG: 255, tintB: 240, tintA: 0.05, shadowAlpha: 0.25, bloomIntensity: 0.15, vignetteStrength: 0.30, gradeR: 255, gradeG: 255, gradeB: 238, gradeA: 0.04 },
  { m: 720,  tintR: 255, tintG: 255, tintB: 240, tintA: 0.05, shadowAlpha: 0.25, bloomIntensity: 0.15, vignetteStrength: 0.30, gradeR: 255, gradeG: 255, gradeB: 238, gradeA: 0.04 },
  { m: 1020, tintR: 255, tintG: 200, tintB: 140, tintA: 0.10, shadowAlpha: 0.25, bloomIntensity: 0.20, vignetteStrength: 0.35, gradeR: 255, gradeG: 180, gradeB: 100, gradeA: 0.08 },
  { m: 1080, tintR: 200, tintG: 100, tintB: 60,  tintA: 0.18, shadowAlpha: 0.30, bloomIntensity: 0.25, vignetteStrength: 0.45, gradeR: 200, gradeG: 70, gradeB: 100, gradeA: 0.15 },
  { m: 1140, tintR: 80,  tintG: 60,  tintB: 120, tintA: 0.22, shadowAlpha: 0.35, bloomIntensity: 0.30, vignetteStrength: 0.50, gradeR: 80, gradeG: 80, gradeB: 140, gradeA: 0.20 },
  { m: 1260, tintR: 30,  tintG: 50,  tintB: 120, tintA: 0.25, shadowAlpha: 0.40, bloomIntensity: 0.35, vignetteStrength: 0.55, gradeR: 68, gradeG: 102, gradeB: 170, gradeA: 0.25 },
  { m: 1440, tintR: 30,  tintG: 50,  tintB: 120, tintA: 0.25, shadowAlpha: 0.40, bloomIntensity: 0.35, vignetteStrength: 0.55, gradeR: 68, gradeG: 102, gradeB: 170, gradeA: 0.25 },
]

function lerpLighting(minutes: number): LightKeyframe {
  const m = ((minutes % 1440) + 1440) % 1440
  let a = LIGHT_KEYFRAMES[0]
  let b = LIGHT_KEYFRAMES[LIGHT_KEYFRAMES.length - 1]
  for (let i = 0; i < LIGHT_KEYFRAMES.length - 1; i++) {
    if (m >= LIGHT_KEYFRAMES[i].m && m < LIGHT_KEYFRAMES[i + 1].m) {
      a = LIGHT_KEYFRAMES[i]
      b = LIGHT_KEYFRAMES[i + 1]
      break
    }
  }
  const span = b.m - a.m
  const t = span > 0 ? (m - a.m) / span : 0
  const lerp = (x: number, y: number) => x + (y - x) * t
  return {
    m,
    tintR: Math.round(lerp(a.tintR, b.tintR)),
    tintG: Math.round(lerp(a.tintG, b.tintG)),
    tintB: Math.round(lerp(a.tintB, b.tintB)),
    tintA: lerp(a.tintA, b.tintA),
    shadowAlpha: lerp(a.shadowAlpha, b.shadowAlpha),
    bloomIntensity: lerp(a.bloomIntensity, b.bloomIntensity),
    vignetteStrength: lerp(a.vignetteStrength, b.vignetteStrength),
    gradeR: Math.round(lerp(a.gradeR, b.gradeR)),
    gradeG: Math.round(lerp(a.gradeG, b.gradeG)),
    gradeB: Math.round(lerp(a.gradeB, b.gradeB)),
    gradeA: lerp(a.gradeA, b.gradeA),
  }
}

const TILE_WIDTH = 56
const TILE_HEIGHT = 28
const TILE_DEPTH = 14

// Seeded pseudo-random for deterministic decorations per tile
function seededRand(x: number, y: number, seed: number = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 73.13) * 43758.5453
  return n - Math.floor(n)
}

function toIso(x: number, y: number, elevation: number = 0): [number, number] {
  const isoX = (x - y) * (TILE_WIDTH / 2)
  const isoY = (x + y) * (TILE_HEIGHT / 2) - elevation * TILE_DEPTH
  return [isoX, isoY]
}

function drawBridge(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  bridgeName: string,
  elevation: number,
  _time: number,
  timeOfDay: TimeOfDay = 'day',
) {
  const hw = TILE_WIDTH / 2
  const hh = TILE_HEIGHT / 2
  const eOffset = elevation * TILE_DEPTH
  const sy = screenY - eOffset

  const isGoldenGate = bridgeName === 'Golden Gate Bridge'
  const isBayBridge = bridgeName === 'Bay Bridge'

  // Bridge deck color
  const deckColor = isGoldenGate ? '#c53030' // Iconic International Orange
    : isBayBridge ? '#94a3b8'  // Silver/steel
    : '#78716c' // Gray concrete for other bridges

  const deckDark = isGoldenGate ? '#991b1b'
    : isBayBridge ? '#64748b'
    : '#57534e'

  const cableColor = timeOfDay === 'night'
    ? (isGoldenGate ? '#fca5a5' : '#cbd5e1')
    : (isGoldenGate ? '#ef4444' : '#94a3b8')

  // Draw deck (isometric diamond)
  ctx.fillStyle = deckColor
  ctx.beginPath()
  ctx.moveTo(screenX, sy - hh)
  ctx.lineTo(screenX + hw, sy)
  ctx.lineTo(screenX, sy + hh)
  ctx.lineTo(screenX - hw, sy)
  ctx.closePath()
  ctx.fill()

  // Side face
  ctx.fillStyle = deckDark
  ctx.beginPath()
  ctx.moveTo(screenX - hw, sy)
  ctx.lineTo(screenX, sy + hh)
  ctx.lineTo(screenX, sy + hh + 3)
  ctx.lineTo(screenX - hw, sy + 3)
  ctx.closePath()
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(screenX + hw, sy)
  ctx.lineTo(screenX, sy + hh)
  ctx.lineTo(screenX, sy + hh + 3)
  ctx.lineTo(screenX + hw, sy + 3)
  ctx.closePath()
  ctx.fill()

  // Road markings (center line)
  ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(250,250,200,0.4)' : 'rgba(255,255,200,0.5)'
  ctx.lineWidth = 0.8
  ctx.setLineDash([2, 2])
  ctx.beginPath()
  ctx.moveTo(screenX - hw * 0.4, sy + hh * 0.4)
  ctx.lineTo(screenX + hw * 0.4, sy - hh * 0.4)
  ctx.stroke()
  ctx.setLineDash([])

  // Suspension cables / towers for Golden Gate and Bay Bridge
  if (isGoldenGate || isBayBridge) {
    const towerH = isGoldenGate ? 14 : 10
    const towerColor = isGoldenGate ? '#dc2626' : '#64748b'

    // Tower on left side
    ctx.fillStyle = towerColor
    ctx.fillRect(screenX - hw * 0.3 - 1, sy - towerH, 2, towerH)

    // Tower on right side
    ctx.fillRect(screenX + hw * 0.3 - 1, sy - towerH, 2, towerH)

    // Suspension cables
    ctx.strokeStyle = cableColor
    ctx.lineWidth = 0.5
    // Main cable (catenary curve)
    ctx.beginPath()
    ctx.moveTo(screenX - hw * 0.3, sy - towerH)
    ctx.quadraticCurveTo(screenX, sy - towerH * 0.4, screenX + hw * 0.3, sy - towerH)
    ctx.stroke()

    // Vertical cables from main cable to deck
    for (let i = -2; i <= 2; i++) {
      const cx = screenX + i * (hw * 0.12)
      const cableY = sy - towerH + (towerH * 0.6) * (1 - Math.cos(((i + 2) / 4) * Math.PI)) * 0.5
      ctx.beginPath()
      ctx.moveTo(cx, cableY)
      ctx.lineTo(cx, sy - 1)
      ctx.stroke()
    }
  }

  // Bridge railing / barrier lines
  ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(200,200,200,0.2)' : 'rgba(0,0,0,0.15)'
  ctx.lineWidth = 0.5
  // Left railing
  ctx.beginPath()
  ctx.moveTo(screenX - hw, sy)
  ctx.lineTo(screenX, sy - hh)
  ctx.stroke()
  // Right railing
  ctx.beginPath()
  ctx.moveTo(screenX, sy - hh)
  ctx.lineTo(screenX + hw, sy)
  ctx.stroke()

  // Night lights on bridges
  if (timeOfDay === 'night' || timeOfDay === 'dusk') {
    const lightColor = isGoldenGate ? 'rgba(255,200,100,0.7)' : 'rgba(255,230,150,0.5)'
    ctx.fillStyle = lightColor
    ctx.beginPath()
    ctx.arc(screenX - hw * 0.3, sy - 1, 1.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(screenX + hw * 0.3, sy - 1, 1.2, 0, Math.PI * 2)
    ctx.fill()

    // Glow effect
    const glow = ctx.createRadialGradient(screenX, sy - 2, 0, screenX, sy - 2, 6)
    glow.addColorStop(0, isGoldenGate ? 'rgba(255,150,50,0.1)' : 'rgba(255,230,150,0.08)')
    glow.addColorStop(1, 'transparent')
    ctx.fillStyle = glow
    ctx.fillRect(screenX - 6, sy - 8, 12, 12)
  }
}

// Landmarks are now imported from landmarks.ts
export { LANDMARKS, LANDMARK_INFO, getLandmarkAt } from './landmarks'
export type { LandmarkDef } from './landmarks'

const LANDMARK_MAP = new Map<string, (typeof LANDMARKS)[number]>()
for (const lm of LANDMARKS) {
  LANDMARK_MAP.set(`${lm.x},${lm.y}`, lm)
}

function drawLandmark(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  tile: MapTile,
  _x: number,
  _y: number,
  time: number,
  timeOfDay: TimeOfDay,
) {
  const lm = LANDMARK_MAP.get(`${tile.x},${tile.y}`)
  if (!lm) return

  const baseY = screenY - tile.elevation * TILE_DEPTH
  const hw = lm.width
  const h = lm.height
  const pulse = Math.sin(time * 0.003) * 0.5 + 0.5

  // Building shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)'
  ctx.beginPath()
  ctx.moveTo(screenX + 2, baseY + 2)
  ctx.lineTo(screenX + hw + 4, baseY - 2)
  ctx.lineTo(screenX + hw + 4, baseY - h + 2)
  ctx.lineTo(screenX + 2, baseY - h - 2)
  ctx.closePath()
  ctx.fill()

  // Building front face
  ctx.fillStyle = lm.color
  ctx.fillRect(screenX - hw, baseY - h, hw * 2, h)

  // Building side face (right)
  ctx.fillStyle = lm.accent
  ctx.beginPath()
  ctx.moveTo(screenX + hw, baseY)
  ctx.lineTo(screenX + hw + 4, baseY - 3)
  ctx.lineTo(screenX + hw + 4, baseY - h - 3)
  ctx.lineTo(screenX + hw, baseY - h)
  ctx.closePath()
  ctx.fill()

  // Roof
  ctx.fillStyle = lm.accent
  ctx.fillRect(screenX - hw - 1, baseY - h - 2, hw * 2 + 2, 2)

  // Windows — rows of lit squares
  const isNight = timeOfDay === 'night' || timeOfDay === 'dusk'
  const windowColor = isNight ? '#fef3c7' : 'rgba(255,255,255,0.4)'
  const windowRows = Math.floor((h - 6) / 4)
  for (let row = 0; row < windowRows; row++) {
    for (let col = 0; col < 3; col++) {
      const wx = screenX - hw + 2 + col * (Math.floor(hw * 2 / 3))
      const wy = baseY - h + 4 + row * 4
      const litChance = seededRand(tile.x + col, tile.y + row, 42)
      if (litChance > 0.3 || isNight) {
        ctx.fillStyle = isNight && litChance > 0.4 ? windowColor : 'rgba(255,255,255,0.25)'
        ctx.fillRect(wx, wy, 2, 2)
        // Window glow at night
        if (isNight && litChance > 0.4) {
          ctx.fillStyle = `rgba(254, 243, 199, ${0.05 + pulse * 0.03})`
          ctx.fillRect(wx - 1, wy - 1, 4, 4)
        }
      }
    }
  }

  // Label text
  ctx.font = 'bold 5px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.strokeStyle = 'rgba(0,0,0,0.6)'
  ctx.lineWidth = 1.5
  ctx.strokeText(lm.label, screenX, baseY - h - 5)
  ctx.fillText(lm.label, screenX, baseY - h - 5)

  // Colored glow under building
  const glowGrad = ctx.createRadialGradient(screenX, baseY, 0, screenX, baseY, hw + 6)
  glowGrad.addColorStop(0, `${lm.glow}20`)
  glowGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGrad
  ctx.fillRect(screenX - hw - 6, baseY - 6, (hw + 6) * 2, 12)
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  screenX: number,
  screenY: number,
  biome: BiomeType,
  elevation: number,
  _hasCreature: boolean,
  tileX: number,
  tileY: number,
  time: number,
  timeOfDay: TimeOfDay = 'day',
  neighborBiomes?: { n?: BiomeType; s?: BiomeType; e?: BiomeType; w?: BiomeType },
) {
  const colors = BIOME_COLORS[biome]
  const hw = TILE_WIDTH / 2
  const hh = TILE_HEIGHT / 2
  const depth = Math.max(elevation * TILE_DEPTH, 2)
  const r = (seed: number) => seededRand(tileX, tileY, seed)

  // Tile outline for cleaner separation
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'
  ctx.lineWidth = 0.5

  // ---- Water tile (special case) ----
  if (biome === 'water') {
    // Time-aware water colors
    const waterColors = timeOfDay === 'night'
      ? { c1: '#1e3a5f', c2: '#0c2340', c3: '#0a1929' }
      : timeOfDay === 'dusk'
        ? { c1: '#f59e0b88', c2: '#0ea5e9', c3: '#0369a1' }
        : timeOfDay === 'dawn'
          ? { c1: '#7dd3fc', c2: '#38bdf8', c3: '#0284c7' }
          : { c1: '#38bdf8', c2: '#0ea5e9', c3: '#0284c7' }

    // Wave-based shimmer with multiple frequencies
    const wave1 = Math.sin(time * 0.0015 + tileX * 1.3 + tileY * 0.9)
    const wave2 = Math.sin(time * 0.003 + tileX * 0.7 - tileY * 1.1) * 0.5
    const shimmer = 0.6 + (wave1 + wave2) * 0.1
    ctx.globalAlpha *= shimmer

    // Depth gradient: tiles further from shore are darker
    const hasLandNeighbor = neighborBiomes && (
      (neighborBiomes.n && neighborBiomes.n !== 'water') ||
      (neighborBiomes.s && neighborBiomes.s !== 'water') ||
      (neighborBiomes.e && neighborBiomes.e !== 'water') ||
      (neighborBiomes.w && neighborBiomes.w !== 'water')
    )
    const depthDarken = hasLandNeighbor ? 0 : 0.12

    const grad = ctx.createLinearGradient(screenX - hw, screenY - hh, screenX + hw, screenY + hh)
    grad.addColorStop(0, waterColors.c1)
    grad.addColorStop(0.5, waterColors.c2)
    grad.addColorStop(1, waterColors.c3)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(screenX, screenY - hh)
    ctx.lineTo(screenX + hw, screenY)
    ctx.lineTo(screenX, screenY + hh)
    ctx.lineTo(screenX - hw, screenY)
    ctx.closePath()
    ctx.fill()
    // Depth darkening overlay
    if (depthDarken > 0) {
      ctx.fillStyle = `rgba(0,10,30,${depthDarken})`
      ctx.fill()
    }
    ctx.stroke()

    // Caustic light patterns (overlapping rotating sine circles)
    if (timeOfDay === 'day' || timeOfDay === 'dawn') {
      ctx.save()
      ctx.clip() // Clip to tile diamond
      const causticAlpha = timeOfDay === 'dawn' ? 0.06 : 0.08
      ctx.strokeStyle = `rgba(255,255,255,${causticAlpha})`
      ctx.lineWidth = 0.6
      for (let ci = 0; ci < 3; ci++) {
        const cPhase = time * 0.0012 + ci * 2.1 + tileX * 0.5
        const cx = screenX + Math.cos(cPhase) * 5 + (r(30 + ci) - 0.5) * 8
        const cy = screenY + Math.sin(cPhase * 0.8) * 3
        const cRadius = 4 + Math.sin(cPhase * 1.3) * 2
        ctx.beginPath()
        ctx.arc(cx, cy, cRadius, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()
      // Re-clip for subsequent water effects
      ctx.beginPath()
      ctx.moveTo(screenX, screenY - hh)
      ctx.lineTo(screenX + hw, screenY)
      ctx.lineTo(screenX, screenY + hh)
      ctx.lineTo(screenX - hw, screenY)
      ctx.closePath()
    }

    // Animated wave lines across tile
    ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(147,197,253,0.12)' : 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 0.6
    for (let wl = 0; wl < 3; wl++) {
      const wy = screenY - hh * 0.5 + wl * 3 + Math.sin(time * 0.002 + wl * 2 + tileX) * 1
      ctx.beginPath()
      ctx.moveTo(screenX - hw * 0.6, wy)
      ctx.quadraticCurveTo(screenX, wy - 0.8 + Math.sin(time * 0.003 + wl) * 0.5, screenX + hw * 0.6, wy)
      ctx.stroke()
    }

    // Animated ripple circles
    const ripplePhase = time * 0.001 + r(10) * 6.28
    const rippleR = 2 + Math.sin(ripplePhase) * 1.5
    ctx.strokeStyle = timeOfDay === 'night' ? 'rgba(147,197,253,0.15)' : 'rgba(255,255,255,0.2)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    ctx.arc(screenX + (r(11) - 0.5) * 8, screenY + (r(12) - 0.5) * 4, rippleR, 0, Math.PI * 2)
    ctx.stroke()

    // Second ripple offset
    const ripple2 = 1.5 + Math.sin(ripplePhase + 2) * 1
    ctx.beginPath()
    ctx.arc(screenX + (r(13) - 0.5) * 10, screenY + (r(14) - 0.5) * 5, ripple2, 0, Math.PI * 2)
    ctx.stroke()

    // Sparkle highlights on water (day/dawn) — more sparkles with cross pattern
    if (timeOfDay === 'day' || timeOfDay === 'dawn') {
      for (let si = 0; si < 3; si++) {
        const sparklePhase = Math.sin(time * 0.004 + r(19 + si) * 10 + si * 2.1) * 0.5 + 0.5
        if (sparklePhase > 0.65 && r(20 + si) > 0.5) {
          const sx = screenX + (r(21 + si) - 0.5) * 12
          const sy = screenY + (r(22 + si) - 0.5) * 6
          const sparkleSize = 0.4 + sparklePhase * 0.4
          ctx.fillStyle = `rgba(255,255,255,${0.4 + sparklePhase * 0.3})`
          // Cross sparkle shape
          ctx.fillRect(sx - sparkleSize, sy - 0.2, sparkleSize * 2, 0.4)
          ctx.fillRect(sx - 0.2, sy - sparkleSize, 0.4, sparkleSize * 2)
        }
      }
    }

    // Moon/sun reflection on water — elongated shimmer column
    if ((timeOfDay === 'night' || timeOfDay === 'dusk') && r(23) > 0.85) {
      const reflAlpha = 0.04 + Math.sin(time * 0.002 + tileX) * 0.02
      const reflColor = timeOfDay === 'night' ? `rgba(200,220,255,${reflAlpha})` : `rgba(251,191,36,${reflAlpha * 1.5})`
      ctx.fillStyle = reflColor
      ctx.beginPath()
      ctx.ellipse(screenX, screenY, 2 + Math.sin(time * 0.003) * 0.5, 4, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Reflected land shimmer (adjacent land tiles create wobbly reflection)
    if (neighborBiomes) {
      const reflections = [
        { dir: neighborBiomes.n, dx: 0, dy: -1 },
        { dir: neighborBiomes.s, dx: 0, dy: 1 },
        { dir: neighborBiomes.e, dx: 1, dy: 0 },
        { dir: neighborBiomes.w, dx: -1, dy: 0 },
      ]
      for (const ref of reflections) {
        if (ref.dir && ref.dir !== 'water') {
          const reflColors = BIOME_COLORS[ref.dir]
          const wobble = Math.sin(time * 0.002 + tileX * 0.7 + tileY * 0.5) * 2
          const ry = screenY + ref.dy * 3 + wobble
          const rx = screenX + ref.dx * 5
          ctx.globalAlpha *= 0.06
          ctx.fillStyle = reflColors.top
          ctx.beginPath()
          ctx.ellipse(rx, ry, 6, 2, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha /= 0.06
        }
      }
    }

    // Shoreline foam where water meets land
    if (neighborBiomes) {
      const landNeighbors = [
        { dir: neighborBiomes.n, dx: 0, dy: -hh },
        { dir: neighborBiomes.s, dx: 0, dy: hh },
        { dir: neighborBiomes.e, dx: hw, dy: 0 },
        { dir: neighborBiomes.w, dx: -hw, dy: 0 },
      ]
      for (const ln of landNeighbors) {
        if (ln.dir && ln.dir !== 'water') {
          const foamWave = Math.sin(time * 0.002 + tileX * 0.8 + tileY * 0.5) * 1
          ctx.strokeStyle = 'rgba(255,255,255,0.3)'
          ctx.lineWidth = 1
          ctx.beginPath()
          const fx = screenX + ln.dx * 0.6
          const fy = screenY + ln.dy * 0.6 + foamWave
          ctx.moveTo(fx - 3, fy)
          ctx.quadraticCurveTo(fx, fy - 1, fx + 3, fy)
          ctx.stroke()
          // Foam dots
          ctx.fillStyle = 'rgba(255,255,255,0.2)'
          ctx.beginPath()
          ctx.arc(fx - 2, fy + 0.5, 0.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.beginPath()
          ctx.arc(fx + 2, fy + 0.5, 0.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Occasional fish jump
    if (r(15) > 0.92) {
      const fishTime = (time * 0.002 + r(16) * 6.28) % 6.28
      if (fishTime < 1.5) {
        const fx = screenX + (r(17) - 0.5) * 8
        const fy = screenY - Math.sin(fishTime / 1.5 * Math.PI) * 6
        ctx.fillStyle = '#94a3b8'
        ctx.beginPath()
        ctx.arc(fx, fy, 1.2, 0, Math.PI * 2)
        ctx.fill()
        // Splash drops
        ctx.fillStyle = 'rgba(255,255,255,0.4)'
        ctx.fillRect(fx - 2, fy + 1, 1, 1)
        ctx.fillRect(fx + 2, fy + 1, 1, 1)
      }
    }

    // Boat on some tiles (not at night)
    if (r(18) > 0.95 && timeOfDay !== 'night') {
      const bx = screenX
      const by = screenY - 1 + Math.sin(time * 0.0015) * 0.5
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.moveTo(bx - 3, by)
      ctx.lineTo(bx + 3, by)
      ctx.lineTo(bx + 2, by + 2)
      ctx.lineTo(bx - 2, by + 2)
      ctx.closePath()
      ctx.fill()
      // Sail
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.moveTo(bx, by - 4)
      ctx.lineTo(bx + 2, by)
      ctx.lineTo(bx, by)
      ctx.closePath()
      ctx.fill()
      // Wake trail
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 0.4
      ctx.beginPath()
      ctx.moveTo(bx - 2, by + 2)
      ctx.lineTo(bx - 5, by + 4)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(bx + 2, by + 2)
      ctx.lineTo(bx + 5, by + 4)
      ctx.stroke()
    }

    return
  }

  // ---- Cast shadow on ground (from elevated tiles) ----
  if (elevation > 0) {
    // Time-based shadow direction (shadows shift with sun position)
    const shadowAngle = timeOfDay === 'dawn' ? 3 : timeOfDay === 'dusk' ? 1 : timeOfDay === 'night' ? 2 : 2
    const shadowLen = timeOfDay === 'dawn' || timeOfDay === 'dusk' ? elevation * 3.5 : elevation * 2
    const sdx = Math.cos(shadowAngle) * shadowLen
    const sdy = Math.sin(shadowAngle) * shadowLen * 0.5
    const lighting = TIME_LIGHTING[timeOfDay]
    ctx.fillStyle = `rgba(0,0,0,${lighting.shadowAlpha})`
    ctx.beginPath()
    ctx.moveTo(screenX + sdx, screenY - hh + sdy + depth)
    ctx.lineTo(screenX + hw + sdx, screenY + sdy + depth)
    ctx.lineTo(screenX + sdx, screenY + hh + sdy + depth)
    ctx.lineTo(screenX - hw + sdx, screenY + sdy + depth)
    ctx.closePath()
    ctx.fill()

    // Ambient occlusion — soft darkening at cliff base
    const aoGrad = ctx.createLinearGradient(screenX, screenY + hh + depth - 4, screenX, screenY + hh + depth + 2)
    aoGrad.addColorStop(0, `rgba(0,0,0,${lighting.shadowAlpha * 0.6})`)
    aoGrad.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = aoGrad
    ctx.beginPath()
    ctx.moveTo(screenX - hw, screenY + depth)
    ctx.lineTo(screenX, screenY + hh + depth + 2)
    ctx.lineTo(screenX + hw, screenY + depth)
    ctx.lineTo(screenX, screenY - hh + depth)
    ctx.closePath()
    ctx.fill()
  }

  // ---- Top face with gradient shading ----
  const topGrad = ctx.createLinearGradient(screenX - hw, screenY - hh, screenX + hw, screenY + hh)
  topGrad.addColorStop(0, colors.top)
  topGrad.addColorStop(1, colors.side)
  ctx.fillStyle = topGrad
  ctx.beginPath()
  ctx.moveTo(screenX, screenY - hh)
  ctx.lineTo(screenX + hw, screenY)
  ctx.lineTo(screenX, screenY + hh)
  ctx.lineTo(screenX - hw, screenY)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Subtle noise/texture on top face for surface detail
  if (r(80) > 0.4) {
    const spots = 2 + Math.floor(r(81) * 3)
    for (let s = 0; s < spots; s++) {
      const sx = screenX + (r(82 + s) - 0.5) * hw * 1.2
      const sy = screenY + (r(85 + s) - 0.5) * hh * 1.2
      ctx.fillStyle = r(88 + s) > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
      ctx.beginPath()
      ctx.arc(sx, sy, 0.6 + r(90 + s) * 0.8, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Edge highlight on top-left edges (light line) — brighter during day
  const edgeAlpha = timeOfDay === 'day' ? 0.3 : timeOfDay === 'night' ? 0.1 : 0.2
  ctx.strokeStyle = `rgba(255,255,255,${edgeAlpha})`
  ctx.lineWidth = 0.7
  ctx.beginPath()
  ctx.moveTo(screenX - hw, screenY)
  ctx.lineTo(screenX, screenY - hh)
  ctx.lineTo(screenX + hw, screenY)
  ctx.stroke()

  // Right face with gradient
  const rightGrad = ctx.createLinearGradient(screenX, screenY, screenX + hw, screenY + depth)
  rightGrad.addColorStop(0, colors.side)
  rightGrad.addColorStop(1, colors.dark)
  ctx.fillStyle = rightGrad
  ctx.beginPath()
  ctx.moveTo(screenX + hw, screenY)
  ctx.lineTo(screenX, screenY + hh)
  ctx.lineTo(screenX, screenY + hh + depth)
  ctx.lineTo(screenX + hw, screenY + depth)
  ctx.closePath()
  ctx.fill()

  // Left face (darker)
  ctx.fillStyle = colors.dark
  ctx.beginPath()
  ctx.moveTo(screenX - hw, screenY)
  ctx.lineTo(screenX, screenY + hh)
  ctx.lineTo(screenX, screenY + hh + depth)
  ctx.lineTo(screenX - hw, screenY + depth)
  ctx.closePath()
  ctx.fill()

  // Bottom edge line for depth separation
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'
  ctx.lineWidth = 0.5
  ctx.beginPath()
  ctx.moveTo(screenX - hw, screenY + depth)
  ctx.lineTo(screenX, screenY + hh + depth)
  ctx.lineTo(screenX + hw, screenY + depth)
  ctx.stroke()

  // ======== BIOME DECORATIONS ========

  // ---- Forest ----
  if (biome === 'forest') {
    // Undergrowth bushes at tile base
    if (r(1) > 0.3) {
      ctx.fillStyle = '#16a34a'
      ctx.beginPath()
      ctx.arc(screenX - 4 + r(20) * 4, screenY + hh - 3, 2 + r(21), 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(screenX + 3 - r(22) * 3, screenY + hh - 2, 1.5 + r(23) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }

    // Main tree with varied height + wind sway — rounded canopy
    if (r(0) > 0.35) {
      const treeH = 10 + r(2) * 12
      const trunkH = treeH * 0.45
      const canopyR = 3.5 + r(3) * 3
      const trunkColor = '#7c2d12'
      const ox = (r(4) - 0.5) * 4
      const sway = Math.sin(time * 0.0015 + tileX * 1.7 + tileY * 2.3) * 1.5
      const treeType = r(50) // deterministic tree style per tile

      // Trunk with slight taper
      ctx.fillStyle = trunkColor
      ctx.beginPath()
      ctx.moveTo(screenX + ox - 1.2, screenY - hh)
      ctx.lineTo(screenX + ox - 0.8, screenY - hh - trunkH)
      ctx.lineTo(screenX + ox + 0.8, screenY - hh - trunkH)
      ctx.lineTo(screenX + ox + 1.2, screenY - hh)
      ctx.closePath()
      ctx.fill()
      // Bark texture
      ctx.fillStyle = '#92400e'
      ctx.fillRect(screenX + ox - 0.3, screenY - hh - trunkH + 2, 0.6, trunkH - 3)

      if (treeType > 0.55) {
        // Round deciduous tree — overlapping circles
        const layers = [
          { dx: -canopyR * 0.3, dy: 0, r: canopyR * 0.85, c: '#15803d' },
          { dx: canopyR * 0.3, dy: -canopyR * 0.15, r: canopyR * 0.8, c: '#16a34a' },
          { dx: 0, dy: -canopyR * 0.4, r: canopyR * 0.9, c: '#22c55e' },
        ]
        for (const l of layers) {
          ctx.fillStyle = l.c
          ctx.beginPath()
          ctx.arc(screenX + ox + l.dx + sway * 0.6, screenY - hh - trunkH - canopyR * 0.5 + l.dy, l.r, 0, Math.PI * 2)
          ctx.fill()
        }
        // Top highlight
        ctx.fillStyle = '#4ade80'
        ctx.beginPath()
        ctx.arc(screenX + ox + sway * 0.8, screenY - hh - treeH + canopyR * 0.3, canopyR * 0.35, 0, Math.PI * 2)
        ctx.fill()
      } else if (treeType > 0.2) {
        // Conifer / pine tree — layered triangles with rounded tips
        for (let layer = 0; layer < 3; layer++) {
          const ly = screenY - hh - trunkH + 2 - layer * (treeH - trunkH) * 0.3
          const lw = canopyR * (1.1 - layer * 0.2)
          const lSway = sway * (0.5 + layer * 0.2)
          ctx.fillStyle = layer === 0 ? '#166534' : layer === 1 ? '#15803d' : '#22c55e'
          ctx.beginPath()
          ctx.moveTo(screenX + ox + lSway, ly - (treeH - trunkH) * 0.4)
          ctx.quadraticCurveTo(screenX + ox + lw + lSway * 0.5, ly + 1, screenX + ox + lSway * 0.5, ly + 2)
          ctx.lineTo(screenX + ox - lw + lSway * 0.5, ly + 2)
          ctx.quadraticCurveTo(screenX + ox - lw + lSway * 0.5, ly + 1, screenX + ox + lSway, ly - (treeH - trunkH) * 0.4)
          ctx.closePath()
          ctx.fill()
        }
      } else {
        // Bushy shrub/small tree — multiple small circles
        for (let b = 0; b < 4; b++) {
          const bx = screenX + ox + (r(51 + b) - 0.5) * canopyR * 1.2 + sway * 0.5
          const by = screenY - hh - trunkH - r(55 + b) * canopyR * 0.8
          ctx.fillStyle = b % 2 === 0 ? '#16a34a' : '#22c55e'
          ctx.beginPath()
          ctx.arc(bx, by, canopyR * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    // Occasional flowers (daytime)
    if (r(5) > 0.7 && timeOfDay !== 'night') {
      const flowerColors = ['#f43f5e', '#a855f7', '#facc15', '#fb923c']
      const fc = flowerColors[Math.floor(r(6) * flowerColors.length)]
      ctx.fillStyle = fc
      ctx.fillRect(screenX + (r(7) - 0.5) * 10, screenY - 1 + (r(8) - 0.5) * 4, 1.5, 1.5)
      if (r(9) > 0.5) {
        ctx.fillRect(screenX + (r(25) - 0.5) * 8, screenY + (r(26) - 0.5) * 3, 1, 1)
      }
    }

    // Fireflies at night
    if (timeOfDay === 'night' && r(27) > 0.7) {
      const ffPhase = time * 0.003 + r(28) * 6.28
      const ffAlpha = 0.3 + Math.sin(ffPhase) * 0.3
      const ffx = screenX + (r(29) - 0.5) * 12 + Math.sin(ffPhase * 0.7) * 2
      const ffy = screenY - hh - 4 + Math.sin(ffPhase) * 3
      ctx.globalAlpha *= ffAlpha
      const ffGlow = ctx.createRadialGradient(ffx, ffy, 0, ffx, ffy, 3)
      ffGlow.addColorStop(0, 'rgba(74,222,128,0.6)')
      ffGlow.addColorStop(1, 'rgba(74,222,128,0)')
      ctx.fillStyle = ffGlow
      ctx.beginPath()
      ctx.arc(ffx, ffy, 3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#4ade80'
      ctx.beginPath()
      ctx.arc(ffx, ffy, 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha /= ffAlpha
    }

    // Dappled light shafts during day
    if (timeOfDay === 'day' && r(0) > 0.35 && r(28) > 0.7) {
      ctx.globalAlpha *= 0.08
      ctx.fillStyle = '#fef9c3'
      ctx.beginPath()
      ctx.moveTo(screenX + 2, screenY - hh - 20)
      ctx.lineTo(screenX + 5, screenY + hh)
      ctx.lineTo(screenX - 1, screenY + hh)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha /= 0.08
    }
  }

  // ---- Redwood ----
  if (biome === 'redwood') {
    // Much taller trees!
    if (r(0) > 0.3) {
      const treeH = 22 + r(2) * 16 // very tall!
      const trunkH = treeH * 0.6
      const canopyW = 3 + r(3) * 2
      const ox = (r(4) - 0.5) * 3

      // Wind sway for redwoods — slower, more massive feel
      const rwSway = Math.sin(time * 0.001 + tileX * 1.3 + tileY * 1.9) * 1.0

      // Thick trunk
      ctx.fillStyle = '#7c2d12'
      ctx.fillRect(screenX + ox - 1.5, screenY - hh - trunkH, 3, trunkH)
      // Trunk bark detail
      ctx.fillStyle = '#92400e'
      ctx.fillRect(screenX + ox - 0.5, screenY - hh - trunkH + 4, 1, trunkH - 6)

      // Multi-layer canopy with wind sway
      for (let i = 0; i < 3; i++) {
        const layerY = screenY - hh - treeH + i * 5
        const layerW = canopyW - i * 0.5
        const layerSway = rwSway * (1 - i * 0.2) // top sways most
        ctx.fillStyle = i === 0 ? '#14532d' : i === 1 ? '#166534' : '#15803d'
        ctx.beginPath()
        ctx.moveTo(screenX + ox + layerSway, layerY)
        ctx.lineTo(screenX + ox + layerW + layerSway * 0.5, layerY + 6)
        ctx.lineTo(screenX + ox - layerW + layerSway * 0.5, layerY + 6)
        ctx.closePath()
        ctx.fill()
      }
    }

    // Fallen log debris
    if (r(30) > 0.75) {
      ctx.fillStyle = '#78350f'
      ctx.fillRect(screenX - 5, screenY + hh - 3, 7, 1.5)
      ctx.fillStyle = '#92400e'
      ctx.fillRect(screenX - 5, screenY + hh - 3, 7, 0.5)
    }

    // Mushroom dots at base
    if (r(31) > 0.6) {
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(screenX + (r(32) - 0.5) * 8, screenY + hh - 2, 1.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fef2f2'
      ctx.fillRect(screenX + (r(32) - 0.5) * 8 - 0.3, screenY + hh - 2.5, 0.6, 0.6)
      if (r(33) > 0.5) {
        ctx.fillStyle = '#f97316'
        ctx.beginPath()
        ctx.arc(screenX + (r(34) - 0.5) * 6, screenY + hh - 1.5, 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // ---- Urban ----
  if (biome === 'urban') {
    if (r(0) > 0.45) {
      const bh = 6 + Math.floor(r(1) * 14)
      const buildingType = r(40)
      const bw = 3 + Math.floor(r(41) * 3)

      // Building body with side shading
      ctx.fillStyle = timeOfDay === 'night' ? '#2d3748' : '#4b5563'
      ctx.fillRect(screenX - bw, screenY - hh - bh, bw * 2, bh)
      // Right side shading on building
      ctx.fillStyle = timeOfDay === 'night' ? '#1a202c' : '#374151'
      ctx.fillRect(screenX, screenY - hh - bh, bw, bh)
      // Building top highlight
      ctx.fillStyle = timeOfDay === 'night' ? '#4a5568' : '#6b7280'
      ctx.fillRect(screenX - bw, screenY - hh - bh, bw * 2, 2)

      if (buildingType > 0.7) {
        // Pointed roof
        ctx.fillStyle = timeOfDay === 'night' ? '#1a202c' : '#374151'
        ctx.beginPath()
        ctx.moveTo(screenX, screenY - hh - bh - 5)
        ctx.lineTo(screenX + bw + 1, screenY - hh - bh)
        ctx.lineTo(screenX - bw - 1, screenY - hh - bh)
        ctx.closePath()
        ctx.fill()
      } else if (buildingType > 0.4) {
        // Flat top with AC units
        ctx.fillStyle = '#9ca3af'
        ctx.fillRect(screenX - 2, screenY - hh - bh - 2, 2, 2)
        if (r(42) > 0.5) {
          ctx.fillRect(screenX + 1, screenY - hh - bh - 1.5, 1.5, 1.5)
        }
      }

      // Windows — lit at night/dusk, dark during day
      const isLit = timeOfDay === 'night' || timeOfDay === 'dusk'
      for (let wy = 0; wy < bh - 4; wy += 4) {
        for (let wx = -bw + 1; wx < bw - 1; wx += 3) {
          const flickerSeed = r(50 + wy * 7 + wx * 3)
          if (isLit) {
            // Warm/cool window colors at night
            const warmWindow = flickerSeed > 0.3
            ctx.fillStyle = warmWindow ? '#fbbf24' : '#93c5fd'
            const flicker = 0.5 + 0.4 * (0.5 + 0.5 * Math.sin(time * 0.001 * (1 + flickerSeed) + flickerSeed * 6.28))
            ctx.globalAlpha *= flicker
            ctx.fillRect(screenX + wx, screenY - hh - bh + 3 + wy, 2, 2)
            // Window glow at night
            if (timeOfDay === 'night' && warmWindow) {
              ctx.fillStyle = 'rgba(251,191,36,0.15)'
              ctx.fillRect(screenX + wx - 0.5, screenY - hh - bh + 2.5 + wy, 3, 3)
            }
            ctx.globalAlpha /= flicker
          } else {
            // Daytime — reflective blue-tinted windows
            ctx.fillStyle = flickerSeed > 0.5 ? '#93c5fd' : '#60a5fa'
            ctx.globalAlpha *= 0.4
            ctx.fillRect(screenX + wx, screenY - hh - bh + 3 + wy, 2, 2)
            ctx.globalAlpha /= 0.4
          }
        }
      }
    }

    // Ambient light pool from lit windows at night
    if ((timeOfDay === 'night' || timeOfDay === 'dusk') && r(0) > 0.45) {
      const poolAlpha = timeOfDay === 'night' ? 0.12 : 0.06
      const poolGlow = ctx.createRadialGradient(screenX, screenY - hh + 2, 0, screenX, screenY - hh + 2, 14)
      poolGlow.addColorStop(0, `rgba(251,191,36,${poolAlpha})`)
      poolGlow.addColorStop(0.6, `rgba(251,150,36,${poolAlpha * 0.3})`)
      poolGlow.addColorStop(1, 'rgba(251,191,36,0)')
      ctx.fillStyle = poolGlow
      ctx.beginPath()
      ctx.ellipse(screenX, screenY - hh + 2, 14, 7, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Street lamp — glow radius bigger at night
    if (r(43) > 0.82) {
      const lx = screenX + (r(44) > 0.5 ? 6 : -6)
      const ly = screenY - hh
      ctx.fillStyle = '#374151'
      ctx.fillRect(lx - 0.5, ly - 10, 1, 10)
      ctx.fillStyle = '#9ca3af'
      ctx.fillRect(lx - 1.5, ly - 11, 3, 1.5)
      const glowR = timeOfDay === 'night' ? 10 : timeOfDay === 'dusk' ? 8 : 5
      const glowAlpha = timeOfDay === 'night' ? 0.35 : timeOfDay === 'dusk' ? 0.25 : 0.12
      const lampGlow = ctx.createRadialGradient(lx, ly - 10, 0, lx, ly - 10, glowR)
      lampGlow.addColorStop(0, `rgba(251,191,36,${glowAlpha})`)
      lampGlow.addColorStop(1, 'rgba(251,191,36,0)')
      ctx.fillStyle = lampGlow
      ctx.beginPath()
      ctx.arc(lx, ly - 10, glowR, 0, Math.PI * 2)
      ctx.fill()
      // Ground light pool at night
      if (timeOfDay === 'night' || timeOfDay === 'dusk') {
        const poolGlow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 8)
        poolGlow.addColorStop(0, 'rgba(251,191,36,0.12)')
        poolGlow.addColorStop(1, 'rgba(251,191,36,0)')
        ctx.fillStyle = poolGlow
        ctx.beginPath()
        ctx.ellipse(lx, ly, 8, 4, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Crosswalk / road markings on some tiles
    if (r(95) > 0.85) {
      ctx.fillStyle = 'rgba(255,255,255,0.12)'
      for (let m = 0; m < 3; m++) {
        ctx.fillRect(screenX - 4 + m * 3, screenY + hh - 2, 2, 0.8)
      }
    }
  }

  // ---- Mountain ----
  if (biome === 'mountain') {
    if (r(0) > 0.4) {
      const peakH = 10 + r(1) * 8
      const peakW = 5 + r(2) * 3

      // Rock body with texture
      ctx.fillStyle = '#78716c'
      ctx.beginPath()
      ctx.moveTo(screenX, screenY - hh - peakH)
      ctx.lineTo(screenX + peakW, screenY - hh - 2)
      ctx.lineTo(screenX - peakW, screenY - hh - 2)
      ctx.closePath()
      ctx.fill()

      // Rock face shading
      ctx.fillStyle = '#57534e'
      ctx.beginPath()
      ctx.moveTo(screenX + 1, screenY - hh - peakH + 2)
      ctx.lineTo(screenX + peakW, screenY - hh - 2)
      ctx.lineTo(screenX + 1, screenY - hh - 2)
      ctx.closePath()
      ctx.fill()

      // Cracks / texture lines
      ctx.strokeStyle = '#44403c'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(screenX - 1, screenY - hh - peakH * 0.6)
      ctx.lineTo(screenX - 2, screenY - hh - peakH * 0.3)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(screenX + 1, screenY - hh - peakH * 0.5)
      ctx.lineTo(screenX + 3, screenY - hh - peakH * 0.2)
      ctx.stroke()

      // Snow cap
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.moveTo(screenX, screenY - hh - peakH)
      ctx.lineTo(screenX + 2.5, screenY - hh - peakH + 4)
      ctx.lineTo(screenX - 2.5, screenY - hh - peakH + 4)
      ctx.closePath()
      ctx.fill()
    }

    // Alpine flowers at lower elevations
    if (elevation < 3 && r(45) > 0.6) {
      const aflowers = ['#c084fc', '#f472b6', '#facc15']
      ctx.fillStyle = aflowers[Math.floor(r(46) * aflowers.length)]
      ctx.fillRect(screenX + (r(47) - 0.5) * 8, screenY + (r(48) - 0.5) * 4, 1.5, 1.5)
      ctx.fillRect(screenX + (r(49) - 0.5) * 6, screenY + (r(50) - 0.5) * 3, 1, 1)
    }

    // Bird silhouettes in sky above (daytime only)
    if (r(51) > 0.85 && timeOfDay !== 'night') {
      const birdY = screenY - hh - 20 - r(52) * 10
      const birdX = screenX + (r(53) - 0.5) * 12 + Math.sin(time * 0.002 + r(54) * 6) * 3
      ctx.strokeStyle = timeOfDay === 'dusk' ? '#7c3aed' : '#1e293b'
      ctx.lineWidth = 0.6
      ctx.beginPath()
      ctx.moveTo(birdX - 2, birdY + 1)
      ctx.quadraticCurveTo(birdX - 1, birdY, birdX, birdY + 0.5)
      ctx.quadraticCurveTo(birdX + 1, birdY, birdX + 2, birdY + 1)
      ctx.stroke()
    }

    // Snow sparkle on peaks during day
    if (timeOfDay === 'day' && r(0) > 0.4 && r(55) > 0.6) {
      const sparkle = Math.sin(time * 0.005 + r(56) * 10) * 0.5 + 0.5
      if (sparkle > 0.7) {
        const peakH2 = 10 + r(1) * 8
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.beginPath()
        ctx.arc(screenX + 1, screenY - hh - peakH2 + 2, 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // ---- Marsh ----
  if (biome === 'marsh') {
    // Lily pad circles on top
    if (r(0) > 0.4) {
      ctx.fillStyle = '#4d7c0f'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(1) - 0.5) * 6, screenY + (r(2) - 0.5) * 3, 2.5, 1.5, 0, 0.3, Math.PI * 1.8)
      ctx.fill()
      if (r(3) > 0.5) {
        ctx.fillStyle = '#365314'
        ctx.beginPath()
        ctx.ellipse(screenX + (r(60) - 0.5) * 8, screenY + (r(61) - 0.5) * 4, 2, 1, 0, 0.2, Math.PI * 1.9)
        ctx.fill()
      }
    }

    // Cattail reeds with brown tops
    if (r(4) > 0.5) {
      ctx.strokeStyle = '#65a30d'
      ctx.lineWidth = 0.8
      const rx1 = screenX - 2 + r(5) * 3
      ctx.beginPath()
      ctx.moveTo(rx1, screenY - hh)
      ctx.lineTo(rx1 - 1, screenY - hh - 10)
      ctx.stroke()
      // Cattail top (brown oval)
      ctx.fillStyle = '#78350f'
      ctx.beginPath()
      ctx.ellipse(rx1 - 1, screenY - hh - 11, 1.2, 2.5, 0, 0, Math.PI * 2)
      ctx.fill()

      const rx2 = screenX + 2 + r(6) * 2
      ctx.strokeStyle = '#65a30d'
      ctx.beginPath()
      ctx.moveTo(rx2, screenY - hh)
      ctx.lineTo(rx2 + 1, screenY - hh - 7)
      ctx.stroke()
      ctx.fillStyle = '#92400e'
      ctx.beginPath()
      ctx.ellipse(rx2 + 1, screenY - hh - 8, 1, 2, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Water puddle reflections
    if (r(7) > 0.55) {
      ctx.fillStyle = timeOfDay === 'night' ? 'rgba(30,58,95,0.3)' : 'rgba(56,189,248,0.2)'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(8) - 0.5) * 6, screenY + (r(9) - 0.5) * 3, 3, 1.5, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.1)'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(8) - 0.5) * 6 - 1, screenY + (r(9) - 0.5) * 3 - 0.5, 1, 0.5, 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Dragonfly hovering (daytime)
    if (r(70) > 0.82 && timeOfDay !== 'night') {
      const dfPhase = time * 0.005 + r(71) * 6.28
      const dfx = screenX + Math.sin(dfPhase * 0.6) * 6 + (r(72) - 0.5) * 4
      const dfy = screenY - hh - 5 + Math.sin(dfPhase) * 3
      const wingFlap = Math.sin(dfPhase * 8) * 0.5
      const dfColors = ['#60a5fa', '#34d399', '#c084fc']
      ctx.fillStyle = dfColors[Math.floor(r(73) * dfColors.length)]
      // Body
      ctx.fillRect(dfx - 0.3, dfy - 0.3, 3, 0.6)
      // Wings
      ctx.globalAlpha *= 0.5
      ctx.fillStyle = 'rgba(200,230,255,0.6)'
      ctx.beginPath()
      ctx.ellipse(dfx + 0.5, dfy - 1 - wingFlap, 2, 0.8, -0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(dfx + 0.5, dfy + 1 + wingFlap, 2, 0.8, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha /= 0.5
    }

    // Marsh fireflies at night
    if (timeOfDay === 'night' && r(62) > 0.6) {
      for (let ff = 0; ff < 2; ff++) {
        const ffPhase = time * 0.0025 + r(63 + ff) * 6.28
        const ffAlpha = 0.2 + Math.sin(ffPhase) * 0.25
        const ffx = screenX + (r(65 + ff) - 0.5) * 10 + Math.sin(ffPhase * 0.5) * 2
        const ffy = screenY - hh - 3 + Math.cos(ffPhase * 0.7) * 2
        ctx.globalAlpha *= ffAlpha
        ctx.fillStyle = '#86efac'
        ctx.beginPath()
        ctx.arc(ffx, ffy, 0.5, 0, Math.PI * 2)
        ctx.fill()
        const ffg = ctx.createRadialGradient(ffx, ffy, 0, ffx, ffy, 2.5)
        ffg.addColorStop(0, 'rgba(134,239,172,0.4)')
        ffg.addColorStop(1, 'rgba(134,239,172,0)')
        ctx.fillStyle = ffg
        ctx.beginPath()
        ctx.arc(ffx, ffy, 2.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha /= ffAlpha
      }
    }
  }

  // ---- Beach ----
  if (biome === 'beach') {
    // Shell dots
    if (r(0) > 0.5) {
      const shellColors = ['#fef3c7', '#fde68a', '#d6d3d1']
      ctx.fillStyle = shellColors[Math.floor(r(1) * shellColors.length)]
      ctx.beginPath()
      ctx.arc(screenX + (r(2) - 0.5) * 10, screenY + (r(3) - 0.5) * 5, 0.8 + r(70) * 0.5, 0, Math.PI * 2)
      ctx.fill()
      if (r(4) > 0.6) {
        ctx.fillStyle = shellColors[Math.floor(r(5) * shellColors.length)]
        ctx.beginPath()
        ctx.arc(screenX + (r(6) - 0.5) * 8, screenY + (r(7) - 0.5) * 4, 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Wave foam lines at edge
    if (r(8) > 0.6) {
      const foamY = screenY + hh - 2 + Math.sin(time * 0.002 + tileX * 0.8) * 1
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(screenX - 5, foamY)
      ctx.quadraticCurveTo(screenX, foamY - 1, screenX + 5, foamY)
      ctx.stroke()
    }

    // Scuttling crab
    if (r(75) > 0.82) {
      const crabPhase = time * 0.003 + r(76) * 6.28
      const cx = screenX + (r(77) - 0.5) * 8 + Math.sin(crabPhase) * 2
      const cy = screenY + (r(78) - 0.5) * 3
      ctx.fillStyle = '#b45309'
      ctx.beginPath()
      ctx.ellipse(cx, cy, 1.5, 1, 0, 0, Math.PI * 2)
      ctx.fill()
      // Claws
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.arc(cx - 2, cy - 0.3, 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + 2, cy - 0.3, 0.6, 0, Math.PI * 2)
      ctx.fill()
      // Legs (tiny lines)
      ctx.strokeStyle = '#92400e'
      ctx.lineWidth = 0.3
      for (let leg = 0; leg < 3; leg++) {
        ctx.beginPath()
        ctx.moveTo(cx - 1 + leg * 0.5, cy + 0.8)
        ctx.lineTo(cx - 1.5 + leg * 0.5, cy + 1.8)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(cx + 0.5 + leg * 0.5, cy + 0.8)
        ctx.lineTo(cx + 1 + leg * 0.5, cy + 1.8)
        ctx.stroke()
      }
    }

    // Seagull standing on beach (daytime)
    if (r(80) > 0.9 && timeOfDay !== 'night') {
      const gx = screenX + (r(81) - 0.5) * 8
      const gy = screenY + (r(82) - 0.5) * 3
      // Body
      ctx.fillStyle = '#f1f5f9'
      ctx.beginPath()
      ctx.ellipse(gx, gy - 2, 2, 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
      // Head
      ctx.beginPath()
      ctx.arc(gx + 1.5, gy - 3, 1, 0, Math.PI * 2)
      ctx.fill()
      // Beak
      ctx.fillStyle = '#f97316'
      ctx.fillRect(gx + 2.5, gy - 3.2, 1.5, 0.5)
      // Eye
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(gx + 1.8, gy - 3.3, 0.4, 0.4)
      // Legs
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(gx - 0.5, gy - 1)
      ctx.lineTo(gx - 0.5, gy + 0.5)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(gx + 0.5, gy - 1)
      ctx.lineTo(gx + 0.5, gy + 0.5)
      ctx.stroke()
    }

    // Footprint marks
    if (r(9) > 0.8) {
      ctx.fillStyle = 'rgba(161,98,7,0.25)'
      const fpx = screenX + (r(10) - 0.5) * 6
      const fpy = screenY + (r(11) - 0.5) * 3
      ctx.beginPath()
      ctx.ellipse(fpx, fpy, 0.8, 1.3, 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(fpx + 2, fpy - 1.5, 0.8, 1.3, 0.3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ---- Grassland ----
  if (biome === 'grassland') {
    // Wildflower clusters
    if (r(0) > 0.35) {
      const wColors = ['#f43f5e', '#a855f7', '#3b82f6', '#facc15', '#f97316']
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = wColors[Math.floor(r(1 + i) * wColors.length)]
        ctx.fillRect(
          screenX + (r(10 + i) - 0.5) * 10,
          screenY + (r(20 + i) - 0.5) * 5,
          1.2, 1.2,
        )
      }
    }

    // Taller grass tufts
    if (r(4) > 0.4) {
      ctx.strokeStyle = '#16a34a'
      ctx.lineWidth = 0.7
      for (let i = 0; i < 3; i++) {
        const gx = screenX + (r(30 + i) - 0.5) * 10
        const sway = Math.sin(time * 0.002 + r(35 + i) * 6.28) * 1
        ctx.beginPath()
        ctx.moveTo(gx, screenY - 1 + (r(40 + i) - 0.5) * 4)
        ctx.lineTo(gx + sway, screenY - 5 - r(45 + i) * 3)
        ctx.stroke()
      }
    }

    // Occasional butterfly (small v-shapes that bob)
    if (r(5) > 0.88) {
      const bfTime = time * 0.004 + r(6) * 6.28
      const bfx = screenX + Math.sin(bfTime * 0.7) * 5
      const bfy = screenY - hh - 6 + Math.sin(bfTime) * 3
      const wingSpread = 1.5 + Math.sin(bfTime * 3) * 1
      const bfColors = ['#f97316', '#3b82f6', '#eab308']
      ctx.fillStyle = bfColors[Math.floor(r(7) * bfColors.length)]
      ctx.beginPath()
      ctx.moveTo(bfx, bfy)
      ctx.lineTo(bfx - wingSpread, bfy - wingSpread)
      ctx.lineTo(bfx, bfy - 0.5)
      ctx.lineTo(bfx + wingSpread, bfy - wingSpread)
      ctx.closePath()
      ctx.fill()
    }
  }

  // ---- Chaparral ----
  if (biome === 'chaparral') {
    // Dry scrub brush — low rounded bushes with earthy tones
    if (r(0) > 0.3) {
      const bushColors = ['#6b7a3a', '#8a9a56', '#a3a056']
      for (let i = 0; i < 2; i++) {
        const bx = screenX + (r(1 + i) - 0.5) * 12
        const by = screenY + (r(3 + i) - 0.5) * 4
        const bSize = 2.5 + r(5 + i) * 2
        ctx.fillStyle = bushColors[Math.floor(r(7 + i) * bushColors.length)]
        ctx.beginPath()
        ctx.arc(bx, by - 1, bSize, Math.PI, 0)
        ctx.fill()
        // Dark base
        ctx.fillStyle = '#4a5520'
        ctx.beginPath()
        ctx.arc(bx, by, bSize * 0.8, Math.PI * 0.1, Math.PI * 0.9)
        ctx.fill()
      }
    }

    // Tall dry grass tufts with wind sway
    if (r(10) > 0.35) {
      ctx.strokeStyle = '#c4a43a'
      ctx.lineWidth = 0.6
      for (let i = 0; i < 4; i++) {
        const gx = screenX + (r(11 + i) - 0.5) * 14
        const sway = Math.sin(time * 0.0025 + r(15 + i) * 6.28 + tileX) * 2
        const gh = 4 + r(19 + i) * 4
        ctx.beginPath()
        ctx.moveTo(gx, screenY + (r(23 + i) - 0.5) * 3)
        ctx.quadraticCurveTo(gx + sway * 0.5, screenY - gh * 0.5, gx + sway, screenY - gh)
        ctx.stroke()
      }
    }

    // Occasional small rock
    if (r(30) > 0.75) {
      ctx.fillStyle = '#9e9478'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(31) - 0.5) * 8, screenY + (r(32) - 0.5) * 3, 2 + r(33), 1.2, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#b5a98a'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(31) - 0.5) * 8 - 0.5, screenY + (r(32) - 0.5) * 3 - 0.5, 1, 0.6, 0.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Lizard sunning on a rock (rare, daytime only)
    if (r(40) > 0.92 && timeOfDay !== 'night') {
      const lx = screenX + (r(41) - 0.5) * 6
      const ly = screenY + (r(42) - 0.5) * 3
      ctx.fillStyle = '#7c6c3a'
      ctx.fillRect(lx - 2, ly, 4, 1)
      ctx.fillRect(lx + 2, ly, 1.5, 0.5)
      // Tail
      ctx.strokeStyle = '#7c6c3a'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(lx - 2, ly + 0.5)
      ctx.lineTo(lx - 4, ly + 1.5)
      ctx.stroke()
    }
  }

  // ---- Oak Woodland ----
  if (biome === 'oak_woodland') {
    // Spreading oak tree — wide, rounded canopy with thick trunk
    if (r(0) > 0.3) {
      const ox = (r(1) - 0.5) * 4
      const treeH = 12 + r(2) * 8
      const canopyW = 6 + r(3) * 4
      const sway = Math.sin(time * 0.0012 + tileX * 1.5 + tileY * 2.1) * 1.2

      // Thick trunk
      ctx.fillStyle = '#5c3a1e'
      ctx.fillRect(screenX + ox - 1.5, screenY - hh - treeH * 0.45, 3, treeH * 0.45)
      // Branch reaching out
      ctx.strokeStyle = '#5c3a1e'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(screenX + ox, screenY - hh - treeH * 0.35)
      ctx.quadraticCurveTo(screenX + ox + canopyW * 0.4 + sway, screenY - hh - treeH * 0.5, screenX + ox + canopyW * 0.6 + sway, screenY - hh - treeH * 0.4)
      ctx.stroke()

      // Wide rounded canopy (multiple overlapping circles)
      const canopyColors = ['#4a7a1e', '#3d6a18', '#5a8a28']
      for (let i = 0; i < 3; i++) {
        const cx = screenX + ox + (r(4 + i) - 0.5) * canopyW * 0.5 + sway * (0.8 - i * 0.2)
        const cy = screenY - hh - treeH * (0.6 + r(7 + i) * 0.2)
        const cr = canopyW * (0.35 + r(10 + i) * 0.15)
        ctx.fillStyle = canopyColors[i]
        ctx.beginPath()
        ctx.arc(cx, cy, cr, 0, Math.PI * 2)
        ctx.fill()
      }
      // Highlight on top of canopy
      ctx.fillStyle = '#6a9a38'
      ctx.beginPath()
      ctx.arc(screenX + ox + sway, screenY - hh - treeH * 0.8, canopyW * 0.2, 0, Math.PI * 2)
      ctx.fill()
    }

    // Acorns on the ground
    if (r(20) > 0.6) {
      ctx.fillStyle = '#8B6914'
      ctx.beginPath()
      ctx.arc(screenX + (r(21) - 0.5) * 8, screenY + (r(22) - 0.5) * 4, 1, 0, Math.PI * 2)
      ctx.fill()
      // Acorn cap
      ctx.fillStyle = '#654321'
      ctx.beginPath()
      ctx.arc(screenX + (r(21) - 0.5) * 8, screenY + (r(22) - 0.5) * 4 - 0.8, 1.1, Math.PI, 0)
      ctx.fill()
    }

    // Undergrowth ferns
    if (r(25) > 0.5) {
      ctx.fillStyle = '#3d8a28'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(26) - 0.5) * 10, screenY + hh - 2, 3, 1.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // Woodpecker on trunk (rare, daytime)
    if (r(30) > 0.93 && r(0) > 0.3 && timeOfDay !== 'night') {
      const wpY = screenY - hh - 8 - r(31) * 6
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(screenX + 2, wpY, 2, 2.5)
      ctx.fillStyle = '#ef4444'
      ctx.fillRect(screenX + 2, wpY - 1, 2, 1)
    }
  }

  // ---- Kelp Forest (underwater feel) ----
  if (biome === 'kelp_forest') {
    // Kelp strands — tall swaying stalks rising from the seabed
    if (r(0) > 0.25) {
      for (let i = 0; i < 3; i++) {
        const kx = screenX + (r(1 + i) - 0.5) * 12
        const kh = 10 + r(4 + i) * 12
        const sway = Math.sin(time * 0.002 + r(7 + i) * 6.28 + tileX * 0.8) * 3
        const sway2 = Math.sin(time * 0.0015 + r(10 + i) * 4 + tileY) * 2

        // Kelp stalk
        ctx.strokeStyle = i % 2 === 0 ? '#2d6a4f' : '#1b4332'
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.moveTo(kx, screenY)
        ctx.quadraticCurveTo(kx + sway * 0.5, screenY - kh * 0.5, kx + sway, screenY - kh)
        ctx.stroke()

        // Kelp leaves/blades along the stalk
        for (let l = 0; l < 3; l++) {
          const ly = screenY - kh * (0.3 + l * 0.25)
          const lSway = sway * (0.3 + l * 0.25) + sway2
          ctx.fillStyle = l % 2 === 0 ? '#40916c' : '#52b788'
          ctx.beginPath()
          ctx.ellipse(kx + lSway + (l % 2 === 0 ? 2 : -2), ly, 3, 1, lSway * 0.1, 0, Math.PI * 2)
          ctx.fill()
        }

        // Bulb at top
        ctx.fillStyle = '#95d5b2'
        ctx.beginPath()
        ctx.arc(kx + sway, screenY - kh - 1, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Air bubbles rising
    if (r(20) > 0.4) {
      for (let b = 0; b < 3; b++) {
        const bPhase = (time * 0.002 + r(21 + b) * 6.28 + b * 2) % 6
        const bx = screenX + (r(24 + b) - 0.5) * 10
        const by = screenY - bPhase * 4
        const bSize = 0.5 + r(27 + b) * 0.8
        ctx.globalAlpha *= 0.4 - bPhase * 0.05
        ctx.strokeStyle = 'rgba(147,213,178,0.5)'
        ctx.lineWidth = 0.4
        ctx.beginPath()
        ctx.arc(bx, by, bSize, 0, Math.PI * 2)
        ctx.stroke()
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.beginPath()
        ctx.arc(bx - bSize * 0.3, by - bSize * 0.3, bSize * 0.3, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha /= (0.4 - bPhase * 0.05) || 1
      }
    }

    // Underwater light rays (daytime)
    if (timeOfDay === 'day' && r(30) > 0.6) {
      ctx.globalAlpha *= 0.06
      ctx.fillStyle = '#a7f3d0'
      ctx.beginPath()
      ctx.moveTo(screenX + 3, screenY - hh - 18)
      ctx.lineTo(screenX + 7, screenY + hh)
      ctx.lineTo(screenX + 1, screenY + hh)
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha /= 0.06
    }

    // Small fish darting
    if (r(35) > 0.8) {
      const fishPhase = time * 0.003 + r(36) * 6.28
      const fx = screenX + Math.sin(fishPhase) * 8
      const fy = screenY - 4 + Math.cos(fishPhase * 0.7) * 3
      ctx.fillStyle = '#60a5fa'
      ctx.beginPath()
      ctx.moveTo(fx + 2, fy)
      ctx.lineTo(fx - 1.5, fy - 1)
      ctx.lineTo(fx - 1.5, fy + 1)
      ctx.closePath()
      ctx.fill()
      // Tail fin
      ctx.fillStyle = '#3b82f6'
      ctx.beginPath()
      ctx.moveTo(fx - 1.5, fy)
      ctx.lineTo(fx - 3, fy - 0.8)
      ctx.lineTo(fx - 3, fy + 0.8)
      ctx.closePath()
      ctx.fill()
    }
  }

  // ---- Tidepool ----
  if (biome === 'tidepool') {
    // Shallow water pool with visible rocky bottom
    if (r(0) > 0.3) {
      // Water pool
      const poolWave = Math.sin(time * 0.002 + tileX * 0.5 + tileY * 0.3) * 0.3
      ctx.fillStyle = timeOfDay === 'night' ? 'rgba(20,50,80,0.35)' : 'rgba(103,232,249,0.3)'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(1) - 0.5) * 4, screenY + (r(2) - 0.5) * 2, 5 + r(3) * 3, 2.5 + poolWave, 0.3, 0, Math.PI * 2)
      ctx.fill()
      // Sparkle on pool surface
      if (timeOfDay === 'day' || timeOfDay === 'dawn') {
        const sparkle = Math.sin(time * 0.004 + r(4) * 10) * 0.5 + 0.5
        if (sparkle > 0.6) {
          ctx.fillStyle = `rgba(255,255,255,${0.3 + sparkle * 0.2})`
          ctx.fillRect(screenX + (r(5) - 0.5) * 4 - 0.3, screenY + (r(6) - 0.5) * 2 - 0.3, 0.6, 0.6)
        }
      }
    }

    // Starfish — 5-pointed star
    if (r(10) > 0.55) {
      const sx = screenX + (r(11) - 0.5) * 8
      const sy = screenY + (r(12) - 0.5) * 4
      const starColors = ['#f97316', '#ef4444', '#a855f7']
      ctx.fillStyle = starColors[Math.floor(r(13) * starColors.length)]
      // 5-arm star drawn as a small shape
      ctx.beginPath()
      for (let p = 0; p < 5; p++) {
        const angle = (p * Math.PI * 2) / 5 - Math.PI / 2
        const outerR = 2
        const innerR = 0.8
        const ox = sx + Math.cos(angle) * outerR
        const oy = sy + Math.sin(angle) * outerR * 0.7
        if (p === 0) ctx.moveTo(ox, oy)
        else ctx.lineTo(ox, oy)
        const innerAngle = angle + Math.PI / 5
        ctx.lineTo(sx + Math.cos(innerAngle) * innerR, sy + Math.sin(innerAngle) * innerR * 0.7)
      }
      ctx.closePath()
      ctx.fill()
    }

    // Sea anemone — colorful tentacle cluster
    if (r(20) > 0.5) {
      const ax = screenX + (r(21) - 0.5) * 10
      const ay = screenY + (r(22) - 0.5) * 4
      const aColors = ['#ec4899', '#a855f7', '#f43f5e']
      ctx.fillStyle = aColors[Math.floor(r(23) * aColors.length)]
      // Tentacles swaying
      for (let t2 = 0; t2 < 5; t2++) {
        const tSway = Math.sin(time * 0.003 + t2 * 1.2 + r(24 + t2) * 4) * 1.5
        ctx.fillRect(ax - 2 + t2 * 1, ay - 3 + tSway * 0.3, 0.6, 3)
      }
      // Base
      ctx.fillStyle = '#6b21a8'
      ctx.beginPath()
      ctx.arc(ax, ay, 2, 0, Math.PI)
      ctx.fill()
    }

    // Small crab
    if (r(30) > 0.7) {
      const cx = screenX + (r(31) - 0.5) * 8
      const cy = screenY + (r(32) - 0.5) * 3
      const crabWalk = Math.sin(time * 0.004 + r(33) * 6.28) * 1
      ctx.fillStyle = '#dc2626'
      // Body
      ctx.beginPath()
      ctx.ellipse(cx + crabWalk, cy, 1.8, 1.2, 0, 0, Math.PI * 2)
      ctx.fill()
      // Claws
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(cx + crabWalk - 2.2, cy - 0.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx + crabWalk + 2.2, cy - 0.5, 0.8, 0, Math.PI * 2)
      ctx.fill()
      // Eyes
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(cx + crabWalk - 0.8, cy - 1.5, 0.5, 0.5)
      ctx.fillRect(cx + crabWalk + 0.5, cy - 1.5, 0.5, 0.5)
    }

    // Wet rock surfaces
    if (r(40) > 0.4) {
      ctx.fillStyle = 'rgba(100,116,139,0.3)'
      ctx.beginPath()
      ctx.ellipse(screenX + (r(41) - 0.5) * 10, screenY + (r(42) - 0.5) * 5, 3 + r(43) * 2, 1.5, r(44) * 0.5, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ---- Rocky Beach ----
  if (biome === 'rocky_beach') {
    // Scattered rocks of varying sizes
    if (r(0) > 0.2) {
      const rockColors = ['#78716c', '#a8a29e', '#57534e', '#6b7280']
      for (let i = 0; i < 3; i++) {
        const rx = screenX + (r(1 + i) - 0.5) * 12
        const ry = screenY + (r(4 + i) - 0.5) * 5
        const rSize = 1.5 + r(7 + i) * 2.5
        ctx.fillStyle = rockColors[Math.floor(r(10 + i) * rockColors.length)]
        ctx.beginPath()
        ctx.ellipse(rx, ry, rSize, rSize * 0.6, r(13 + i) * 0.5, 0, Math.PI * 2)
        ctx.fill()
        // Rock highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)'
        ctx.beginPath()
        ctx.ellipse(rx - rSize * 0.2, ry - rSize * 0.15, rSize * 0.5, rSize * 0.25, 0, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Driftwood
    if (r(20) > 0.65) {
      const dwx = screenX + (r(21) - 0.5) * 8
      const dwy = screenY + (r(22) - 0.5) * 3
      const dwAngle = r(23) * 0.8 - 0.4
      ctx.save()
      ctx.translate(dwx, dwy)
      ctx.rotate(dwAngle)
      ctx.fillStyle = '#9e8c6c'
      ctx.fillRect(-4, -0.8, 8, 1.6)
      ctx.fillStyle = '#b5a080'
      ctx.fillRect(-4, -0.8, 8, 0.6)
      // Knot
      ctx.fillStyle = '#7c6c50'
      ctx.beginPath()
      ctx.arc(1, 0, 0.6, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    // Tide foam at edges
    if (r(30) > 0.4) {
      const foamPhase = Math.sin(time * 0.0015 + tileX * 0.6 + tileY * 0.4) * 2
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.moveTo(screenX - 6, screenY + hh - 1 + foamPhase)
      ctx.quadraticCurveTo(screenX - 2, screenY + hh - 2.5 + foamPhase, screenX + 2, screenY + hh - 1 + foamPhase)
      ctx.quadraticCurveTo(screenX + 5, screenY + hh + 0.5 + foamPhase, screenX + 8, screenY + hh - 1 + foamPhase)
      ctx.stroke()
    }

    // Barnacles on rocks
    if (r(40) > 0.6) {
      ctx.fillStyle = 'rgba(200,190,170,0.5)'
      for (let b = 0; b < 4; b++) {
        ctx.beginPath()
        ctx.arc(screenX + (r(41 + b) - 0.5) * 10, screenY + (r(45 + b) - 0.5) * 4, 0.4 + r(49 + b) * 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

function drawPlayer(
  ctx: CanvasRenderingContext2D, screenX: number, screenY: number, time: number,
  biome?: BiomeType, facing: 'left' | 'right' = 'right', isMoving = true, idleDuration = 0,
) {
  if (!isFinite(screenX) || !isFinite(screenY) || !isFinite(time)) return

  const dir = facing === 'left' ? -1 : 1

  // Movement-dependent animation
  let bob: number, legPhase: number, armSwing: number
  if (isMoving) {
    bob = Math.sin(time * 0.008) * 2
    legPhase = Math.sin(time * 0.01) * 1.5
    armSwing = Math.sin(time * 0.01) * 3
  } else {
    // Idle: gentle breathing and occasional look-around
    bob = Math.sin(time * 0.002) * 0.6
    legPhase = 0
    const lookCycle = Math.sin(time * 0.0008)
    armSwing = lookCycle * 0.3
  }

  const py = screenY + bob

  // Binoculars idle: after 2 seconds idle, ranger raises binoculars
  const binoUp = !isMoving && idleDuration > 2000
  const binoLift = binoUp ? Math.min(1, (idleDuration - 2000) / 600) : 0

  // Terrain interaction particles
  if (biome === 'forest' || biome === 'grassland') {
    for (let g = 0; g < 4; g++) {
      const gPhase = time * 0.004 + g * 1.5
      const gx = screenX + Math.sin(gPhase) * 8 - 4
      const gy = screenY + Math.cos(gPhase * 0.7) * 3
      const gAlpha = (Math.sin(gPhase * 0.5) + 1) * (isMoving ? 0.15 : 0.06)
      ctx.fillStyle = biome === 'forest'
        ? `rgba(34,197,94,${gAlpha})`
        : `rgba(132,204,22,${gAlpha})`
      ctx.beginPath()
      ctx.ellipse(gx, gy, 2, 1, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (biome === 'beach') {
    const pPhase = time * 0.003
    const pAlpha = (Math.sin(pPhase) + 1) * (isMoving ? 0.1 : 0.04)
    ctx.fillStyle = `rgba(234,179,8,${pAlpha})`
    ctx.beginPath()
    ctx.ellipse(screenX + Math.sin(pPhase) * 5, screenY + 1, 4, 2, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Player bloom
  const bloomColors = biome ? BIOME_COLORS[biome] : null
  const bloomColor = bloomColors ? bloomColors.top : '#4ade80'
  const bloom = ctx.createRadialGradient(screenX, py - 10, 0, screenX, py - 10, 28)
  bloom.addColorStop(0, 'rgba(74, 222, 128, 0.2)')
  bloom.addColorStop(0.4, hexToRgba(bloomColor, 0.1))
  bloom.addColorStop(1, 'rgba(74, 222, 128, 0)')
  ctx.fillStyle = bloom
  ctx.beginPath()
  ctx.arc(screenX, py - 10, 28, 0, Math.PI * 2)
  ctx.fill()

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(screenX, screenY + 2, 6 + bob * 0.3, 3 - bob * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  // -- Mirrored drawing via scale --
  ctx.save()
  ctx.translate(screenX, py)
  ctx.scale(dir, 1)

  // Legs
  ctx.fillStyle = '#1e3a5f'
  ctx.fillRect(-3, -6, 2, 4 + legPhase)
  ctx.fillRect(1, -6, 2, 4 - legPhase)
  // Boots with lace detail
  ctx.fillStyle = '#78350f'
  ctx.fillRect(-3, -2 + legPhase, 2.5, 2)
  ctx.fillRect(1, -2 - legPhase, 2.5, 2)
  ctx.fillStyle = '#92400e'
  ctx.fillRect(-2.5, -1.5 + legPhase, 1.5, 0.5)
  ctx.fillRect(1.5, -1.5 - legPhase, 1.5, 0.5)

  // Body — ranger vest over shirt
  ctx.fillStyle = '#f97316'
  ctx.fillRect(-4, -14, 8, 9)
  ctx.fillStyle = '#ea580c'
  ctx.fillRect(1, -14, 3, 9)
  // Vest overlay
  ctx.fillStyle = '#854d0e'
  ctx.fillRect(-4, -14, 2, 8)
  ctx.fillRect(2, -14, 2, 8)
  // Vest buttons
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(-0.5, -12, 1, 1)
  ctx.fillRect(-0.5, -9, 1, 1)

  // Belt
  ctx.fillStyle = '#713f12'
  ctx.fillRect(-4, -6, 8, 1.5)
  // Belt buckle
  ctx.fillStyle = '#d4a017'
  ctx.fillRect(-1, -6, 2, 1.5)

  // Back arm (farther from camera)
  const backArmY = -13 - armSwing
  ctx.fillStyle = '#fdba74'
  ctx.fillRect(-6, backArmY, 2, 6)
  // Sleeve cuff
  ctx.fillStyle = '#f97316'
  ctx.fillRect(-6, backArmY, 2, 1.5)

  // Backpack (on the back side)
  ctx.fillStyle = '#16a34a'
  ctx.fillRect(-6, -13, 3, 7)
  ctx.fillStyle = '#15803d'
  ctx.fillRect(-6, -13, 3, 1.5)
  // Backpack flap
  ctx.fillStyle = '#14532d'
  ctx.fillRect(-5.5, -12, 2, 0.5)
  // Backpack buckle
  ctx.fillStyle = '#fbbf24'
  ctx.fillRect(-5, -10.5, 1, 1)
  // Bedroll on top of backpack
  ctx.fillStyle = '#78716c'
  ctx.beginPath()
  ctx.ellipse(-4.5, -13.5, 1.5, 1, 0, 0, Math.PI * 2)
  ctx.fill()

  // Front arm
  const frontArmY = -13 + armSwing - binoLift * 5
  ctx.fillStyle = '#fdba74'
  ctx.fillRect(4, frontArmY, 2, 6 - binoLift * 2)
  ctx.fillStyle = '#f97316'
  ctx.fillRect(4, frontArmY, 2, 1.5)

  // Binoculars in hand (when idle and raised)
  if (binoLift > 0.1) {
    ctx.fillStyle = '#1c1917'
    ctx.fillRect(4.5, frontArmY + 5 - binoLift * 4, 2.5, 2)
    ctx.fillRect(4.5, frontArmY + 3.5 - binoLift * 4, 1, 1.5)
    ctx.fillRect(6, frontArmY + 3.5 - binoLift * 4, 1, 1.5)
    // Lens glint
    ctx.fillStyle = `rgba(147,197,253,${binoLift * 0.6})`
    ctx.fillRect(4.5, frontArmY + 3.5 - binoLift * 4, 0.5, 0.5)
  }

  // Head
  ctx.fillStyle = '#fdba74'
  ctx.fillRect(-3, -20, 6, 6)
  // Ear (visible side)
  ctx.fillStyle = '#f5c8a0'
  ctx.fillRect(3, -18, 1, 2)

  // Ranger hat — wide brim
  ctx.fillStyle = '#854d0e'
  ctx.fillRect(-5, -22, 10, 3)
  ctx.fillStyle = '#713f12'
  ctx.fillRect(-4, -22, 8, 1)
  // Wider brim
  ctx.fillStyle = '#92400e'
  ctx.fillRect(-6, -20, 12, 1.5)
  // Hat band
  ctx.fillStyle = '#16a34a'
  ctx.fillRect(-5, -20.5, 10, 1)

  // Eyes — blink every ~4 seconds
  const blinkCycle = time * 0.001
  const blink = Math.sin(blinkCycle * 1.57) > 0.98
  if (!blink) {
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(-2, -18, 1.5, 1.5)
    ctx.fillRect(1, -18, 1.5, 1.5)
    // Eye shine
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(-1.5, -18, 0.5, 0.5)
    ctx.fillRect(1.5, -18, 0.5, 0.5)
  } else {
    // Closed eyes
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(-2, -17, 1.5, 0.5)
    ctx.fillRect(1, -17, 1.5, 0.5)
  }

  // Mouth — slight smile when idle
  ctx.fillStyle = '#92400e'
  if (!isMoving && idleDuration > 500) {
    ctx.fillRect(-1, -15.5, 2, 0.5)
    ctx.fillRect(-0.5, -15, 1, 0.5)
  } else {
    ctx.fillRect(-0.5, -15.5, 1, 0.5)
  }

  ctx.restore()
}

// Helper to convert hex to rgba
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function drawRanger(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, time: number) {
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)'
  ctx.beginPath()
  ctx.ellipse(screenX, screenY + 2, 6, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Body (green ranger uniform)
  ctx.fillStyle = '#166534'
  ctx.fillRect(screenX - 4, screenY - 14, 8, 10)

  // Head
  ctx.fillStyle = '#d4a574'
  ctx.fillRect(screenX - 3, screenY - 20, 6, 6)

  // Ranger hat (wide brim)
  ctx.fillStyle = '#92400e'
  ctx.fillRect(screenX - 6, screenY - 22, 12, 3)
  ctx.fillStyle = '#78350f'
  ctx.fillRect(screenX - 3, screenY - 24, 6, 3)

  // Eyes
  ctx.fillStyle = '#1e293b'
  ctx.fillRect(screenX - 2, screenY - 18, 1, 1)
  ctx.fillRect(screenX + 1, screenY - 18, 1, 1)

  // Interaction indicator (floating exclamation)
  const bob = Math.sin(time * 0.004) * 3
  ctx.fillStyle = '#fbbf24'
  ctx.font = 'bold 10px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('!', screenX, screenY - 28 + bob)
}

function drawCreatureMarker(ctx: CanvasRenderingContext2D, screenX: number, screenY: number, time: number) {
  const bob = Math.sin(time * 0.003 + screenX) * 2
  const pulseAlpha = 0.6 + Math.sin(time * 0.005 + screenY) * 0.3
  const my = screenY - 12 + bob

  // Outer glow ring
  ctx.globalAlpha = pulseAlpha * 0.3
  const glow = ctx.createRadialGradient(screenX, my, 0, screenX, my, 7)
  glow.addColorStop(0, 'rgba(251,191,36,0.3)')
  glow.addColorStop(1, 'rgba(251,191,36,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(screenX, my, 7, 0, Math.PI * 2)
  ctx.fill()

  // Core dot
  ctx.globalAlpha = pulseAlpha
  ctx.fillStyle = '#fbbf24'
  ctx.beginPath()
  ctx.arc(screenX, my, 3, 0, Math.PI * 2)
  ctx.fill()

  // Bright center
  ctx.fillStyle = '#fef3c7'
  ctx.beginPath()
  ctx.arc(screenX, my, 1.2, 0, Math.PI * 2)
  ctx.fill()

  ctx.globalAlpha = 1
}

const IsometricRenderer = memo(function IsometricRenderer({ map, playerX, playerY, viewRadius = 12, rangers = [], timeOfDay = 'day', weather = 'clear', gameMinutes = 480 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bloomCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const dofCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const timeRef = useRef(0)
  // Player interpolation: smooth gliding between tiles
  const prevPosRef = useRef({ x: playerX, y: playerY, time: 0 })
  const interpRef = useRef({ fromX: playerX, fromY: playerY, toX: playerX, toY: playerY, t: 1 })
  const facingRef = useRef<'left' | 'right'>('right')
  const idleStartRef = useRef(0)
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const terrainCacheRef = useRef({
    valid: false, frame: 0,
    playerX: 0, playerY: 0,
    offsetX: 0, offsetY: 0,
    tod: 'day' as TimeOfDay, weather: 'clear' as WeatherType,
    canvasW: 0, canvasH: 0,
  })

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height

    // === PLAYER INTERPOLATION ===
    const now = performance.now()
    if (playerX !== prevPosRef.current.x || playerY !== prevPosRef.current.y) {
      const dx = playerX - prevPosRef.current.x
      if (dx !== 0) facingRef.current = dx > 0 ? 'right' : 'left'
      idleStartRef.current = now
      interpRef.current = {
        fromX: interpRef.current.t < 1
          ? interpRef.current.fromX + (interpRef.current.toX - interpRef.current.fromX) * interpRef.current.t
          : prevPosRef.current.x,
        fromY: interpRef.current.t < 1
          ? interpRef.current.fromY + (interpRef.current.toY - interpRef.current.fromY) * interpRef.current.t
          : prevPosRef.current.y,
        toX: playerX, toY: playerY, t: 0,
      }
      prevPosRef.current = { x: playerX, y: playerY, time: now }
    }
    // Smooth lerp over 120ms
    const elapsed = now - prevPosRef.current.time
    interpRef.current.t = Math.min(1, elapsed / 120)
    const easedT = interpRef.current.t < 1
      ? interpRef.current.t * (2 - interpRef.current.t) // ease-out quad
      : 1
    const smoothX = interpRef.current.fromX + (interpRef.current.toX - interpRef.current.fromX) * easedT
    const smoothY = interpRef.current.fromY + (interpRef.current.toY - interpRef.current.fromY) * easedT

    // Smooth continuous lighting from game-minutes
    const smoothLight = lerpLighting(gameMinutes ?? (timeOfDay === 'night' ? 0 : timeOfDay === 'dawn' ? 360 : timeOfDay === 'dusk' ? 1080 : 720))

    // Time-aware skybox gradient
    const lighting = TIME_LIGHTING[timeOfDay]
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6)
    skyGrad.addColorStop(0, lighting.skyGradient[0])
    skyGrad.addColorStop(0.5, lighting.skyGradient[1])
    skyGrad.addColorStop(1, lighting.skyGradient[2])
    ctx.fillStyle = skyGrad
    ctx.fillRect(0, 0, w, h)

    // Sun/moon glow
    if (lighting.sunMoon) {
      const sm = lighting.sunMoon
      const sunX = w * 0.75
      const sunY = h * sm.y
      const glowGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80)
      glowGrad.addColorStop(0, sm.glow)
      glowGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = glowGrad
      ctx.fillRect(sunX - 80, sunY - 80, 160, 160)
    }

    // Center camera on interpolated player position (1.2x zoom)
    const zoom = 1.2
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.scale(zoom, zoom)
    ctx.translate(-w / 2, -h / 2)

    const [camX, camY] = toIso(smoothX, smoothY)
    const offsetX = w / 2 - camX
    const offsetY = h / 2 - camY + 30

    timeRef.current = performance.now()
    const t = timeRef.current

    // === PARALLAX BACKGROUND LAYERS ===
    // Three layers behind the terrain: far mountains, mid hills, drifting clouds.
    // Each scrolls at a fraction of the camera offset for depth perception.
    const parallaxBaseX = -camX * 0.08
    const parallaxBaseY = -camY * 0.08

    // --- Far mountain range (20% parallax) ---
    const mtY = h * 0.28 + parallaxBaseY * 0.2
    // Smooth mountain silhouette colors based on lighting
    const mtBlend = smoothLight.tintA / 0.25
    const mtR1 = Math.round(55 - mtBlend * 43 + (smoothLight.tintR / 255) * 30)
    const mtG1 = Math.round(65 - mtBlend * 36 + (smoothLight.tintG / 255) * 10)
    const mtB1 = Math.round(81 - mtBlend * 44 + (smoothLight.tintB / 255) * 20)
    const mtR2 = Math.round(75 - mtBlend * 58 + (smoothLight.tintR / 255) * 35)
    const mtG2 = Math.round(85 - mtBlend * 56 + (smoothLight.tintG / 255) * 15)
    const mtB2 = Math.round(99 - mtBlend * 46 + (smoothLight.tintB / 255) * 25)
    const mtColors = [
      `rgb(${Math.max(0, Math.min(255, mtR1))},${Math.max(0, Math.min(255, mtG1))},${Math.max(0, Math.min(255, mtB1))})`,
      `rgb(${Math.max(0, Math.min(255, mtR2))},${Math.max(0, Math.min(255, mtG2))},${Math.max(0, Math.min(255, mtB2))})`
    ]
    ctx.fillStyle = mtColors[0]
    ctx.beginPath()
    ctx.moveTo(-50 + parallaxBaseX * 0.2, mtY + 60)
    const mtPeaks = [
      [0.05, 0.7], [0.12, 0.3], [0.2, 0.55], [0.28, 0.15], [0.36, 0.45],
      [0.44, 0.08], [0.52, 0.38], [0.6, 0.2], [0.68, 0.5], [0.76, 0.12],
      [0.84, 0.42], [0.92, 0.25], [1.0, 0.6],
    ]
    for (const [px, py] of mtPeaks) {
      ctx.lineTo(w * px + parallaxBaseX * 0.2, mtY - py * 50)
    }
    ctx.lineTo(w + 50 + parallaxBaseX * 0.2, mtY + 60)
    ctx.closePath()
    ctx.fill()
    // Snow caps on tallest peaks
    if (timeOfDay !== 'night') {
      ctx.fillStyle = timeOfDay === 'dusk' ? 'rgba(255,200,180,0.3)' : 'rgba(241,245,249,0.4)'
      for (const [px, py] of mtPeaks) {
        if (py < 0.25) {
          const peakX = w * px + parallaxBaseX * 0.2
          const peakY = mtY - py * 50
          ctx.beginPath()
          ctx.moveTo(peakX, peakY)
          ctx.lineTo(peakX - 8, peakY + 8)
          ctx.lineTo(peakX + 8, peakY + 8)
          ctx.closePath()
          ctx.fill()
        }
      }
    }

    // --- Mid hills (40% parallax) ---
    const hillY = h * 0.34 + parallaxBaseY * 0.4
    const hillColors = timeOfDay === 'night'
      ? '#0f1f30'
      : timeOfDay === 'dusk'
        ? '#553548'
        : timeOfDay === 'dawn'
          ? '#6a4a52'
          : '#1e3a2f'
    ctx.fillStyle = hillColors
    ctx.beginPath()
    ctx.moveTo(-50 + parallaxBaseX * 0.4, hillY + 50)
    const hillPeaks = [
      [0.0, 0.5], [0.08, 0.3], [0.16, 0.6], [0.24, 0.15], [0.32, 0.45],
      [0.4, 0.25], [0.5, 0.55], [0.58, 0.1], [0.66, 0.4], [0.74, 0.2],
      [0.82, 0.5], [0.9, 0.3], [1.0, 0.55],
    ]
    for (const [px, py] of hillPeaks) {
      ctx.lineTo(w * px + parallaxBaseX * 0.4, hillY - py * 30)
    }
    ctx.lineTo(w + 50 + parallaxBaseX * 0.4, hillY + 50)
    ctx.closePath()
    ctx.fill()
    // Treeline silhouette on mid hills
    if (timeOfDay !== 'night') {
      ctx.fillStyle = timeOfDay === 'dusk' ? '#3a2030' : timeOfDay === 'dawn' ? '#4a3040' : '#15302a'
      for (let ti = 0; ti < 25; ti++) {
        const seed = seededRand(ti, 0, 200)
        const tx = w * (ti / 25) + parallaxBaseX * 0.4
        const baseHillPt = hillPeaks[Math.min(Math.floor(ti / 2), hillPeaks.length - 1)]
        const treeBase = hillY - (baseHillPt?.[1] ?? 0.3) * 30 + seed * 4
        const th = 4 + seed * 8
        ctx.beginPath()
        ctx.moveTo(tx, treeBase)
        ctx.lineTo(tx - 2, treeBase)
        ctx.lineTo(tx - 1, treeBase - th)
        ctx.lineTo(tx + 1, treeBase - th)
        ctx.lineTo(tx + 2, treeBase)
        ctx.closePath()
        ctx.fill()
      }
    }

    // --- Drifting clouds (independent of camera, move with time) ---
    if (timeOfDay !== 'night' && weather !== 'rain' && weather !== 'thunderstorm') {
      const cloudAlpha = weather === 'fog' ? 0.15 : weather === 'sunny' ? 0.08 : 0.12
      ctx.globalAlpha = cloudAlpha
      ctx.fillStyle = timeOfDay === 'dusk' ? '#e8a090' : timeOfDay === 'dawn' ? '#f0b8a0' : '#e2e8f0'
      for (let ci = 0; ci < 6; ci++) {
        const seed = seededRand(ci, 0, 300)
        const cx = ((t * 0.005 * (0.3 + seed * 0.4) + ci * w * 0.22) % (w + 200)) - 100
        const cy = h * 0.10 + seed * h * 0.15
        const cw = 40 + seed * 60
        const ch = 10 + seed * 12
        ctx.beginPath()
        ctx.ellipse(cx, cy, cw, ch, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(cx - cw * 0.3, cy + ch * 0.3, cw * 0.6, ch * 0.7, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(cx + cw * 0.4, cy + ch * 0.2, cw * 0.5, ch * 0.6, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // === TERRAIN LAYER CACHE ===
    // Tiles render to an offscreen canvas at reduced frequency (~10fps),
    // then composite at full 60fps with sub-pixel offset correction.
    // This cuts average draw calls by ~75%.
    const cache = terrainCacheRef.current
    cache.frame++
    if (!terrainCanvasRef.current) terrainCanvasRef.current = document.createElement('canvas')
    const terrainCanvas = terrainCanvasRef.current
    const tResize = terrainCanvas.width !== canvas.width || terrainCanvas.height !== canvas.height
    if (tResize) { terrainCanvas.width = canvas.width; terrainCanvas.height = canvas.height }

    const posChanged = cache.playerX !== playerX || cache.playerY !== playerY
    const terrainStale = (
      !cache.valid || posChanged || tResize
      || cache.tod !== timeOfDay || cache.weather !== weather
      || cache.frame % 6 === 0
    )

    if (terrainStale) {
      const dc = terrainCanvas.getContext('2d')!
      dc.setTransform(1, 0, 0, 1, 0, 0)
      dc.clearRect(0, 0, terrainCanvas.width, terrainCanvas.height)
      dc.scale(dpr, dpr)
      dc.save()
      dc.translate(w / 2, h / 2)
      dc.scale(zoom, zoom)
      dc.translate(-w / 2, -h / 2)

      // Viewport culling bounds (in pre-zoom CSS coordinate space)
      const zI = 1 / zoom
      const cullL = w * (1 - zI) / 2 - 80
      const cullR = w * (1 + zI) / 2 + 80
      const cullT = h * (1 - zI) / 2 - 120
      const cullB = h * (1 + zI) / 2 + 60

      const shadowDirX = timeOfDay === 'dawn' ? -1 : timeOfDay === 'dusk' ? 1 : 0
      const shadowDirY = timeOfDay === 'night' ? 0 : 1
      const shadowStrength = timeOfDay === 'night' ? 0 : timeOfDay === 'dawn' || timeOfDay === 'dusk' ? 0.22 : 0.15

      const minX = Math.max(0, playerX - viewRadius)
      const maxX = Math.min(map[0]?.length ?? 0, playerX + viewRadius)
      const minY = Math.max(0, playerY - viewRadius)
      const maxY = Math.min(map.length, playerY + viewRadius)

      for (let y = minY; y < maxY; y++) {
        for (let x = minX; x < maxX; x++) {
          const tile = map[y]?.[x]
          if (!tile) continue

          const [isoX, isoY] = toIso(x, y, tile.elevation)
          const screenX = isoX + offsetX
          const screenY = isoY + offsetY

          // Viewport culling — skip tiles outside visible bounds
          if (screenX < cullL || screenX > cullR || screenY < cullT || screenY > cullB) continue

          const dist = Math.sqrt((x - playerX) ** 2 + (y - playerY) ** 2)
          if (dist > viewRadius) continue

          const normDist = dist / viewRadius
          const fog = Math.max(0, Math.pow(1 - normDist, 1.6))
          dc.globalAlpha = fog

          const neighbors = {
            n: map[y - 1]?.[x]?.biome,
            s: map[y + 1]?.[x]?.biome,
            e: map[y]?.[x + 1]?.biome,
            w: map[y]?.[x - 1]?.biome,
          }

          drawTile(dc, screenX, screenY, tile.biome, tile.elevation, tile.hasCreature, x, y, timeRef.current, timeOfDay, neighbors)

          // Desaturate border-state tiles
          if (tile.borderState) {
            dc.globalAlpha = 0.35
            dc.fillStyle = '#8b8b8b'
            const bw = TILE_WIDTH / 2, bh = TILE_HEIGHT / 2
            dc.beginPath()
            dc.moveTo(screenX, screenY - bh)
            dc.lineTo(screenX + bw, screenY)
            dc.lineTo(screenX, screenY + bh)
            dc.lineTo(screenX - bw, screenY)
            dc.closePath()
            dc.fill()
            dc.globalAlpha = 1
          }

          if (shadowStrength > 0 && tile.biome !== 'water') {
            const casterX = x - shadowDirX
            const casterY = y - shadowDirY
            const caster = map[casterY]?.[casterX]
            if (caster && caster.elevation > tile.elevation) {
              const elevDiff = caster.elevation - tile.elevation
              const intensity = Math.min(shadowStrength * elevDiff, 0.35)
              dc.fillStyle = `rgba(0,0,0,${intensity * fog})`
              const shw = TILE_WIDTH / 2
              const shh = TILE_HEIGHT / 2
              dc.beginPath()
              dc.moveTo(screenX, screenY - shh)
              dc.lineTo(screenX + shw, screenY)
              dc.lineTo(screenX, screenY + shh)
              dc.lineTo(screenX - shw, screenY)
              dc.closePath()
              dc.fill()
            }
            const diagX = x - shadowDirX - (shadowDirY !== 0 ? 0 : 1)
            const diagY = y - shadowDirY - (shadowDirX !== 0 ? 0 : 1)
            const diag = map[diagY]?.[diagX]
            if (diag && diag.elevation > tile.elevation + 1) {
              const intensity = Math.min(shadowStrength * 0.5, 0.15)
              dc.fillStyle = `rgba(0,0,0,${intensity * fog})`
              const shw = TILE_WIDTH / 2
              const shh = TILE_HEIGHT / 2
              dc.beginPath()
              dc.moveTo(screenX, screenY - shh)
              dc.lineTo(screenX + shw, screenY)
              dc.lineTo(screenX, screenY + shh)
              dc.lineTo(screenX - shw, screenY)
              dc.closePath()
              dc.fill()
            }
          }

          // State border line — dashed amber line between CA and neighboring states
          if (!tile.borderState) {
            const hw = TILE_WIDTH / 2, hh = TILE_HEIGHT / 2
            dc.save()
            dc.setLineDash([4, 3])
            dc.strokeStyle = 'rgba(245,158,11,0.7)'
            dc.lineWidth = 1.5
            const eNeighbor = map[y]?.[x + 1]
            const sNeighbor = map[y + 1]?.[x]
            const nNeighbor = map[y - 1]?.[x]
            if (eNeighbor?.borderState) {
              dc.beginPath()
              dc.moveTo(screenX + hw, screenY)
              dc.lineTo(screenX, screenY + hh)
              dc.stroke()
            }
            if (sNeighbor?.borderState) {
              dc.beginPath()
              dc.moveTo(screenX, screenY + hh)
              dc.lineTo(screenX - hw, screenY)
              dc.stroke()
            }
            if (nNeighbor?.borderState) {
              dc.beginPath()
              dc.moveTo(screenX, screenY - hh)
              dc.lineTo(screenX + hw, screenY)
              dc.stroke()
            }
            dc.restore()
          }

          if (tile.bridge) {
            drawBridge(dc, screenX, screenY, tile.bridge, tile.elevation, timeRef.current, timeOfDay)
          }

          if (tile.boatDock) {
            const dockY = screenY - tile.elevation * TILE_DEPTH
            const bob = Math.sin(timeRef.current * 0.003 + x) * 2
            dc.fillStyle = '#8B6914'
            dc.fillRect(screenX - 6, dockY - 4 + bob, 12, 4)
            dc.fillRect(screenX - 3, dockY - 8 + bob, 6, 4)
            dc.font = '10px serif'
            dc.textAlign = 'center'
            dc.fillText('⛴', screenX, dockY - 10 + bob)
            dc.beginPath()
            dc.arc(screenX, dockY - 6, 10 + Math.sin(timeRef.current * 0.004) * 2, 0, Math.PI * 2)
            dc.strokeStyle = `rgba(56, 189, 248, ${0.3 + Math.sin(timeRef.current * 0.005) * 0.15})`
            dc.lineWidth = 1
            dc.stroke()
          }

          const bartStation = getBartStationAt(x, y)
          if (bartStation) {
            const bY = screenY - tile.elevation * TILE_DEPTH
            dc.fillStyle = 'rgba(234,179,8,0.25)'
            dc.beginPath()
            dc.roundRect(screenX - 7, bY - 12, 14, 8, 2)
            dc.fill()
            dc.strokeStyle = 'rgba(234,179,8,0.5)'
            dc.lineWidth = 0.8
            dc.stroke()
            dc.font = 'bold 6px system-ui'
            dc.textAlign = 'center'
            dc.fillStyle = '#eab308'
            dc.fillText('BART', screenX, bY - 6)
            const pulse = Math.sin(timeRef.current * 0.004 + x * 0.5) * 0.15
            dc.beginPath()
            dc.arc(screenX, bY - 8, 10 + Math.sin(timeRef.current * 0.003) * 2, 0, Math.PI * 2)
            dc.strokeStyle = `rgba(234,179,8,${0.2 + pulse})`
            dc.lineWidth = 0.8
            dc.stroke()
          }

          if (tile.subregion === 'Alcatraz Island' && !tile.boatDock) {
            const alY = screenY - tile.elevation * TILE_DEPTH
            dc.fillStyle = '#9ca3af'
            dc.fillRect(screenX - 4, alY - 10, 8, 6)
            dc.fillStyle = '#6b7280'
            dc.fillRect(screenX - 4, alY - 12, 8, 2)
            dc.fillStyle = '#fbbf24'
            dc.fillRect(screenX - 1, alY - 8, 2, 2)
          }
          if (tile.subregion === 'Angel Island' && !tile.boatDock) {
            const aiY = screenY - tile.elevation * TILE_DEPTH
            const treeHash = seededRand(x, y, 55)
            if (treeHash > 0.4) {
              dc.fillStyle = '#166534'
              dc.beginPath()
              dc.moveTo(screenX, aiY - 14)
              dc.lineTo(screenX - 4, aiY - 4)
              dc.lineTo(screenX + 4, aiY - 4)
              dc.closePath()
              dc.fill()
              dc.fillStyle = '#78350f'
              dc.fillRect(screenX - 1, aiY - 4, 2, 4)
            } else {
              dc.fillStyle = '#854d0e'
              dc.fillRect(screenX - 3, aiY - 8, 6, 5)
              dc.fillStyle = '#a16207'
              dc.fillRect(screenX - 4, aiY - 9, 8, 1)
            }
          }
          if (tile.subregion === 'Treasure Island' && !tile.boatDock) {
            const tiY = screenY - tile.elevation * TILE_DEPTH
            dc.fillStyle = '#475569'
            dc.fillRect(screenX - 3, tiY - 10, 6, 7)
            dc.fillStyle = '#334155'
            dc.fillRect(screenX - 3, tiY - 11, 6, 1)
            dc.strokeStyle = '#94a3b8'
            dc.lineWidth = 0.5
            dc.beginPath()
            dc.moveTo(screenX, tiY - 11)
            dc.lineTo(screenX, tiY - 16)
            dc.stroke()
            if (Math.sin(timeRef.current * 0.005 + x) > 0.5) {
              dc.fillStyle = '#ef4444'
              dc.beginPath()
              dc.arc(screenX, tiY - 16, 1, 0, Math.PI * 2)
              dc.fill()
            }
          }

          drawLandmark(dc, screenX, screenY, tile, x, y, timeRef.current, timeOfDay)

          // Border signpost
          const signpost = getSignpostAt(x, y)
          if (signpost) {
            const spY = screenY - tile.elevation * TILE_DEPTH
            dc.fillStyle = '#065f46'
            dc.fillRect(screenX - 1, spY - 20, 2, 20)
            dc.fillStyle = '#065f46'
            dc.beginPath()
            dc.roundRect(screenX - 10, spY - 28, 20, 10, 2)
            dc.fill()
            dc.fillStyle = '#fbbf24'
            dc.font = '6px monospace'
            dc.textAlign = 'center'
            dc.fillText('CA', screenX, spY - 21)
          }

          if (tile.hasCreature && tile.biome !== 'water') {
            drawCreatureMarker(dc, screenX, screenY - tile.elevation * TILE_DEPTH, timeRef.current)
          }

          if (dist > viewRadius * 0.45) {
            const fogIntensity = (dist - viewRadius * 0.45) / (viewRadius * 0.55)
            dc.globalAlpha = fogIntensity * 0.35
            dc.fillStyle = BIOME_COLORS[tile.biome].dark
            const fhw = TILE_WIDTH / 2
            const fhh = TILE_HEIGHT / 2
            dc.beginPath()
            dc.moveTo(screenX, screenY - fhh)
            dc.lineTo(screenX + fhw, screenY)
            dc.lineTo(screenX, screenY + fhh)
            dc.lineTo(screenX - fhw, screenY)
            dc.closePath()
            dc.fill()
          }

          dc.globalAlpha = 1
        }
      }

      dc.restore()
      dc.setTransform(1, 0, 0, 1, 0, 0)

      cache.valid = true
      cache.playerX = playerX
      cache.playerY = playerY
      cache.offsetX = offsetX
      cache.offsetY = offsetY
      cache.tod = timeOfDay
      cache.weather = weather
      cache.canvasW = canvas.width
      cache.canvasH = canvas.height
    }

    // Composite cached terrain layer with sub-pixel offset correction
    {
      const tdx = (offsetX - cache.offsetX) * zoom * dpr
      const tdy = (offsetY - cache.offsetY) * zoom * dpr
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.drawImage(terrainCanvas, tdx, tdy)
      ctx.restore()
    }

    // Draw rangers with activity visuals
    for (const ranger of rangers) {
      const dist = Math.sqrt((ranger.x - playerX) ** 2 + (ranger.y - playerY) ** 2)
      if (dist > viewRadius) continue

      const rangerTile = map[ranger.y]?.[ranger.x]
      const rangerElev = rangerTile?.elevation ?? 0
      const [rx, ry] = toIso(ranger.x, ranger.y, rangerElev)
      const fog = Math.max(0, 1 - (dist / viewRadius) * 0.7)
      const rsx = rx + offsetX
      const rsy = ry + offsetY
      const act = ranger.activity ?? 'patrol'

      // Campfire glow behind ranger
      if (act === 'campfire') {
        ctx.globalAlpha = fog * (0.3 + Math.sin(t * 0.004) * 0.1)
        const fireGlow = ctx.createRadialGradient(rsx, rsy + 6, 0, rsx, rsy + 6, 30)
        fireGlow.addColorStop(0, 'rgba(255,140,20,0.5)')
        fireGlow.addColorStop(0.4, 'rgba(255,80,10,0.2)')
        fireGlow.addColorStop(1, 'rgba(255,60,0,0)')
        ctx.fillStyle = fireGlow
        ctx.fillRect(rsx - 30, rsy - 24, 60, 60)
        // Fire sprite
        ctx.globalAlpha = fog
        ctx.font = '8px serif'
        ctx.textAlign = 'center'
        const fireFrame = Math.floor(t * 0.005) % 2
        ctx.fillText(fireFrame ? '🔥' : '🪵', rsx + 8, rsy + 10)
      }

      // Draw the ranger (sleeping rangers drawn slightly lower, semi-transparent)
      ctx.globalAlpha = act === 'rest' ? fog * 0.6 : fog
      drawRanger(ctx, rsx, rsy, timeRef.current)

      // Activity indicator above ranger
      ctx.globalAlpha = fog * 0.9
      ctx.font = '7px sans-serif'
      ctx.textAlign = 'center'
      if (act === 'rest') {
        const zzz = 'z'.repeat(1 + Math.floor(t * 0.002) % 3)
        ctx.fillStyle = '#93c5fd'
        ctx.globalAlpha = fog * (0.5 + Math.sin(t * 0.003) * 0.2)
        ctx.fillText(zzz, rsx + 6 + Math.sin(t * 0.002) * 3, rsy - 26 - Math.sin(t * 0.0015) * 4)
      } else if (act === 'observe') {
        ctx.fillText('🔭', rsx + 7, rsy - 24)
      } else if (act === 'fishing') {
        ctx.fillText('🎣', rsx + 7, rsy - 24)
      } else if (act === 'research') {
        ctx.fillText('📋', rsx + 7, rsy - 24)
      }
      ctx.globalAlpha = 1
    }

    // Draw player at interpolated position
    const playerTile = map[playerY]?.[playerX]
    const playerElevation = playerTile?.elevation ?? 0
    // Use smooth interpolated position for fluid movement
    const prevTile = map[Math.round(interpRef.current.fromY)]?.[Math.round(interpRef.current.fromX)]
    const prevElev = prevTile?.elevation ?? playerElevation
    const lerpElev = prevElev + (playerElevation - prevElev) * easedT
    const [playerIsoX, playerIsoY] = toIso(smoothX, smoothY, lerpElev)
    const isMoving = interpRef.current.t < 0.95
    const idleDuration = isMoving ? 0 : (now - idleStartRef.current)
    drawPlayer(ctx, playerIsoX + offsetX, playerIsoY + offsetY, timeRef.current, playerTile?.biome, facingRef.current, isMoving, idleDuration)

    // Ambient floating particles — more at night, colored by time
    const particleCount = timeOfDay === 'night' ? 18 : 12
    for (let i = 0; i < particleCount; i++) {
      const seed = seededRand(i, 0, 99)
      const px = (playerIsoX + offsetX) + Math.sin(t * 0.0008 + seed * 6.28) * 60 + (seed - 0.5) * 80
      const py = (playerIsoY + offsetY) + Math.cos(t * 0.001 + seed * 4.5) * 40 + (seed - 0.5) * 60
      const particleAlpha = 0.15 + Math.sin(t * 0.002 + i * 1.3) * 0.1
      ctx.globalAlpha = particleAlpha
      ctx.fillStyle = lighting.particleColor
      const particleSize = 0.8 + seed * 1.2
      ctx.beginPath()
      ctx.arc(px, py, particleSize, 0, Math.PI * 2)
      ctx.fill()
    }

    // === FIREFLIES AT NIGHT ===
    if (smoothLight.tintA > 0.15) {
      const fireflyCount = Math.round((smoothLight.tintA - 0.15) * 80)
      for (let i = 0; i < fireflyCount; i++) {
        const seed = seededRand(i, 7, 42)
        const seed2 = seededRand(i, 8, 13)
        const wanderX = (playerIsoX + offsetX) + Math.sin(t * 0.0004 * (0.5 + seed) + seed * 6.28) * 100 + (seed - 0.5) * 120
        const wanderY = (playerIsoY + offsetY) + Math.cos(t * 0.0005 * (0.5 + seed2) + seed2 * 5) * 70 + (seed2 - 0.5) * 80
        // Pulsing bioluminescence
        const pulse = Math.sin(t * 0.003 * (0.8 + seed * 0.4) + i * 2.1)
        const brightness = Math.max(0, pulse)
        if (brightness < 0.1) continue
        const sz = 1 + seed * 1.5
        // Warm yellow-green glow
        ctx.globalAlpha = brightness * 0.7 * (smoothLight.tintA / 0.25)
        const glow = ctx.createRadialGradient(wanderX, wanderY, 0, wanderX, wanderY, sz * 4)
        glow.addColorStop(0, `rgba(200,255,100,${brightness * 0.5})`)
        glow.addColorStop(0.5, `rgba(180,240,60,${brightness * 0.15})`)
        glow.addColorStop(1, 'rgba(150,220,40,0)')
        ctx.fillStyle = glow
        ctx.fillRect(wanderX - sz * 4, wanderY - sz * 4, sz * 8, sz * 8)
        // Bright core
        ctx.globalAlpha = brightness * 0.9
        ctx.fillStyle = '#e4ff70'
        ctx.beginPath()
        ctx.arc(wanderX, wanderY, sz * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // === MIGRATING HERDS ===
    for (const herd of MIGRATION_HERDS) {
      const positions = getHerdPositions(herd, gameMinutes, timeOfDay)
      if (!positions) continue
      for (const pos of positions) {
        // Only render if in view
        const dx = pos.x - playerX
        const dy = pos.y - playerY
        if (Math.abs(dx) > viewRadius + 2 || Math.abs(dy) > viewRadius + 2) continue
        const [hIsoX, hIsoY] = toIso(pos.x, pos.y, 1)
        const hScreenX = hIsoX + offsetX
        const hScreenY = hIsoY + offsetY
        // Bobbing animation
        const bob = Math.sin(t * 0.003 + pos.x * 0.5 + pos.y * 0.7) * 3
        ctx.globalAlpha = 0.85
        ctx.font = '14px serif'
        ctx.textAlign = 'center'
        ctx.fillText(herd.sprite, hScreenX, hScreenY - 8 + bob)
        // Subtle dust trail
        ctx.globalAlpha = 0.15
        ctx.fillStyle = '#d4a574'
        ctx.beginPath()
        ctx.arc(hScreenX - 3, hScreenY + 2, 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // === LANDMARK AMBIENT EFFECTS ===
    // Check if player is near a landmark (within ~5 tiles)
    for (const lm of LANDMARKS) {
      const dx = lm.x - playerX
      const dy = lm.y - playerY
      if (dx * dx + dy * dy > 36) continue // skip if too far (6-tile radius)
      const [lmIsoX, lmIsoY] = toIso(lm.x, lm.y, 0)
      const lmScreenX = lmIsoX + offsetX
      const lmScreenY = lmIsoY + offsetY

      if (lm.name === 'Muir Woods') {
        // Fireflies — small golden orbs floating upward
        for (let i = 0; i < (timeOfDay === 'night' || timeOfDay === 'dusk' ? 12 : 4); i++) {
          const seed = seededRand(i, 33, 77)
          const fx = lmScreenX + Math.sin(t * 0.001 + seed * 5) * 40 + (seed - 0.5) * 50
          const fy = lmScreenY + Math.cos(t * 0.0013 + seed * 3) * 30 - seed * 20
          const glow = 0.3 + Math.sin(t * 0.004 + i * 1.7) * 0.25
          ctx.globalAlpha = glow
          ctx.fillStyle = '#fde047'
          ctx.beginPath()
          ctx.arc(fx, fy, 1.5, 0, Math.PI * 2)
          ctx.fill()
          // Glow halo
          ctx.globalAlpha = glow * 0.3
          ctx.beginPath()
          ctx.arc(fx, fy, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (lm.name === 'Twin Peaks' || lm.name === 'Mt. Tamalpais') {
        // Fog wisps — translucent white streaks drifting
        for (let i = 0; i < 6; i++) {
          const seed = seededRand(i, 44, 88)
          const fogX = lmScreenX + Math.sin(t * 0.0005 + seed * 4) * 50 + (seed - 0.5) * 60
          const fogY = lmScreenY - 10 + seed * 20
          const fogAlpha = (timeOfDay === 'night' || timeOfDay === 'dusk' ? 0.08 : 0.04) + Math.sin(t * 0.001 + i * 2) * 0.03
          ctx.globalAlpha = fogAlpha
          ctx.fillStyle = 'white'
          ctx.beginPath()
          ctx.ellipse(fogX, fogY, 20 + seed * 15, 3 + seed * 3, 0, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (lm.name === 'Salesforce Tower') {
        // LED crown pulse — colored light at the top
        if (timeOfDay === 'night' || timeOfDay === 'dusk') {
          const pulse = Math.sin(t * 0.003) * 0.5 + 0.5
          const hue = (t * 0.02) % 360
          ctx.globalAlpha = 0.15 + pulse * 0.15
          ctx.fillStyle = `hsl(${hue}, 70%, 60%)`
          ctx.beginPath()
          ctx.arc(lmScreenX, lmScreenY - 35, 6, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 0.05 + pulse * 0.05
          ctx.beginPath()
          ctx.arc(lmScreenX, lmScreenY - 35, 15, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (lm.name === 'Tesla') {
        // Electric sparks — small blue-white flashes
        for (let i = 0; i < 4; i++) {
          const seed = seededRand(i, 55, 99)
          const sparkPhase = (t * 0.005 + i * 1.5) % 3
          if (sparkPhase < 0.3) {
            const sx = lmScreenX + (seed - 0.5) * 30
            const sy = lmScreenY - seed * 15
            ctx.globalAlpha = 0.6 - sparkPhase * 2
            ctx.fillStyle = '#60a5fa'
            ctx.beginPath()
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 0.2
            ctx.strokeStyle = '#93c5fd'
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(sx, sy)
            ctx.lineTo(sx + (seed - 0.5) * 8, sy - 4)
            ctx.stroke()
          }
        }
      } else if (lm.name === "Fisherman's Wharf") {
        // Seagull silhouettes circling
        for (let i = 0; i < 3; i++) {
          const angle = (t * 0.0008 + i * 2.1)
          const gx = lmScreenX + Math.cos(angle) * (25 + i * 8)
          const gy = lmScreenY - 20 + Math.sin(angle * 0.7) * 8
          ctx.globalAlpha = 0.3
          ctx.fillStyle = timeOfDay === 'night' ? '#475569' : '#64748b'
          // Simple bird shape — V
          ctx.beginPath()
          ctx.moveTo(gx - 3, gy + 1)
          ctx.lineTo(gx, gy)
          ctx.lineTo(gx + 3, gy + 1)
          ctx.lineWidth = 0.8
          ctx.strokeStyle = ctx.fillStyle
          ctx.stroke()
        }
      } else if (lm.name === 'Steamer Lane') {
        // Rolling waves — animated blue arcs
        for (let i = 0; i < 5; i++) {
          const seed = seededRand(i, 66, 42)
          const waveX = lmScreenX + (i - 2) * 18 + Math.sin(t * 0.002 + i * 1.5) * 8
          const waveY = lmScreenY + 5 + seed * 6
          const wavePhase = (t * 0.003 + i * 1.2) % (Math.PI * 2)
          ctx.globalAlpha = 0.15 + Math.sin(wavePhase) * 0.08
          ctx.strokeStyle = '#22d3ee'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(waveX, waveY, 8 + seed * 5, Math.PI * 0.8, Math.PI * 0.2, true)
          ctx.stroke()
          // Spray at the curl
          if (Math.sin(wavePhase) > 0.5) {
            ctx.globalAlpha = 0.12
            ctx.fillStyle = '#ffffff'
            ctx.beginPath()
            ctx.arc(waveX + 6, waveY - 3, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
        // Surfer silhouette riding a wave
        const surferPhase = (t * 0.001) % (Math.PI * 2)
        const surferX = lmScreenX + Math.cos(surferPhase) * 20
        const surferY = lmScreenY + Math.sin(surferPhase * 2) * 4
        ctx.globalAlpha = 0.5
        ctx.font = '10px serif'
        ctx.textAlign = 'center'
        ctx.fillText('🏄', surferX, surferY)
      }
    }
    ctx.globalAlpha = 1

    // Night stars in the background void
    if (timeOfDay === 'night') {
      for (let i = 0; i < 30; i++) {
        const seed = seededRand(i, 1, 77)
        const sx = seed * w
        const sy = seededRand(i, 2, 77) * h * 0.4
        const twinkle = 0.2 + Math.sin(t * 0.002 + i * 2.1) * 0.15
        ctx.globalAlpha = twinkle
        ctx.fillStyle = seededRand(i, 3, 77) > 0.7 ? '#93c5fd' : '#ffffff'
        ctx.beginPath()
        ctx.arc(sx, sy, 0.5 + seededRand(i, 4, 77) * 0.5, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1

    // === DYNAMIC CLOUD SHADOWS ===
    // Large translucent shadow patches drift across the terrain,
    // driven by time and weather. Denser in overcast, absent at night.
    if (timeOfDay !== 'night') {
      const cloudShadowCount = weather === 'thunderstorm' ? 8 : weather === 'fog' ? 6 : weather === 'clear' || weather === 'sunny' ? 3 : 4
      const cloudShadowAlpha = weather === 'thunderstorm' ? 0.18 : weather === 'fog' ? 0.12 : weather === 'sunny' ? 0.06 : 0.09
      for (let ci = 0; ci < cloudShadowCount; ci++) {
        const seed = seededRand(ci, 0, 500)
        const driftSpeed = 0.008 + seed * 0.006
        const csx = ((t * driftSpeed + ci * 300 + seed * 600) % (w * 1.8)) - w * 0.3
        const csy = h * 0.2 + seed * h * 0.5 + Math.sin(t * 0.001 + ci * 2) * 20
        const csw = 80 + seed * 120
        const csh = 30 + seed * 40
        ctx.globalAlpha = cloudShadowAlpha + Math.sin(t * 0.0008 + ci * 1.5) * 0.03
        ctx.fillStyle = 'rgba(0,0,30,1)'
        ctx.beginPath()
        ctx.ellipse(csx, csy, csw, csh, 0.1, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.ellipse(csx + csw * 0.25, csy + csh * 0.3, csw * 0.7, csh * 0.6, -0.1, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
    }

    // === WEATHER PARTICLE EFFECTS ===
    if (weather === 'rain') {
      // Rain drops — diagonal falling lines with varying thickness
      for (let i = 0; i < 100; i++) {
        const seed = seededRand(i, 5, 88)
        const rx = seed * w
        const baseY = (t * 0.35 + i * 37) % (h + 40) - 20
        const dropLen = 8 + seed * 8
        ctx.globalAlpha = 0.12 + seed * 0.18
        ctx.strokeStyle = `rgba(150, 200, 255, ${0.3 + seed * 0.2})`
        ctx.lineWidth = 0.3 + seed * 0.4
        ctx.beginPath()
        ctx.moveTo(rx, baseY)
        ctx.lineTo(rx - 2, baseY + dropLen)
        ctx.stroke()
      }
      // Ground splashes — expanding rings
      for (let i = 0; i < 20; i++) {
        const seed = seededRand(i, 6, 44)
        const splashX = seed * w
        const splashY = h * 0.4 + seededRand(i, 7, 44) * h * 0.5
        const splashPhase = (t * 0.004 + i * 2.1) % (Math.PI * 2)
        if (splashPhase < Math.PI * 0.5) {
          const splashR = splashPhase * 3
          ctx.globalAlpha = 0.12 * (1 - splashPhase / (Math.PI * 0.5))
          ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)'
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(splashX, splashY, splashR, 0, Math.PI * 2)
          ctx.stroke()
        }
      }
    }

    if (weather === 'fog') {
      // Karl the Fog — rolling fog banks that drift across the scene
      // Large background fog layer
      for (let i = 0; i < 12; i++) {
        const seed = seededRand(i, 8, 33)
        const fogX = (seed * w + t * 0.012 * (0.3 + seed * 0.7)) % (w + 300) - 150
        const fogY = h * 0.2 + seed * h * 0.5
        const fogW = 150 + seed * 250
        const fogH = 40 + seed * 60
        const fogAlpha = 0.05 + Math.sin(t * 0.0008 + i * 1.7) * 0.025
        const grad = ctx.createRadialGradient(fogX, fogY, 0, fogX, fogY, fogW / 2)
        grad.addColorStop(0, `rgba(200, 210, 220, ${fogAlpha})`)
        grad.addColorStop(0.6, `rgba(190, 200, 215, ${fogAlpha * 0.5})`)
        grad.addColorStop(1, 'rgba(200, 210, 220, 0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = grad
        ctx.fillRect(fogX - fogW / 2, fogY - fogH / 2, fogW, fogH)
      }
      // Low-lying fog wisps near ground
      for (let i = 0; i < 15; i++) {
        const seed = seededRand(i, 13, 44)
        const wispX = (seed * w + t * 0.02 * (0.4 + seed)) % (w + 100) - 50
        const wispY = h * 0.5 + seed * h * 0.35
        ctx.globalAlpha = 0.03 + Math.sin(t * 0.001 + i * 2.3) * 0.015
        ctx.fillStyle = '#d1d5db'
        ctx.beginPath()
        ctx.ellipse(wispX, wispY, 30 + seed * 40, 5 + seed * 8, 0, 0, Math.PI * 2)
        ctx.fill()
      }
      // Overall fog tint
      ctx.globalAlpha = 0.06 + Math.sin(t * 0.0005) * 0.02
      ctx.fillStyle = '#e5e7eb'
      ctx.fillRect(0, 0, w, h)
    }

    if (weather === 'wind') {
      // Wind streaks — horizontal dashes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
      ctx.lineWidth = 0.5
      for (let i = 0; i < 25; i++) {
        const seed = seededRand(i, 9, 55)
        const wy = seed * h
        const baseX = (t * 0.4 * (0.8 + seed * 0.4) + i * 97) % (w + 100) - 50
        const lineLen = 15 + seed * 25
        ctx.globalAlpha = 0.06 + Math.sin(t * 0.003 + i) * 0.03
        ctx.beginPath()
        ctx.moveTo(baseX, wy)
        ctx.lineTo(baseX + lineLen, wy - 1)
        ctx.stroke()
      }
      // Leaf particles in wind
      for (let i = 0; i < 10; i++) {
        const seed = seededRand(i, 10, 66)
        const lx = (t * 0.15 * (0.5 + seed) + i * 143) % (w + 60) - 30
        const ly = seed * h * 0.8 + h * 0.1 + Math.sin(t * 0.003 + i * 2.3) * 20
        ctx.globalAlpha = 0.2 + seed * 0.15
        ctx.fillStyle = seed > 0.5 ? '#84cc16' : '#a16207'
        ctx.beginPath()
        ctx.ellipse(lx, ly, 2, 1, t * 0.005 + i, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (weather === 'sunny') {
      // Sun rays — golden light streaks from top
      for (let i = 0; i < 5; i++) {
        const seed = seededRand(i, 11, 77)
        const rayX = w * 0.2 + seed * w * 0.6
        const rayAlpha = 0.02 + Math.sin(t * 0.0015 + i * 1.5) * 0.015
        const grad = ctx.createLinearGradient(rayX, 0, rayX + 30, h * 0.7)
        grad.addColorStop(0, `rgba(255, 220, 100, ${rayAlpha})`)
        grad.addColorStop(1, 'rgba(255, 220, 100, 0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.moveTo(rayX - 10, 0)
        ctx.lineTo(rayX + 40, 0)
        ctx.lineTo(rayX + 60, h * 0.7)
        ctx.lineTo(rayX - 20, h * 0.7)
        ctx.fill()
      }
      // Floating dust motes
      for (let i = 0; i < 12; i++) {
        const seed = seededRand(i, 12, 88)
        const dx = (playerIsoX + offsetX) + Math.sin(t * 0.0005 + seed * 6.28) * 80 + (seed - 0.5) * 100
        const dy = (playerIsoY + offsetY) + Math.cos(t * 0.0007 + seed * 4) * 50 + (seed - 0.5) * 70
        const moteAlpha = 0.25 + Math.sin(t * 0.003 + i * 1.1) * 0.15
        ctx.globalAlpha = moteAlpha
        ctx.fillStyle = '#fde68a'
        ctx.beginPath()
        ctx.arc(dx, dy, 0.6 + seed * 0.8, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    if (weather === 'thunderstorm') {
      // Heavy rain — denser and more angled than normal rain
      for (let i = 0; i < 150; i++) {
        const seed = seededRand(i, 14, 99)
        const rx = seed * w
        const baseY = (t * 0.5 + i * 31) % (h + 40) - 20
        const dropLen = 12 + seed * 10
        ctx.globalAlpha = 0.15 + seed * 0.2
        ctx.strokeStyle = `rgba(130, 180, 240, ${0.35 + seed * 0.2})`
        ctx.lineWidth = 0.4 + seed * 0.5
        ctx.beginPath()
        ctx.moveTo(rx, baseY)
        ctx.lineTo(rx - 4, baseY + dropLen)
        ctx.stroke()
      }
      // Dark storm tint
      ctx.globalAlpha = 0.12
      ctx.fillStyle = 'rgba(15, 20, 40, 1)'
      ctx.fillRect(0, 0, w, h)
      // Periodic electric flash — bright flicker
      const flashCycle = (t * 0.001) % 12
      if (flashCycle < 0.15) {
        ctx.globalAlpha = 0.08 + Math.sin(flashCycle * 40) * 0.06
        ctx.fillStyle = 'rgba(180, 200, 255, 1)'
        ctx.fillRect(0, 0, w, h)
      }
    }

    ctx.globalAlpha = 1

    // Time-of-day color tint overlay (smooth)
    if (smoothLight.tintA > 0.03) {
      ctx.fillStyle = `rgba(${smoothLight.tintR},${smoothLight.tintG},${smoothLight.tintB},${smoothLight.tintA})`
      ctx.fillRect(0, 0, w, h)
    }

    // === BLOOM POST-PROCESSING ===
    // Extract bright areas, blur, composite back with additive blending
    ctx.restore() // restore zoom first

    // Create/reuse offscreen bloom canvas
    if (!bloomCanvasRef.current) {
      bloomCanvasRef.current = document.createElement('canvas')
    }
    const bloomCanvas = bloomCanvasRef.current
    const bloomScale = 0.25 // quarter resolution for perf
    const bw = Math.floor(w * dpr * bloomScale)
    const bh = Math.floor(h * dpr * bloomScale)
    bloomCanvas.width = bw
    bloomCanvas.height = bh
    const bCtx = bloomCanvas.getContext('2d')
    if (bCtx) {
      // Draw main canvas scaled down
      bCtx.drawImage(canvas, 0, 0, bw, bh)
      // Apply blur via multiple passes (simulated gaussian)
      bCtx.filter = 'blur(4px) brightness(1.3)'
      bCtx.globalAlpha = 0.6
      bCtx.drawImage(bloomCanvas, 0, 0)
      bCtx.filter = 'blur(8px) brightness(1.2)'
      bCtx.globalAlpha = 0.4
      bCtx.drawImage(bloomCanvas, 0, 0)
      bCtx.filter = 'none'
      bCtx.globalAlpha = 1

      // Composite bloom back with screen-like blending
      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = smoothLight.bloomIntensity
      ctx.drawImage(bloomCanvas, 0, 0, bw, bh, 0, 0, w * dpr, h * dpr)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.restore()

      // === DEPTH-OF-FIELD EDGE BLUR ===
      if (!dofCanvasRef.current) {
        dofCanvasRef.current = document.createElement('canvas')
      }
      const dofCanvas = dofCanvasRef.current
      if (dofCanvas.width !== canvas.width || dofCanvas.height !== canvas.height) {
        dofCanvas.width = canvas.width
        dofCanvas.height = canvas.height
      }
      const dofCtx = dofCanvas.getContext('2d')
      if (dofCtx) {
        dofCtx.globalCompositeOperation = 'source-over'
        dofCtx.clearRect(0, 0, dofCanvas.width, dofCanvas.height)
        dofCtx.filter = 'blur(3px)'
        dofCtx.drawImage(canvas, 0, 0)
        dofCtx.filter = 'none'
        // Punch a sharp-edged hole in the center using destination-out
        const dofMask = dofCtx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, canvas.width * 0.18,
          canvas.width / 2, canvas.height / 2, canvas.width * 0.48,
        )
        dofMask.addColorStop(0, 'rgba(0,0,0,1)')
        dofMask.addColorStop(0.6, 'rgba(0,0,0,0.6)')
        dofMask.addColorStop(1, 'rgba(0,0,0,0)')
        dofCtx.globalCompositeOperation = 'destination-out'
        dofCtx.fillStyle = dofMask
        dofCtx.fillRect(0, 0, dofCanvas.width, dofCanvas.height)
        // Composite the ring-blurred layer on top of the main canvas
        ctx.drawImage(dofCanvas, 0, 0)
      }
    }

    // === AMBIENT LIGHTING TINT (smooth) ===
    // Continuous color-grade using interpolated keyframes
    ctx.save()
    ctx.scale(dpr, dpr)
    const gm = smoothLight.m
    const isNightish = gm < 330 || gm > 1200
    const isDawnish = gm >= 330 && gm < 480
    const isDuskish = gm >= 1020 && gm <= 1200

    // Color-grade overlay with smooth alpha and color
    if (isNightish) {
      ctx.globalCompositeOperation = 'multiply'
      ctx.globalAlpha = smoothLight.gradeA
      ctx.fillStyle = `rgb(${smoothLight.gradeR},${smoothLight.gradeG},${smoothLight.gradeB})`
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
      // Moonlight glow — fades in/out with night intensity
      const moonAlpha = Math.max(0, (smoothLight.gradeA - 0.12) * 0.6)
      if (moonAlpha > 0.01) {
        ctx.globalAlpha = moonAlpha
        const moonGlow = ctx.createRadialGradient(w * 0.6, h * 0.1, 0, w * 0.6, h * 0.1, w * 0.5)
        moonGlow.addColorStop(0, '#aaccff')
        moonGlow.addColorStop(0.4, '#6688cc')
        moonGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = moonGlow
        ctx.fillRect(0, 0, w, h)
      }
    } else {
      ctx.globalCompositeOperation = 'overlay'
      ctx.globalAlpha = smoothLight.gradeA

      if (isDawnish) {
        const dawnGrad = ctx.createLinearGradient(0, h, w, 0)
        dawnGrad.addColorStop(0, `rgba(${smoothLight.gradeR},${Math.min(153, smoothLight.gradeG)},${Math.min(102, smoothLight.gradeB)},1)`)
        dawnGrad.addColorStop(0.4, `rgba(255,${Math.min(204, smoothLight.gradeG + 80)},${Math.min(170, smoothLight.gradeB + 70)},1)`)
        dawnGrad.addColorStop(1, `rgba(255,${Math.min(224, smoothLight.gradeG + 100)},${Math.min(204, smoothLight.gradeB + 100)},1)`)
        ctx.fillStyle = dawnGrad
      } else if (isDuskish) {
        const duskGrad = ctx.createLinearGradient(w, 0, 0, h)
        duskGrad.addColorStop(0, `rgba(${Math.min(204, smoothLight.gradeR)},${Math.min(68, smoothLight.gradeG)},${Math.min(136, smoothLight.gradeB)},1)`)
        duskGrad.addColorStop(0.3, `rgba(${smoothLight.gradeR},${Math.min(136, smoothLight.gradeG + 60)},68,1)`)
        duskGrad.addColorStop(0.7, `rgba(255,${Math.min(170, smoothLight.gradeG + 90)},68,1)`)
        duskGrad.addColorStop(1, `rgba(${Math.min(136, smoothLight.gradeR)},68,${Math.min(102, smoothLight.gradeB)},1)`)
        ctx.fillStyle = duskGrad
      } else {
        const dayGrad = ctx.createRadialGradient(w * 0.5, h * 0.1, 0, w * 0.5, h * 0.1, w * 0.7)
        dayGrad.addColorStop(0, '#ffffee')
        dayGrad.addColorStop(0.5, '#ffeecc')
        dayGrad.addColorStop(1, 'transparent')
        ctx.fillStyle = dayGrad
      }
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'

      // Horizon/sunset/sunrise glow
      const glowAlpha = smoothLight.gradeA * 0.5
      if (glowAlpha > 0.01 && (isDawnish || isDuskish)) {
        ctx.globalAlpha = glowAlpha
        const gx = isDawnish ? w * 0.3 : w * 0.8
        const gy = isDawnish ? h * 0.85 : h * 0.15
        const horizGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, w * 0.5)
        horizGlow.addColorStop(0, `rgba(${smoothLight.gradeR},${Math.min(120, smoothLight.gradeG + 50)},${Math.min(70, smoothLight.gradeB)},1)`)
        horizGlow.addColorStop(0.4, `rgba(${smoothLight.gradeR},${Math.min(170, smoothLight.gradeG + 90)},${Math.min(100, smoothLight.gradeB + 30)},1)`)
        horizGlow.addColorStop(1, 'transparent')
        ctx.fillStyle = horizGlow
        ctx.fillRect(0, 0, w, h)
      }
    }
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    // === PLAYER LANTERN GLOW ===
    // At night, emit a warm radial glow centered on the player
    if (isNightish) {
      const lanternAlpha = Math.min(0.35, (smoothLight.tintA - 0.10) * 1.5)
      if (lanternAlpha > 0.01) {
        const px = w / 2
        const py = h / 2 - 10
        ctx.globalCompositeOperation = 'screen'
        const lantern = ctx.createRadialGradient(px, py, 0, px, py, 90)
        lantern.addColorStop(0, `rgba(255,200,100,${lanternAlpha * 0.7})`)
        lantern.addColorStop(0.3, `rgba(255,170,60,${lanternAlpha * 0.4})`)
        lantern.addColorStop(0.7, `rgba(255,140,40,${lanternAlpha * 0.1})`)
        lantern.addColorStop(1, 'rgba(255,120,20,0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = lantern
        ctx.fillRect(px - 90, py - 90, 180, 180)
        ctx.globalCompositeOperation = 'source-over'
      }
    }

    ctx.restore()

    // === ENHANCED VIGNETTE ===
    ctx.save()
    ctx.scale(dpr, dpr)
    // Inner glow for atmosphere
    const vignetteStrength = smoothLight.vignetteStrength
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.15, w / 2, h / 2, w * 0.75)
    vignette.addColorStop(0, 'rgba(0,0,0,0)')
    vignette.addColorStop(0.6, 'rgba(0,0,0,0)')
    vignette.addColorStop(0.85, `rgba(0,0,0,${vignetteStrength * 0.5})`)
    vignette.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`)
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
    animFrameRef.current = requestAnimationFrame(render)
  }, [map, playerX, playerY, viewRadius, rangers, timeOfDay, weather, gameMinutes])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [render])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      style={{ imageRendering: 'pixelated' }}
    />
  )
})

export default IsometricRenderer
