import type { CSSProperties } from 'react'
import type { CreatureArtInput, CreatureArtSpec } from './creatureArt'
import { getCreatureArtSpec } from './creatureArt'

interface Props {
  creature: CreatureArtInput
  size: number
  flipped?: boolean
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
}

function Part({ x, y, w, h, color, z = 1, opacity = 1, radius = 0.06, transform, clipPath }: PartProps) {
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
        boxShadow: 'inset -2px 2px 0 rgba(0,0,0,0.16), inset 1px -1px 0 rgba(255,255,255,0.18)',
        imageRendering: 'pixelated',
      }}
    />
  )
}

function Eye({ x, y, size = 0.055 }: { x: number; y: number; size?: number }) {
  return (
    <>
      <Part x={x} y={y} w={size} h={size} color="#101318" z={7} radius={0.01} />
      <Part x={x + size * 0.45} y={y + size * 0.1} w={size * 0.26} h={size * 0.26} color="#fff8dc" z={8} radius={0.01} />
    </>
  )
}

function Markings({ spec }: { spec: CreatureArtSpec }) {
  const { adaptations, palette, seed } = spec
  const marks = []
  const spotCount = adaptations.spots > 0 ? 2 + (seed % 3) + spec.stage : 0
  for (let i = 0; i < spotCount; i++) {
    marks.push(
      <Part
        key={`spot-${i}`}
        x={0.31 + i * 0.1}
        y={0.4 + ((seed >> (i + 2)) & 1) * 0.08}
        w={0.055}
        h={0.055}
        color={palette.highlight}
        z={6}
        opacity={0.78}
        radius={0.02}
      />,
    )
  }
  if (adaptations.stripes > 0) {
    for (let i = 0; i < 3; i++) {
      marks.push(
        <Part
          key={`stripe-${i}`}
          x={0.28 + i * 0.12}
          y={0.36}
          w={0.035}
          h={0.24}
          color={palette.shadow}
          z={6}
          opacity={0.45}
          transform="skewX(-12deg)"
        />,
      )
    }
  }
  return <>{marks}</>
}

function ExtraAdaptations({ spec }: { spec: CreatureArtSpec }) {
  const { adaptations, palette } = spec
  return (
    <>
      {adaptations.horns > 0 && (
        <>
          <Part x={0.67} y={0.2} w={0.06} h={0.13} color={palette.highlight} z={8} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
          <Part x={0.78} y={0.2} w={0.06} h={0.13} color={palette.highlight} z={8} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
        </>
      )}
      {adaptations.spikes > 0 && [0, 1, 2].map(i => (
        <Part key={`spike-${i}`} x={0.34 + i * 0.1} y={0.26 - i * 0.015} w={0.055} h={0.11} color={palette.highlight} z={8} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
      ))}
      {adaptations.crest > 0 && (
        <Part x={0.7} y={0.17} w={0.12} h={0.13} color={palette.accent} z={8} clipPath="polygon(0 100%, 45% 0, 100% 100%)" />
      )}
      {adaptations.antennae > 0 && (
        <>
          <Part x={0.64} y={0.18} w={0.035} h={0.16} color={palette.shadow} z={8} transform="rotate(-28deg)" />
          <Part x={0.79} y={0.18} w={0.035} h={0.16} color={palette.shadow} z={8} transform="rotate(28deg)" />
          <Part x={0.58} y={0.14} w={0.055} h={0.055} color={palette.accent} z={9} radius={0.02} />
          <Part x={0.83} y={0.14} w={0.055} h={0.055} color={palette.accent} z={9} radius={0.02} />
        </>
      )}
      {adaptations.glow > 0 && (
        <span
          className="absolute inset-[8%]"
          style={{
            border: `1px solid ${palette.glow}66`,
            boxShadow: `0 0 14px ${palette.glow}55, inset 0 0 12px ${palette.glow}22`,
            opacity: 0.75,
            zIndex: 0,
          }}
        />
      )}
    </>
  )
}

