import type { CreatureType } from '@/types/game'
import { FIELD_GUIDE_CREATURE_TYPE_COLORS } from './artDirection'
import { EVOLUTIONS } from './evolutions'

export type CreatureBodyPlan =
  | 'quadruped'
  | 'avian'
  | 'fish'
  | 'serpentine'
  | 'amphibian'
  | 'insect'
  | 'plant'
  | 'spirit'

export interface CreatureArtInput {
  id?: string
  name?: string
  sprite?: string
  type?: CreatureType
  color?: string
  isAlpha?: boolean
  isShiny?: boolean
}

export interface CreatureArtPalette {
  base: string
  side: string
  shadow: string
  highlight: string
  accent: string
  glow: string
}

export interface CreatureAdaptations {
  wings: number
  fins: number
  legs: number
  tail: number
  horns: number
  spikes: number
  shell: number
  antennae: number
  bloom: number
  glow: number
  spots: number
  stripes: number
  crest: number
}

export interface CreatureArtSpec {
  bodyPlan: CreatureBodyPlan
  palette: CreatureArtPalette
  adaptations: CreatureAdaptations
  stage: 0 | 1 | 2
  seed: number
  scale: number
}

export type CreatureAdaptationKey = keyof CreatureAdaptations

export interface ActiveCreatureAdaptation {
  key: CreatureAdaptationKey
  label: string
  intensity: number
  intensityLabel: 'subtle' | 'strong' | 'major'
}

export interface CreatureArtProfile {
  bodyPlanLabel: string
  stageLabel: string
  scaleLabel: string
  activeAdaptations: ActiveCreatureAdaptation[]
  dominantAdaptations: ActiveCreatureAdaptation[]
}

export interface CreatureArtEvolutionPreview {
  fromProfile: CreatureArtProfile
  toProfile: CreatureArtProfile
  gainedAdaptations: ActiveCreatureAdaptation[]
  intensifiedAdaptations: ActiveCreatureAdaptation[]
  silhouetteShift: 'steady' | 'noticeable' | 'dramatic'
}

interface CreatureArtOverride {
  bodyPlan?: CreatureBodyPlan
  stage?: CreatureArtSpec['stage']
  scale?: number
  adaptations?: Partial<CreatureAdaptations>
  palette?: Partial<CreatureArtPalette>
}

const ZERO_ADAPTATIONS: CreatureAdaptations = {
  wings: 0,
  fins: 0,
  legs: 0,
  tail: 0,
  horns: 0,
  spikes: 0,
  shell: 0,
  antennae: 0,
  bloom: 0,
  glow: 0,
  spots: 0,
  stripes: 0,
  crest: 0,
}

export const CREATURE_BODY_PLAN_LABELS: Record<CreatureBodyPlan, string> = {
  quadruped: 'Ground runner',
  avian: 'Flight form',
  fish: 'Aquatic form',
  serpentine: 'Serpentine form',
  amphibian: 'Amphibious form',
  insect: 'Winged invertebrate',
  plant: 'Rooted botanical',
  spirit: 'Mystic apparition',
}

export const CREATURE_ADAPTATION_LABELS: Record<CreatureAdaptationKey, string> = {
  wings: 'Wings',
  fins: 'Fins',
  legs: 'Legs',
  tail: 'Tail',
  horns: 'Horns',
  spikes: 'Spines',
  shell: 'Shell',
  antennae: 'Antennae',
  bloom: 'Bloom',
  glow: 'Glow',
  spots: 'Pattern spots',
  stripes: 'Stripe bands',
  crest: 'Crest',
}

const CREATURE_STAGE_LABELS: Record<CreatureArtSpec['stage'], string> = {
  0: 'Base silhouette',
  1: 'Adapted silhouette',
  2: 'Apex silhouette',
}

export const CURATED_CREATURE_ART_IDS = [
  'pacific-tree-frog',
  'california-newt',
  'giant-salamander',
  'gray-fox',
  'mountain-lion',
  'scrub-jay',
  'golden-eagle',
  'mission-blue-butterfly',
  'monarch-butterfly',
  'harbor-seal',
  'bay-wisp',
  'fog-serpent',
  'redwood-guardian',
  'california-poppy-sprite',
  'manzanita-sprite',
  'sequoia-guardian',
] as const

