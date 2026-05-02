import * as THREE from 'three'
import type { BiomeType, TimeOfDay } from '@/types/game'

// Tile dimensions in world units
export const TILE_SIZE = 1
export const TILE_BASE_HEIGHT = 0.3
export const ELEVATION_SCALE = 0.15
export const VIEW_RADIUS = 24

// Camera offset from player (Crossy Road style: 35° elevation, 45° azimuth)
export const CAMERA_OFFSET = new THREE.Vector3(12, 12, 12)
export const CAMERA_ZOOM = 38

// Biome colors mapped to Three.js Color objects
const BIOME_HEX: Record<BiomeType, { top: string; side: string }> = {
  forest:       { top: '#22c55e', side: '#16a34a' },
  marsh:        { top: '#84cc16', side: '#65a30d' },
  beach:        { top: '#eab308', side: '#ca8a04' },
  rocky_beach:  { top: '#a8a29e', side: '#78716c' },
  urban:        { top: '#6b7280', side: '#4b5563' },
  water:        { top: '#38bdf8', side: '#0284c7' },
  mountain:     { top: '#78716c', side: '#57534e' },
  grassland:    { top: '#4ade80', side: '#22c55e' },
  redwood:      { top: '#166534', side: '#14532d' },
  tidepool:     { top: '#67e8f9', side: '#0891b2' },
  chaparral:    { top: '#a3a056', side: '#7c7c2f' },
  oak_woodland: { top: '#65a30d', side: '#3f6212' },
  kelp_forest:  { top: '#0f766e', side: '#115e59' },
  desert:       { top: '#d4a574', side: '#b8956a' },
  alpine:       { top: '#94a3b8', side: '#64748b' },
  snow:         { top: '#f0f4f8', side: '#cbd5e1' },
  valley:       { top: '#a3d977', side: '#7cb342' },
  volcanic:     { top: '#5c4033', side: '#4a332a' },
  scrubland:    { top: '#c4a882', side: '#a08868' },
  dunes:        { top: '#e8d5a3', side: '#d4c090' },
  canyon:       { top: '#c07040', side: '#a05a30' },
  lakeshore:    { top: '#7ec8a0', side: '#5da87e' },
  old_growth:   { top: '#0d4a20', side: '#0a3818' },
}

const colorCache = new Map<string, THREE.Color>()
function cachedColor(hex: string): THREE.Color {
  let c = colorCache.get(hex)
  if (!c) { c = new THREE.Color(hex); colorCache.set(hex, c) }
  return c
}

export function getBiomeColor(biome: BiomeType): THREE.Color {
  return cachedColor(BIOME_HEX[biome]?.top ?? '#888888')
}

export function getBiomeSideColor(biome: BiomeType): THREE.Color {
  return cachedColor(BIOME_HEX[biome]?.side ?? '#666666')
}

// Time-of-day lighting configs
export interface TimeLightingConfig {
  ambientColor: string
  ambientIntensity: number
  dirColor: string
  dirIntensity: number
  bgColor: string
  fogColor: string
  fogNear: number
  fogFar: number
}

export const TIME_LIGHTING: Record<TimeOfDay, TimeLightingConfig> = {
  dawn: {
    ambientColor: '#ffe0c0', ambientIntensity: 0.8,
    dirColor: '#ffaa70', dirIntensity: 1.2,
    bgColor: '#f5b041', fogColor: '#f5b041', fogNear: 30, fogFar: 50,
  },
  day: {
    ambientColor: '#ffffff', ambientIntensity: 1.0,
    dirColor: '#fffdf0', dirIntensity: 1.5,
    bgColor: '#87ceeb', fogColor: '#87ceeb', fogNear: 32, fogFar: 52,
  },
  dusk: {
    ambientColor: '#ffaa88', ambientIntensity: 0.7,
    dirColor: '#e8723a', dirIntensity: 1.0,
    bgColor: '#c05030', fogColor: '#c05030', fogNear: 28, fogFar: 46,
  },
  night: {
    ambientColor: '#6677bb', ambientIntensity: 0.5,
    dirColor: '#8899dd', dirIntensity: 0.6,
    bgColor: '#101830', fogColor: '#101830', fogNear: 26, fogFar: 44,
  },
}

// Seeded random matching the old renderer for deterministic decorations
export function seededRand(x: number, y: number, seed: number = 0): number {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 73.13) * 43758.5453
  return n - Math.floor(n)
}

// Convert grid coords to world position
export function gridToWorld(gx: number, gy: number, elevation: number = 0): [number, number, number] {
  return [gx * TILE_SIZE, elevation * ELEVATION_SCALE, -gy * TILE_SIZE]
}
