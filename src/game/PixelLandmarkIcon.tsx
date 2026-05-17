import type { CSSProperties } from 'react'
import type { LandmarkArtInput, LandmarkArtSpec } from './landmarkArt'
import { getLandmarkArtSpec } from './landmarkArt'

interface Props {
  landmark: LandmarkArtInput
  size?: number
  selected?: boolean
  undiscovered?: boolean
  title?: string
  className?: string
  style?: CSSProperties
}

interface PartProps {
  x: number
  y: number
  w: number
  h: number
  color: string
  z?: number
  opacity?: number
  radius?: number
  transform?: string
  clipPath?: string
  border?: string
}

function Part({ x, y, w, h, color, z = 1, opacity = 1, radius = 0.04, transform, clipPath, border }: PartProps) {
  return (
    <span
      className="absolute"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        width: `${w * 100}%`,
        height: `${h * 100}%`,
        background: color,
        opacity,
        zIndex: z,
        borderRadius: `${radius * 100}%`,
        transform,
        clipPath,
        border,
        boxShadow: 'inset -2px 2px 0 rgba(0,0,0,0.18), inset 1px -1px 0 rgba(255,255,255,0.16)',
        imageRendering: 'pixelated',
      }}
    />
  )
}

function LandmarkGlyph({ spec }: { spec: LandmarkArtSpec }) {
  const p = spec
  switch (spec.kind) {
    case 'bridge':
      return (
        <>
          <Part x={0.08} y={0.58} w={0.84} h={0.12} color={p.base} z={3} />
          <Part x={0.2} y={0.28} w={0.09} h={0.36} color={p.base} z={4} />
          <Part x={0.7} y={0.28} w={0.09} h={0.36} color={p.base} z={4} />
          <Part x={0.13} y={0.42} w={0.74} h={0.04} color={p.accent} z={5} transform="skewY(-10deg)" />
          <Part x={0.23} y={0.2} w={0.52} h={0.34} color="transparent" z={2} border={`2px solid ${p.accent}`} radius={0.5} />
          <Part x={0.1} y={0.73} w={0.8} h={0.08} color="#256d8f" z={1} opacity={0.72} />
        </>
      )
    case 'tower':
      return (
        <>
          <Part x={0.43} y={0.18} w={0.15} h={0.6} color={p.base} z={3} />
          <Part x={0.35} y={0.72} w={0.32} h={0.1} color={p.shadow} z={2} />
          <Part x={0.38} y={0.12} w={0.25} h={0.1} color={p.accent} z={4} />
          <Part x={0.48} y={0.04} w={0.05} h={0.1} color={p.accent} z={5} />
          <Part x={0.46} y={0.31} w={0.08} h={0.34} color={p.side} z={4} opacity={0.8} />
        </>
      )
    case 'campus':
    case 'mission':
      return (
        <>
          <Part x={0.2} y={0.42} w={0.6} h={0.33} color={p.base} z={3} />
          <Part x={0.14} y={0.35} w={0.72} h={0.11} color={p.accent} z={4} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
          {[0.28, 0.45, 0.62].map((x, i) => <Part key={i} x={x} y={0.54} w={0.08} h={0.21} color={i === 1 ? p.accent : p.side} z={5} />)}
          {spec.kind === 'mission' && <Part x={0.68} y={0.24} w={0.1} h={0.22} color={p.base} z={2} />}
        </>
      )
    case 'venue':
      return (
        <>
          <Part x={0.15} y={0.48} w={0.7} h={0.24} color={p.base} z={3} radius={0.08} />
          <Part x={0.18} y={0.38} w={0.64} h={0.15} color={p.accent} z={4} clipPath="polygon(0 100%, 15% 0, 30% 100%, 45% 0, 60% 100%, 75% 0, 100% 100%)" />
          <Part x={0.25} y={0.58} w={0.5} h={0.08} color={p.shadow} z={5} opacity={0.65} />
          <Part x={0.42} y={0.21} w={0.16} h={0.17} color={p.accent} z={2} radius={0.5} />
        </>
      )
    case 'mountain':
      return (
        <>
          <Part x={0.1} y={0.3} w={0.5} h={0.48} color={p.base} z={2} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
          <Part x={0.4} y={0.22} w={0.5} h={0.56} color={p.side} z={3} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
          <Part x={0.49} y={0.27} w={0.2} h={0.16} color={p.accent} z={4} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
        </>
      )
    case 'forest':
      return (
        <>
          {[0.22, 0.45, 0.66].map((x, i) => (
            <span key={i}>
              <Part x={x + 0.07} y={0.58} w={0.08} h={0.22} color={p.shadow} z={2} />
              <Part x={x} y={0.24 + i * 0.05} w={0.22} h={0.4} color={i === 1 ? p.base : p.side} z={3 + i} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
              <Part x={x + 0.06} y={0.3 + i * 0.05} w={0.1} h={0.12} color={p.accent} z={5} opacity={0.55} />
            </span>
          ))}
        </>
      )
    case 'water':
    case 'island':
      return (
        <>
          <Part x={0.12} y={0.64} w={0.78} h={0.12} color="#1f7ea8" z={1} opacity={0.8} />
          <Part x={0.2} y={0.52} w={0.28} h={0.07} color={p.accent} z={2} opacity={0.82} />
          <Part x={0.56} y={0.58} w={0.25} h={0.06} color={p.accent} z={2} opacity={0.7} />
          <Part x={0.32} y={0.36} w={0.36} h={0.24} color={p.base} z={3} clipPath={spec.kind === 'island' ? 'polygon(50% 0, 100% 100%, 0 100%)' : 'polygon(10% 100%, 35% 10%, 62% 100%, 82% 25%, 100% 100%)'} />
        </>
      )
    case 'desert':
      return (
        <>
          <Part x={0.14} y={0.64} w={0.74} h={0.14} color={p.base} z={1} radius={0.5} />
          <Part x={0.42} y={0.27} w={0.1} h={0.38} color={p.side} z={3} />
          <Part x={0.31} y={0.43} w={0.18} h={0.07} color={p.side} z={3} />
          <Part x={0.5} y={0.36} w={0.17} h={0.07} color={p.side} z={3} />
          <Part x={0.18} y={0.57} w={0.56} h={0.08} color={p.accent} z={2} opacity={0.65} />
        </>
      )
    case 'observatory':
      return (
        <>
          <Part x={0.23} y={0.52} w={0.54} h={0.24} color={p.base} z={3} />
          <Part x={0.33} y={0.32} w={0.34} h={0.26} color={p.base} z={4} radius={0.5} />
          <Part x={0.55} y={0.22} w={0.32} h={0.08} color={p.accent} z={5} transform="rotate(-22deg)" />
          <Part x={0.73} y={0.15} w={0.12} h={0.12} color={p.accent} z={6} radius={0.5} />
        </>
      )
    case 'transport':
      return (
        <>
          <Part x={0.14} y={0.47} w={0.72} h={0.23} color={p.base} z={3} radius={0.06} />
          <Part x={0.22} y={0.52} w={0.14} h={0.08} color={p.accent} z={4} />
          <Part x={0.43} y={0.52} w={0.14} h={0.08} color={p.accent} z={4} />
          <Part x={0.64} y={0.52} w={0.14} h={0.08} color={p.accent} z={4} />
          <Part x={0.2} y={0.71} w={0.16} h={0.08} color={p.shadow} z={2} radius={0.5} />
          <Part x={0.64} y={0.71} w={0.16} h={0.08} color={p.shadow} z={2} radius={0.5} />
        </>
      )
    case 'monument':
    case 'city':
    default:
      return (
        <>
          <Part x={0.18} y={0.44} w={0.16} h={0.34} color={p.side} z={2} />
          <Part x={0.38} y={0.28} w={0.19} h={0.5} color={p.base} z={3} />
          <Part x={0.61} y={0.38} w={0.2} h={0.4} color={p.side} z={2} />
          <Part x={0.41} y={0.34} w={0.13} h={0.07} color={p.accent} z={4} />
          <Part x={0.22} y={0.51} w={0.08} h={0.06} color={p.accent} z={4} opacity={0.8} />
          <Part x={0.66} y={0.46} w={0.1} h={0.06} color={p.accent} z={4} opacity={0.8} />
        </>
      )
  }
}