const CURATED_CREATURE_ART: Record<string, CreatureArtOverride> = {
  'pacific-tree-frog': {
    bodyPlan: 'amphibian',
    scale: 0.94,
    adaptations: { legs: 0.82, tail: 0.25, spots: 0.62, glow: 0.18 },
  },
  'california-newt': {
    bodyPlan: 'amphibian',
    scale: 1.05,
    adaptations: { legs: 0.9, tail: 0.9, spots: 0.7, glow: 0.38, crest: 0.35 },
  },
  'giant-salamander': {
    bodyPlan: 'amphibian',
    stage: 2,
    scale: 1.16,
    adaptations: { legs: 1, tail: 1, spots: 0.78, spikes: 0.44, glow: 0.45 },
  },
  'gray-fox': {
    bodyPlan: 'quadruped',
    scale: 0.96,
    adaptations: { legs: 0.78, tail: 0.92, spots: 0.42, stripes: 0.38 },
  },
  'mountain-lion': {
    bodyPlan: 'quadruped',
    stage: 2,
    scale: 1.16,
    adaptations: { legs: 1, tail: 0.88, crest: 0.42, spots: 0.28 },
  },
  'scrub-jay': {
    bodyPlan: 'avian',
    scale: 0.96,
    adaptations: { wings: 0.86, tail: 0.65, crest: 0.72, stripes: 0.36 },
  },
  'golden-eagle': {
    bodyPlan: 'avian',
    stage: 2,
    scale: 1.18,
    adaptations: { wings: 1, tail: 0.86, crest: 0.8, spots: 0.42 },
  },
  'mission-blue-butterfly': {
    bodyPlan: 'insect',
    scale: 0.92,
    adaptations: { wings: 0.88, antennae: 0.76, spots: 0.72, glow: 0.28 },
  },
  'monarch-butterfly': {
    bodyPlan: 'insect',
    scale: 0.98,
    adaptations: { wings: 1, antennae: 0.82, spots: 0.88, stripes: 0.65 },
  },
  'harbor-seal': {
    bodyPlan: 'fish',
    scale: 0.96,
    adaptations: { fins: 0.74, tail: 0.66, spots: 0.62, shell: 0.18 },
  },
  'bay-wisp': {
    bodyPlan: 'spirit',
    scale: 0.94,
    adaptations: { glow: 0.9, tail: 0.42, crest: 0.35 },
  },
  'fog-serpent': {
    bodyPlan: 'serpentine',
    stage: 1,
    scale: 1.08,
    adaptations: { tail: 1, glow: 0.82, stripes: 0.64, crest: 0.44 },
  },
  'redwood-guardian': {
    bodyPlan: 'plant',
    stage: 2,
    scale: 1.18,
    adaptations: { bloom: 0.86, shell: 0.6, spikes: 0.55, glow: 0.66, crest: 0.48 },
  },
  'california-poppy-sprite': {
    bodyPlan: 'plant',
    scale: 0.94,
    adaptations: { bloom: 0.94, glow: 0.38, antennae: 0.2 },
  },
  'manzanita-sprite': {
    bodyPlan: 'plant',
    stage: 1,
    scale: 1.04,
    adaptations: { bloom: 0.8, spikes: 0.48, glow: 0.5, shell: 0.32 },
  },
  'sequoia-guardian': {
    bodyPlan: 'plant',
    stage: 2,
    scale: 1.2,
    adaptations: { bloom: 0.7, shell: 0.78, spikes: 0.64, glow: 0.72, crest: 0.62 },
  },
}

export function hasCuratedCreatureArtSpec(id?: string): boolean {
  return !!id && id in CURATED_CREATURE_ART
}

function shade(hex: string, amount: number): string {
  const normalized = hex.replace('#', '')
  if (normalized.length !== 6) return hex
  const num = Number.parseInt(normalized, 16)
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (num & 255) + amount))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function getEvolutionStage(id?: string): 0 | 1 | 2 {
  if (!id) return 0
  const hasPre = EVOLUTIONS.some(e => e.toId === id)
  const hasNext = EVOLUTIONS.some(e => e.fromId === id)
  if (hasPre && hasNext) return 1
  if (hasPre) return 2
  return 0
}

