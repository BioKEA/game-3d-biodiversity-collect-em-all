import type { CSSProperties, ReactNode } from 'react'
import { FIELD_GUIDE_ICON_COLORS } from './artDirection'

type PixelIconVariant = keyof typeof FIELD_GUIDE_ICON_COLORS

interface Props {
  icon?: ReactNode
  size?: number
  variant?: PixelIconVariant
  color?: string
  selected?: boolean
  title?: string
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

export default function PixelIcon({
  icon,
  size = 32,
  variant = 'neutral',
  color,
  selected = false,
  title,
  className,
  style,
}: Props) {
  const palette = FIELD_GUIDE_ICON_COLORS[variant]
  const top = color ?? palette.top
  const side = color ? shade(color, -38) : palette.side
  const dark = color ? shade(color, -72) : palette.dark
  const accent = color ? shade(color, 38) : palette.accent
  const styleFilter = typeof style?.filter === 'string' ? style.filter : ''
  const filter = [
    selected ? `drop-shadow(0 0 9px ${accent}70)` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.28))',
    styleFilter,
  ].filter(Boolean).join(' ')

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center${className ? ` ${className}` : ''}`}
      title={title}
      aria-hidden={!title}
      style={{ ...style, width: size, height: size, filter }}
    >
      <span
        className="absolute"
        style={{
          width: size * 0.72,
          height: size * 0.58,
          left: size * 0.14,
          top: size * 0.12,
          background: top,
          border: `1px solid ${accent}66`,
          borderRadius: Math.max(3, size * 0.08),
          boxShadow: `inset ${-size * 0.08}px ${size * 0.08}px 0 ${side}`,
          transform: 'skewY(-7deg)',
        }}
      />
      <span
        className="absolute"
        style={{
          width: size * 0.72,
          height: size * 0.22,
          left: size * 0.14,
          top: size * 0.68,
          background: dark,
          borderRadius: `0 0 ${Math.max(3, size * 0.08)}px ${Math.max(3, size * 0.08)}px`,
          transform: 'skewX(-16deg)',
        }}
      />
      <span
        className="relative z-10 leading-none"
        style={{
          fontSize: size * 0.46,
          textShadow: '0 2px 0 rgba(0,0,0,0.26)',
          transform: 'translateY(-5%)',
        }}
      >
        {icon}
      </span>
      <span
        className="absolute"
        style={{
          width: size * 0.18,
          height: size * 0.05,
          right: size * 0.19,
          top: size * 0.18,
          background: `${accent}88`,
          borderRadius: 999,
        }}
      />
    </span>
  )
}