export default function PixelLandmarkIcon({ landmark, size = 36, selected = false, undiscovered = false, title, className, style }: Props) {
  const spec = getLandmarkArtSpec(landmark)
  const label = title ?? landmark.name
  const glow = selected ? `drop-shadow(0 0 ${size * 0.2}px ${spec.glow}88)` : 'drop-shadow(0 3px 6px rgba(0,0,0,0.28))'
  const opacity = undiscovered ? 0.34 : 1

  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center${className ? ` ${className}` : ''}`}
      title={label}
      aria-hidden={!label}
      style={{ ...style, width: size, height: size, opacity, filter: glow, imageRendering: 'pixelated' }}
    >
      <span
        className="absolute"
        style={{
          left: size * 0.1,
          top: size * 0.14,
          width: size * 0.8,
          height: size * 0.74,
          background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(0,0,0,0.22))',
          border: `1px solid ${spec.glow}55`,
          boxShadow: `inset ${-size * 0.06}px ${size * 0.06}px 0 rgba(0,0,0,0.2)`,
          transform: 'skewY(-5deg)',
        }}
      />
      <span className="relative block" style={{ width: size * 0.78, height: size * 0.78 }}>
        <LandmarkGlyph spec={spec} />
      </span>
      {undiscovered && (
        <span className="absolute z-20 text-white/80 font-black" style={{ fontSize: size * 0.42 }}>?</span>
      )}
    </span>
  )
}