function makePalette(creature: CreatureArtInput): CreatureArtPalette {
  const typePalette = creature.type ? FIELD_GUIDE_CREATURE_TYPE_COLORS[creature.type] : FIELD_GUIDE_CREATURE_TYPE_COLORS.beast
  const base = creature.color && creature.color.startsWith('#') ? creature.color : typePalette.top
  return {
    base,
    side: shade(base, -32),
    shadow: shade(base, -70),
    highlight: shade(base, 56),
    accent: typePalette.accent,
    glow: creature.isShiny ? '#c084fc' : creature.isAlpha ? '#fbbf24' : typePalette.accent,
  }
}

function inferBodyPlan(creature: CreatureArtInput): CreatureBodyPlan {
  const label = `${creature.id ?? ''} ${creature.name ?? ''} ${creature.sprite ?? ''}`.toLowerCase()

  if (/(serpent|snake|eel|kraken|leviathan|wraith|phantom|specter|spirit|wisp)/.test(label)) {
    return /(wraith|phantom|specter|spirit|wisp)/.test(label) ? 'spirit' : 'serpentine'
  }
  if (/(fish|salmon|trout|shark|whale|ray|anchovy|sardine|tuna)/.test(label)) return 'fish'
  if (/(bird|hawk|eagle|owl|jay|heron|pelican|condor|falcon|gull|crane|quail|petrel|raven)/.test(label)) return 'avian'
  if (/(frog|toad|newt|salamander)/.test(label)) return 'amphibian'
  if (/(butterfly|moth|bee|beetle|fly|insect|swarm|firefly)/.test(label)) return 'insect'
  if (/(tree|flower|fern|pine|redwood|plant|kelp|lupine|poppy|cactus|bloom)/.test(label)) return 'plant'
  if (creature.type === 'bird') return 'avian'
  if (creature.type === 'marine') return 'fish'
  if (creature.type === 'amphibian') return 'amphibian'
  if (creature.type === 'insect') return 'insect'
  if (creature.type === 'plant') return 'plant'
  if (creature.type === 'mystic') return 'spirit'
  return 'quadruped'
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function inferAdaptations(creature: CreatureArtInput, bodyPlan: CreatureBodyPlan, stage: 0 | 1 | 2, seed: number): CreatureAdaptations {
  const label = `${creature.id ?? ''} ${creature.name ?? ''} ${creature.sprite ?? ''}`.toLowerCase()
  const stageBoost = stage * 0.25
  const randomBit = (offset: number) => ((seed >> offset) & 1) ? 0.25 : 0
  const a = { ...ZERO_ADAPTATIONS }

  if (bodyPlan === 'avian' || /(wing|soar|hawk|eagle|moth|butterfly|dragon)/.test(label)) a.wings = clamp01(0.75 + stageBoost)
  if (bodyPlan === 'fish' || /(fin|seal|otter|marine|tide|wave|whale|shark)/.test(label)) a.fins = clamp01(0.55 + stageBoost)
  if (bodyPlan === 'quadruped' || bodyPlan === 'amphibian') a.legs = clamp01(0.65 + stageBoost)
  if (bodyPlan !== 'plant' && bodyPlan !== 'spirit') a.tail = clamp01(0.35 + stageBoost + randomBit(3))
  if (/(horn|elk|deer|ram|diablo|dragon|gila|iguana|lizard)/.test(label)) a.horns = clamp01(0.45 + stageBoost)
  if (/(spine|spike|cactus|urchin|scorpion|gila|horned|dragon|postpile|thorn)/.test(label)) a.spikes = clamp01(0.5 + stageBoost)
  if (/(turtle|tortoise|crab|snail|slug|shell|gastropod)/.test(label)) a.shell = clamp01(0.65 + stageBoost)
  if (bodyPlan === 'insect' || /(moth|butterfly|bee|beetle|fly)/.test(label)) a.antennae = clamp01(0.6 + stageBoost)
  if (bodyPlan === 'plant' || /(flower|bloom|poppy|lupine|cactus|kelp|fern)/.test(label)) a.bloom = clamp01(0.55 + stageBoost)
  if (creature.type === 'mystic' || /(ghost|fog|fire|ember|storm|lightning|moon|shadow|spirit|phantom|wisp)/.test(label)) a.glow = clamp01(0.5 + stageBoost)
  if (/(frog|newt|salamander|butterfly|moth|jay|quail|trout|seal|bobcat)/.test(label)) a.spots = clamp01(0.35 + randomBit(5))
  if (/(snake|skunk|raccoon|bee|wasp|zebra|tiger|garter)/.test(label)) a.stripes = clamp01(0.5 + randomBit(6))
  if (/(jay|quail|heron|egret|condor|lion|phantom|guardian|boss|alpha)/.test(label) || creature.isAlpha) a.crest = clamp01(0.35 + stageBoost)

  return a
}

function isCreatureArtSpec(value: CreatureArtInput | CreatureArtSpec): value is CreatureArtSpec {
  return 'adaptations' in value && 'bodyPlan' in value && 'stage' in value
}

function toSpec(value: CreatureArtInput | CreatureArtSpec): CreatureArtSpec {
  return isCreatureArtSpec(value) ? value : getCreatureArtSpec(value)
}

function getIntensityLabel(value: number): ActiveCreatureAdaptation['intensityLabel'] {
  if (value >= 0.85) return 'major'
  if (value >= 0.6) return 'strong'
  return 'subtle'
}

export function getActiveCreatureAdaptations(
  creatureOrSpec: CreatureArtInput | CreatureArtSpec,
  threshold = 0.35,
): ActiveCreatureAdaptation[] {
  const spec = toSpec(creatureOrSpec)
  return (Object.entries(spec.adaptations) as [CreatureAdaptationKey, number][])
    .filter(([, intensity]) => intensity >= threshold)
    .map(([key, intensity]) => ({
      key,
      label: CREATURE_ADAPTATION_LABELS[key],
      intensity,
      intensityLabel: getIntensityLabel(intensity),
    }))
    .sort((a, b) => b.intensity - a.intensity || a.label.localeCompare(b.label))
}

export function getCreatureArtProfile(creatureOrSpec: CreatureArtInput | CreatureArtSpec): CreatureArtProfile {
  const spec = toSpec(creatureOrSpec)
  const activeAdaptations = getActiveCreatureAdaptations(spec)
  return {
    bodyPlanLabel: CREATURE_BODY_PLAN_LABELS[spec.bodyPlan],
    stageLabel: CREATURE_STAGE_LABELS[spec.stage],
    scaleLabel: `${Math.round(spec.scale * 100)}%`,
    activeAdaptations,
    dominantAdaptations: activeAdaptations.slice(0, 4),
  }
}

export function compareCreatureArtEvolution(
  from: CreatureArtInput | CreatureArtSpec,
  to: CreatureArtInput | CreatureArtSpec,
): CreatureArtEvolutionPreview {
  const fromSpec = toSpec(from)
  const toSpecResult = toSpec(to)
  const fromProfile = getCreatureArtProfile(fromSpec)
  const toProfile = getCreatureArtProfile(toSpecResult)

  const gainedAdaptations = getActiveCreatureAdaptations(toSpecResult)
    .filter(adaptation => fromSpec.adaptations[adaptation.key] < 0.35)
  const intensifiedAdaptations = getActiveCreatureAdaptations(toSpecResult, 0.2)
    .filter(adaptation => {
      const fromIntensity = fromSpec.adaptations[adaptation.key]
      return fromIntensity >= 0.35 && adaptation.intensity - fromIntensity >= 0.2
    })
    .slice(0, 4)
  const rawShift = Math.abs(toSpecResult.scale - fromSpec.scale) + (toSpecResult.stage - fromSpec.stage) * 0.18
  const silhouetteShift = rawShift >= 0.38 ? 'dramatic' : rawShift >= 0.18 ? 'noticeable' : 'steady'

  return {
    fromProfile,
    toProfile,
    gainedAdaptations,
    intensifiedAdaptations,
    silhouetteShift,
  }
}

export function getCreatureArtSpec(creature: CreatureArtInput): CreatureArtSpec {
  const seed = hashString(`${creature.id ?? ''}:${creature.name ?? ''}:${creature.sprite ?? ''}:${creature.type ?? ''}`)
  const override = creature.id ? CURATED_CREATURE_ART[creature.id] : undefined
  const bodyPlan = override?.bodyPlan ?? inferBodyPlan(creature)
  const stage = override?.stage ?? getEvolutionStage(creature.id)
  const adaptations = {
    ...inferAdaptations(creature, bodyPlan, stage, seed),
    ...(override?.adaptations ?? {}),
  }
  return {
    bodyPlan,
    palette: {
      ...makePalette(creature),
      ...(override?.palette ?? {}),
    },
    adaptations,
    stage,
    seed,
    scale: override?.scale ?? (0.92 + stage * 0.08 + (creature.isAlpha ? 0.08 : 0)),
  }
}
