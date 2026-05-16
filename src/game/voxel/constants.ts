import * as THREE from 'three'
import type { BiomeType, TimeOfDay } from '@/types/game'
import { FIELD_GUIDE_BIOME_COLORS, FIELD_GUIDE_PIXEL_BOX_STYLE, FIELD_GUIDE_TIME_LIGHTING } from '../artDirection'

// Tile dimensions in world units
export const TILE_SIZE = FIELD_GUIDE_PIXEL_BOX_STYLE.tileSize
export const TILE_BASE_HEIGHT = FIELD_GUIDE_PIXEL_BOX_STYLE.tileBaseHeight
export const ELEVATION_SCALE = FIELD_GUIDE_PIXEL_BOX_STYLE.elevationScale
export const VIEW_RADIUS = FIELD_GUIDE_PIXEL_BOX_STYLE.viewRadius

// Camera offset from player (Crossy Road style: 35° elevation, 45° azimuth)
export const CAMERA_OFFSET = new THREE.Vector3(12, 12, 12)
export const CAMERA_ZOOM = FIELD_GUIDE_PIXEL_BOX_STYLE.cameraZoom

// Biome colors mapped to Three.js Color objects
const BIOME_HEX = FIELD_GUIDE_BIOME_COLORS

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
  dawn: FIELD_GUIDE_TIME_LIGHTING.dawn,
  day: FIELD_GUIDE_TIME_LIGHTING.day,
  dusk: FIELD_GUIDE_TIME_LIGHTING.dusk,
  night: FIELD_GUIDE_TIME_LIGHTING.night,
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
