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

export function getCreatureArtSpec(creature: CreatureArtInput): CreatureArtSpec {
  const seed = hashString(`${creature.id ?? ''}:${creature.name ?? ''}:${creature.sprite ?? ''}:${creature.type ?? ''}`)
  const bodyPlan = inferBodyPlan(creature)
  const stage = getEvolutionStage(creature.id)
  const adaptations = inferAdaptations(creature, bodyPlan, stage, seed)
  return {
    bodyPlan,
    palette: makePalette(creature),
    adaptations,
    stage,
    seed,
    scale: 0.92 + stage * 0.08 + (creature.isAlpha ? 0.08 : 0),
  }
}
