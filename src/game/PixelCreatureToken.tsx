import type { CSSProperties } from 'react'
import type { CreatureType } from '@/types/game'
import { FIELD_GUIDE_CREATURE_TYPE_COLORS } from './artDirection'
import PixelCreatureSprite from './PixelCreatureSprite'
import PixelGlyph from './PixelGlyph'

interface CreatureTokenLike {
  sprite: string
  type?: CreatureType
  color?: string
  name?: string
  nickname?: string
  isAlpha?: boolean
  isShiny?: boolean
}

interface Props {
  creature: CreatureTokenLike
  size?: number
  selected?: boolean
  title?: string
  className?: string
  style?: CSSProperties
  flipped?: boolean
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

export default function PixelCreatureToken({ creature, size = 48, selected = false, title, className, style, flipped = false }: Props) {
  const palette = creature.type ? FIELD_GUIDE_CREATURE_TYPE_COLORS[creature.type] : undefined
  const top = creature.color ?? palette?.top ?? '#7f8b4a'
  const side = palette?.side ?? shade(top, -34)
  const dark = palette?.dark ?? shade(top, -66)
  const accent = palette?.accent ?? shade(top, 42)
  const label = title ?? creature.nickname ?? creature.name
  const baseFilter = selected || creature.isAlpha || creature.isShiny
    ? `drop-shadow(0 0 10px ${creature.isShiny ? '#c084fc' : creature.isAlpha ? '#fbbf24' : accent}66)`
    : 'drop-shadow(0 4px 8px rgba(0,0,0,0.26))'
  const styleFilter = typeof style?.filter === 'string' ? style.filter : ''

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center${className ? ` ${className}` : ''}`}
      title={label}
      aria-hidden={!label}
      style={{
        ...style,
        width: size,
        height: size,
        filter: [baseFilter, styleFilter].filter(Boolean).join(' '),
      }}
    >
      <span
        className="absolute"
        style={{
          width: size * 0.64,
          height: size * 0.64,
          left: size * 0.18,
          top: size * 0.08,
          background: top,
          border: `1px solid ${accent}66`,
          borderRadius: Math.max(3, size * 0.08),
          boxShadow: `inset ${-size * 0.08}px ${size * 0.08}px 0 ${side}`,
          transform: 'skewY(-8deg)',
        }}
      />
      <span
        className="absolute"
        style={{
          width: size * 0.64,
          height: size * 0.2,
          left: size * 0.18,
          top: size * 0.67,
          background: dark,
          borderRadius: `0 0 ${Math.max(3, size * 0.08)}px ${Math.max(3, size * 0.08)}px`,
          transform: 'skewX(-18deg)',
        }}
      />
      <span
        className="relative z-10 leading-none"
        style={{
          width: size * 0.68,
          height: size * 0.68,
          transform: 'translateY(-4%)',
        }}
      >
        <PixelCreatureSprite creature={creature} size={size * 0.68} flipped={flipped} />
      </span>
      {creature.isAlpha && (
        <span className="absolute -right-0.5 -top-1 z-20 leading-none">
          <PixelGlyph glyph="sparkle" size={size * 0.22} palette={{ primary: '#7a501e', accent: '#fbbf24', dark: '#4a2f12', light: '#fff3b0' }} />
        </span>
      )}
      {creature.isShiny && (
        <span className="absolute -right-0.5 -top-1 z-20 leading-none">
          <PixelGlyph glyph="sparkle" size={size * 0.22} palette={{ primary: '#6d4fa3', accent: '#c084fc', dark: '#38245f', light: '#f4d8ff' }} />
        </span>
      )}
    </span>
  )
}
