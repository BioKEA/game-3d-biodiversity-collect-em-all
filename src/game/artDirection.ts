import type { BiomeType, TimeOfDay } from '@/types/game'

export interface PixelBoxBiomeColors {
  top: string
  side: string
  dark: string
  detail: string
}

export interface PixelBoxLighting {
  ambientColor: string
  ambientIntensity: number
  dirColor: string
  dirIntensity: number
  bgColor: string
  fogColor: string
  fogNear: number
  fogFar: number
}

export const FIELD_GUIDE_PIXEL_BOX_STYLE = {
  name: 'California field-guide pixel boxes',
  tileSize: 1,
  tileBaseHeight: 0.36,
  elevationScale: 0.18,
  viewRadius: 26,
  cameraZoom: 40,
  materialRoughness: 0.94,
  waterOpacity: 0.82,
} as const

export const FIELD_GUIDE_BIOME_COLORS: Record<BiomeType, PixelBoxBiomeColors> = {
  forest:       { top: '#3f7f4e', side: '#2f643c', dark: '#1f4229', detail: '#7ca66a' },
  marsh:        { top: '#7f9852', side: '#647840', dark: '#44522e', detail: '#b4b16a' },
  beach:        { top: '#d0b46c', side: '#aa8f50', dark: '#745f35', detail: '#ead99f' },
  rocky_beach:  { top: '#8b867a', side: '#6e695f', dark: '#47433d', detail: '#b6b0a2' },
  urban:        { top: '#747d85', side: '#5b646d', dark: '#3b4249', detail: '#a7afb5' },
  water:        { top: '#4f849e', side: '#32657e', dark: '#21495f', detail: '#7ab5c8' },
  mountain:     { top: '#797265', side: '#5f594f', dark: '#403b34', detail: '#a89d8a' },
  grassland:    { top: '#8eaa60', side: '#6d8548', dark: '#475831', detail: '#c1c986' },
  redwood:      { top: '#245d3a', side: '#1b472d', dark: '#0e2f1d', detail: '#4f8b5d' },
  tidepool:     { top: '#61a7a5', side: '#408481', dark: '#2a5a59', detail: '#9bd1c5' },
  chaparral:    { top: '#9a8d61', side: '#786d48', dark: '#4f482f', detail: '#c4b87a' },
  oak_woodland: { top: '#647f3c', side: '#4c622d', dark: '#2d3d1a', detail: '#94a96a' },
  kelp_forest:  { top: '#2f746a', side: '#235850', dark: '#173a36', detail: '#6aa99a' },
  desert:       { top: '#c79d6f', side: '#a07a53', dark: '#6d5238', detail: '#e4c28c' },
  alpine:       { top: '#94a0a2', side: '#737f82', dark: '#4d5659', detail: '#c0c9c8' },
  snow:         { top: '#dde7e4', side: '#bbc9c7', dark: '#839190', detail: '#f4f7f4' },
  valley:       { top: '#9bb96d', side: '#789251', dark: '#506437', detail: '#c8d795' },
  volcanic:     { top: '#5c463a', side: '#47362e', dark: '#30251f', detail: '#9b6a4c' },
  scrubland:    { top: '#b39472', side: '#8d7358', dark: '#5d4b3a', detail: '#cfb08a' },
  dunes:        { top: '#dbc98f', side: '#b9a873', dark: '#81734b', detail: '#eee0aa' },
  canyon:       { top: '#b66f49', side: '#934f35', dark: '#633523', detail: '#d39265' },
  lakeshore:    { top: '#73a887', side: '#568367', dark: '#375842', detail: '#a8cfac' },
  old_growth:   { top: '#18482f', side: '#123722', dark: '#0a2316', detail: '#3f7350' },
}

export const FIELD_GUIDE_TIME_LIGHTING: Record<TimeOfDay, PixelBoxLighting> = {
  dawn: {
    ambientColor: '#efe1c7', ambientIntensity: 0.74,
    dirColor: '#e9ae74', dirIntensity: 1.05,
    bgColor: '#b98b65', fogColor: '#b98b65', fogNear: 34, fogFar: 56,
  },
  day: {
    ambientColor: '#f6f2df', ambientIntensity: 0.92,
    dirColor: '#fff3c7', dirIntensity: 1.22,
    bgColor: '#9ab7bd', fogColor: '#9ab7bd', fogNear: 38, fogFar: 62,
  },
  dusk: {
    ambientColor: '#d5a27f', ambientIntensity: 0.68,
    dirColor: '#c97950', dirIntensity: 0.92,
    bgColor: '#8e6c68', fogColor: '#8e6c68', fogNear: 32, fogFar: 52,
  },
  night: {
    ambientColor: '#7c8ba6', ambientIntensity: 0.48,
    dirColor: '#a7b4d4', dirIntensity: 0.55,
    bgColor: '#182333', fogColor: '#182333', fogNear: 30, fogFar: 48,
  },
}

export const FIELD_GUIDE_ENTITY_COLORS = {
  explorerJacket: '#356b70',
  explorerPants: '#343a3d',
  explorerPack: '#a8673c',
  rangerJacket: '#385f32',
  rangerHat: '#7b5a33',
  skin: '#d8a878',
  hair: '#4a3020',
  creatureMarker: '#d5c36c',
  creatureMarkerDark: '#7f8b4a',
  labelBg: 'rgba(21, 28, 28, 0.78)',
  labelText: '#f3ecd7',
} as const

export const FIELD_GUIDE_CREATURE_TYPE_COLORS = {
  beast: { top: '#b3835a', side: '#80583a', dark: '#4f3524', accent: '#d7b37d' },
  bird: { top: '#6f95ad', side: '#4c6e87', dark: '#31495c', accent: '#aac6d3' },
  insect: { top: '#7f9b57', side: '#5f7540', dark: '#3e4d2b', accent: '#bed383' },
  marine: { top: '#4f93a4', side: '#346f7e', dark: '#234d58', accent: '#9bcbd0' },
  amphibian: { top: '#6f9b62', side: '#4f7645', dark: '#344f30', accent: '#add08d' },
  mystic: { top: '#a184b6', side: '#765b8d', dark: '#4c3a5e', accent: '#dac2e7' },
  reptile: { top: '#a58a58', side: '#79643e', dark: '#4d3f29', accent: '#d3bf7d' },
  plant: { top: '#6f8f4f', side: '#506b38', dark: '#314426', accent: '#b5c879' },
} as const
