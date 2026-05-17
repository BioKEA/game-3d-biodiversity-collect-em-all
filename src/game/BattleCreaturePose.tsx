import type { CSSProperties } from 'react'
import type { CreatureArtInput } from './creatureArt'
import { getCreatureArtProfile, getCreatureArtSpec } from './creatureArt'
import PixelCreatureSprite from './PixelCreatureSprite'

interface Props {
  creature: CreatureArtInput
  size?: number
  flipped?: boolean
  selected?: boolean
  stance?: 'wild' | 'ally'
  className?: string
  style?: CSSProperties
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

export default function BattleCreaturePose({
  creature,
  size = 92,
  flipped = false,
  selected = false,
  stance = 'wild',
  className,
  style,
}: Props) {
  const spec = getCreatureArtSpec(creature)
  const profile = getCreatureArtProfile(spec)
  const accent = spec.palette.glow
  const top = selected ? shade(spec.palette.base, 18) : spec.palette.base
  const slabSide = shade(spec.palette.shadow, -12)
  const slabTop = stance === 'ally' ? '#1f3f38' : '#2a2b45'
  const label = creature.name
  const spriteSize = size * 0.82
  const dominant = profile.dominantAdaptations.slice(0, 3)

  return (
    <span
      className={`relative inline-flex shrink-0 items-end justify-center${className ? ` ${className}` : ''}`}
      title={label}
      aria-hidden={!label}
      style={{
        ...style,
        width: size,
        height: size * 1.08,
        imageRendering: 'pixelated',
        filter: selected
          ? `drop-shadow(0 0 ${size * 0.12}px ${accent}77)`
          : `drop-shadow(0 ${size * 0.06}px ${size * 0.1}px rgba(0,0,0,0.38))`,
      }}
    >
      <span
        className="absolute"
        style={{
          width: size * 0.72,
          height: size * 0.22,
          left: size * 0.14,
          bottom: size * 0.01,
          background: `linear-gradient(180deg, ${slabTop}, ${slabSide})`,
          border: `1px solid ${accent}55`,
          borderRadius: Math.max(3, size * 0.055),
          boxShadow: `inset ${-size * 0.06}px ${size * 0.04}px 0 rgba(0,0,0,0.22), 0 0 ${size * 0.18}px ${accent}22`,
          transform: 'skewX(-18deg)',
        }}
      />
      <span
        className="absolute"
        style={{
          width: size * 0.82,
          height: size * 0.3,
          left: size * 0.08,
          bottom: size * 0.09,
          background: `radial-gradient(ellipse, ${accent}22 0%, rgba(0,0,0,0.28) 46%, transparent 72%)`,
          borderRadius: '50%',
        }}
      />
      <span
        className="absolute"
        style={{
          width: size * 0.78,
          height: size * 0.74,
          left: size * 0.11,
          bottom: size * 0.24,
          background: `radial-gradient(circle, ${top}16 0%, ${accent}12 42%, transparent 72%)`,
          border: `1px solid ${accent}22`,
          boxShadow: `inset 0 0 ${size * 0.1}px ${accent}18`,
          opacity: selected ? 0.95 : 0.7,
        }}
      />
      {dominant.map((adaptation, index) => (
        <span
          key={adaptation.key}
          className="absolute"
          title={adaptation.label}
          style={{
            width: size * 0.055,
            height: size * 0.055,
            left: size * (0.24 + index * 0.19),
            bottom: size * (0.11 + (index % 2) * 0.025),
            background: index === 0 ? spec.palette.highlight : index === 1 ? spec.palette.accent : accent,
            borderRadius: Math.max(1, size * 0.012),
            boxShadow: `0 0 ${size * 0.07}px ${accent}77`,
            opacity: 0.82,
          }}
        />
      ))}
      <span
        className="absolute"
        style={{
          width: spriteSize,
          height: spriteSize,
          left: (size - spriteSize) / 2,
          bottom: size * 0.18,
        }}
      >
        <PixelCreatureSprite creature={creature} size={spriteSize} flipped={flipped} />
      </span>
      <span
        className="absolute"
        style={{
          width: size * 0.16,
          height: size * 0.035,
          right: size * 0.17,
          top: size * 0.14,
          background: spec.palette.highlight,
          opacity: 0.7,
          boxShadow: `0 0 ${size * 0.12}px ${spec.palette.highlight}66`,
        }}
      />
    </span>
  )
}
