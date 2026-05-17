import type { LandmarkDef } from './landmarks'

export type LandmarkArtKind =
  | 'bridge'
  | 'tower'
  | 'campus'
  | 'city'
  | 'venue'
  | 'mountain'
  | 'forest'
  | 'water'
  | 'island'
  | 'desert'
  | 'mission'
  | 'observatory'
  | 'monument'
  | 'transport'

export interface LandmarkArtInput {
  name: string
  color?: string
  accent?: string
  glow?: string
  label?: string
  emoji?: string
}

export interface LandmarkArtSpec {
  kind: LandmarkArtKind
  base: string
  side: string
  shadow: string
  accent: string
  glow: string
  seed: number
}

const DEFAULTS: Record<LandmarkArtKind, { base: string; accent: string; glow: string }> = {
  bridge: { base: '#cc4a2d', accent: '#f59e0b', glow: '#ff7043' },
  tower: { base: '#94a3b8', accent: '#e2e8f0', glow: '#cbd5e1' },
  campus: { base: '#1e3a5f', accent: '#facc15', glow: '#60a5fa' },
  city: { base: '#64748b', accent: '#e2e8f0', glow: '#94a3b8' },
  venue: { base: '#c026d3', accent: '#fde047', glow: '#f472b6' },
  mountain: { base: '#78716c', accent: '#e2e8f0', glow: '#cbd5e1' },
  forest: { base: '#2d6a3f', accent: '#84cc16', glow: '#4ade80' },
  water: { base: '#0284c7', accent: '#67e8f9', glow: '#38bdf8' },
  island: { base: '#64748b', accent: '#94a3b8', glow: '#38bdf8' },
  desert: { base: '#c07040', accent: '#fbbf24', glow: '#f97316' },
  mission: { base: '#d4a574', accent: '#dc2626', glow: '#fbbf24' },
  observatory: { base: '#e5e7eb', accent: '#38bdf8', glow: '#a7f3d0' },
  monument: { base: '#a3a3a3', accent: '#fbbf24', glow: '#e5e7eb' },
  transport: { base: '#4b5563', accent: '#facc15', glow: '#a3a3a3' },
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

export function inferLandmarkKind(input: LandmarkArtInput): LandmarkArtKind {
  const label = `${input.name} ${input.label ?? ''} ${input.emoji ?? ''}`.toLowerCase()
  if (/(bridge|bixby|coronado|golden gate bridge)/.test(label)) return 'bridge'
  if (/(tower|pyramid|salesforce|coit|watts|lighthouse|tramway|postpile)/.test(label)) return 'tower'
  if (/(university|uc |ucsf|sfsu|stanford|berkeley|salk|campus|google|apple|meta|tesla|nvidia|anthropic)/.test(label)) return 'campus'
  if (/(stadium|park|coliseum|boardwalk|pier|disney|wharf|castle|queen mary|oracle)/.test(label)) return 'venue'
  if (/(observatory|griffith)/.test(label)) return 'observatory'
  if (/(mission|olvera|capitol|getty|hearst)/.test(label)) return 'mission'
  if (/(mount|mt\\.|half dome|whitney|diablo|shasta|lassen|morro|tamalpais|peaks|yosemite)/.test(label)) return 'mountain'
  if (/(redwood|woods|sequoia|sherman|bristlecone|torrey|joshua tree|pine|forest)/.test(label)) return 'forest'
  if (/(lake|bay|cove|aquarium|falls|monterey|emerald|natural bridges|steamer|cannery|point reyes)/.test(label)) return 'water'
  if (/(island|alcatraz|channel)/.test(label)) return 'island'
  if (/(desert|death valley|palm springs|mojave|modoc|border)/.test(label)) return 'desert'
  if (/(bart|tram|station|outpost|basecamp)/.test(label)) return 'transport'
  if (/(hollywood|sign|winchester|ghirardelli|balboa)/.test(label)) return 'monument'
  return 'city'
}

export function getLandmarkArtSpec(input: LandmarkArtInput | LandmarkDef): LandmarkArtSpec {
  const kind = inferLandmarkKind(input)
  const defaults = DEFAULTS[kind]
  const base = input.color ?? defaults.base
  const accent = input.accent ?? defaults.accent
  return {
    kind,
    base,
    side: shade(base, -34),
    shadow: shade(base, -72),
    accent,
    glow: input.glow ?? defaults.glow,
    seed: hashString(`${input.name}:${input.label ?? ''}:${kind}`),
  }
}