function Quadruped({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      {spec.adaptations.tail > 0 && <Part x={0.1} y={0.43} w={0.24} h={0.11} color={p.side} z={2} transform="rotate(-18deg)" />}
      <Part x={0.26} y={0.34} w={0.45} h={0.3} color={p.base} z={3} radius={0.08} />
      <Part x={0.32} y={0.28} w={0.27} h={0.12} color={p.highlight} z={4} opacity={0.55} radius={0.03} />
      <Part x={0.62} y={0.27} w={0.25} h={0.24} color={p.base} z={5} radius={0.08} />
      <Part x={0.78} y={0.39} w={0.12} h={0.08} color={p.side} z={6} radius={0.02} />
      <Part x={0.62} y={0.21} w={0.08} h={0.11} color={p.side} z={4} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
      <Part x={0.77} y={0.2} w={0.08} h={0.12} color={p.side} z={4} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
      {[0.31, 0.47, 0.64, 0.76].map((x, i) => <Part key={i} x={x} y={0.6} w={0.07} h={0.22} color={i % 2 ? p.side : p.shadow} z={2} />)}
      <Markings spec={spec} />
      <Eye x={0.77} y={0.33} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Avian({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      <Part x={0.18} y={0.45} w={0.2} h={0.16} color={p.side} z={2} clipPath="polygon(0 50%, 100% 0, 100% 100%)" />
      <Part x={0.3} y={0.33} w={0.38} h={0.31} color={p.base} z={3} radius={0.09} />
      <Part x={0.36} y={0.36} w={0.3} h={0.16} color={p.highlight} z={4} opacity={0.62} />
      <Part x={0.22} y={0.35} w={0.38} h={0.24} color={p.side} z={5} transform="rotate(-18deg)" clipPath="polygon(0 20%, 100% 0, 82% 100%, 18% 88%)" />
      {spec.adaptations.wings > 0.85 && <Part x={0.48} y={0.3} w={0.32} h={0.2} color={p.accent} z={2} opacity={0.85} transform="rotate(18deg)" clipPath="polygon(0 0, 100% 20%, 78% 100%, 12% 70%)" />}
      <Part x={0.62} y={0.24} w={0.2} h={0.2} color={p.base} z={6} radius={0.07} />
      <Part x={0.8} y={0.33} w={0.14} h={0.08} color="#f7b955" z={6} clipPath="polygon(0 0, 100% 50%, 0 100%)" />
      <Part x={0.46} y={0.62} w={0.045} h={0.16} color={p.shadow} z={2} />
      <Part x={0.57} y={0.62} w={0.045} h={0.16} color={p.shadow} z={2} />
      <Markings spec={spec} />
      <Eye x={0.73} y={0.29} size={0.05} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Fish({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      <Part x={0.11} y={0.38} w={0.22} h={0.24} color={p.side} z={2} clipPath="polygon(0 0, 100% 50%, 0 100%)" />
      <Part x={0.28} y={0.32} w={0.5} h={0.32} color={p.base} z={3} radius={0.12} />
      <Part x={0.38} y={0.35} w={0.26} h={0.1} color={p.highlight} z={4} opacity={0.62} />
      <Part x={0.48} y={0.2} w={0.13} h={0.17} color={p.accent} z={2} clipPath="polygon(50% 0, 100% 100%, 0 100%)" />
      <Part x={0.48} y={0.61} w={0.14} h={0.15} color={p.accent} z={2} clipPath="polygon(0 0, 100% 0, 50% 100%)" />
      <Part x={0.76} y={0.44} w={0.12} h={0.08} color={p.shadow} z={4} radius={0.02} />
      <Markings spec={spec} />
      <Eye x={0.68} y={0.4} size={0.052} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Serpentine({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      {[0, 1, 2, 3, 4].map(i => (
        <Part key={i} x={0.14 + i * 0.12} y={0.52 - Math.sin(i) * 0.08} w={0.18} h={0.16} color={i % 2 ? p.side : p.base} z={3 + i} radius={0.05} />
      ))}
      <Part x={0.64} y={0.32} w={0.23} h={0.22} color={p.base} z={8} radius={0.07} />
      <Part x={0.79} y={0.43} w={0.13} h={0.06} color={p.shadow} z={9} radius={0.01} />
      <Markings spec={spec} />
      <Eye x={0.74} y={0.38} size={0.05} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Amphibian({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      <Part x={0.25} y={0.42} w={0.48} h={0.28} color={p.base} z={3} radius={0.12} />
      <Part x={0.52} y={0.28} w={0.26} h={0.22} color={p.base} z={5} radius={0.08} />
      <Part x={0.32} y={0.34} w={0.28} h={0.11} color={p.highlight} z={4} opacity={0.6} />
      <Part x={0.2} y={0.62} w={0.22} h={0.1} color={p.side} z={2} transform="rotate(16deg)" />
      <Part x={0.62} y={0.62} w={0.22} h={0.1} color={p.side} z={2} transform="rotate(-16deg)" />
      {spec.adaptations.tail > 0.55 && <Part x={0.12} y={0.52} w={0.2} h={0.08} color={p.side} z={2} transform="rotate(-12deg)" />}
      <Markings spec={spec} />
      <Eye x={0.6} y={0.33} size={0.052} />
      <Eye x={0.72} y={0.33} size={0.052} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Insect({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      {spec.adaptations.wings > 0 && (
        <>
          <Part x={0.2} y={0.25} w={0.24} h={0.26} color={p.accent} z={2} opacity={0.62} radius={0.09} transform="rotate(-12deg)" />
          <Part x={0.44} y={0.22} w={0.25} h={0.28} color={p.accent} z={2} opacity={0.62} radius={0.09} transform="rotate(12deg)" />
        </>
      )}
      <Part x={0.28} y={0.43} w={0.18} h={0.2} color={p.side} z={4} radius={0.07} />
      <Part x={0.42} y={0.38} w={0.22} h={0.25} color={p.base} z={5} radius={0.08} />
      <Part x={0.61} y={0.42} w={0.18} h={0.18} color={p.base} z={6} radius={0.06} />
      {[0.22, 0.42, 0.62].map((x, i) => (
        <Part key={i} x={x} y={0.62} w={0.06} h={0.17} color={p.shadow} z={3} transform={i === 0 ? 'rotate(18deg)' : i === 2 ? 'rotate(-18deg)' : undefined} />
      ))}
      <Markings spec={spec} />
      <Eye x={0.69} y={0.47} size={0.045} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Plant({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      <Part x={0.47} y={0.35} w={0.1} h={0.42} color={p.shadow} z={2} />
      <Part x={0.25} y={0.48} w={0.26} h={0.13} color={p.side} z={3} transform="rotate(-18deg)" />
      <Part x={0.53} y={0.42} w={0.28} h={0.13} color={p.base} z={3} transform="rotate(16deg)" />
      <Part x={0.32} y={0.27} w={0.36} h={0.2} color={p.base} z={4} radius={0.08} />
      {spec.adaptations.bloom > 0 && (
        <>
          <Part x={0.43} y={0.15} w={0.16} h={0.16} color={p.accent} z={7} radius={0.04} />
          <Part x={0.36} y={0.2} w={0.13} h={0.13} color={p.highlight} z={6} radius={0.04} />
          <Part x={0.54} y={0.2} w={0.13} h={0.13} color={p.highlight} z={6} radius={0.04} />
        </>
      )}
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function Spirit({ spec }: { spec: CreatureArtSpec }) {
  const p = spec.palette
  return (
    <>
      <Part x={0.28} y={0.3} w={0.38} h={0.35} color={p.base} z={4} opacity={0.86} radius={0.12} />
      <Part x={0.2} y={0.52} w={0.28} h={0.14} color={p.side} z={3} opacity={0.62} transform="rotate(16deg)" />
      <Part x={0.54} y={0.55} w={0.26} h={0.12} color={p.accent} z={3} opacity={0.58} transform="rotate(-12deg)" />
      <Part x={0.38} y={0.2} w={0.18} h={0.12} color={p.highlight} z={5} opacity={0.65} />
      <Eye x={0.4} y={0.42} size={0.045} />
      <Eye x={0.53} y={0.42} size={0.045} />
      <ExtraAdaptations spec={spec} />
    </>
  )
}

function BodyPlan({ spec }: { spec: CreatureArtSpec }) {
  switch (spec.bodyPlan) {
    case 'avian': return <Avian spec={spec} />
    case 'fish': return <Fish spec={spec} />
    case 'serpentine': return <Serpentine spec={spec} />
    case 'amphibian': return <Amphibian spec={spec} />
    case 'insect': return <Insect spec={spec} />
    case 'plant': return <Plant spec={spec} />
    case 'spirit': return <Spirit spec={spec} />
    default: return <Quadruped spec={spec} />
  }
}

export default function PixelCreatureSprite({ creature, size, flipped = false, className, style }: Props) {
  const spec = getCreatureArtSpec(creature)
  const shimmer = creature.isShiny ? `drop-shadow(0 0 ${size * 0.15}px #c084fc)` : undefined
  return (
    <span
      className={`relative inline-block${className ? ` ${className}` : ''}`}
      style={{
        ...style,
        width: size,
        height: size,
        transform: `${flipped ? 'scaleX(-1) ' : ''}scale(${spec.scale})`,
        transformOrigin: 'center bottom',
        filter: shimmer,
        imageRendering: 'pixelated',
      }}
    >
      <BodyPlan spec={spec} />
    </span>
  )
}
