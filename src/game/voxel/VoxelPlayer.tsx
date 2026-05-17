import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TILE_BASE_HEIGHT, ELEVATION_SCALE, gridToWorldX, gridToWorldZ } from './constants'
import { FIELD_GUIDE_ENTITY_COLORS } from '../artDirection'
import type { MapTile } from '@/types/game'

interface Props {
  x: number
  y: number
  map: MapTile[][]
}

function shortestAngleDelta(from: number, to: number): number {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from))
}

export default function VoxelPlayer({ x, y, map }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3())
  const currentPos = useRef(new THREE.Vector3(gridToWorldX(x), 0, gridToWorldZ(y)))
  const previousGridPos = useRef({ x, y })
  const targetYaw = useRef(0)

  useEffect(() => {
    const previous = previousGridPos.current
    if (previous.x === x && previous.y === y) return

    const dx = gridToWorldX(x) - gridToWorldX(previous.x)
    const dz = gridToWorldZ(y) - gridToWorldZ(previous.y)
    if (dx !== 0 || dz !== 0) {
      targetYaw.current = Math.atan2(dx, dz)
    }
    previousGridPos.current = { x, y }
  }, [x, y])

  // Calculate target position based on tile elevation
  const tile = map[y]?.[x]
  const elevation = tile?.elevation ?? 0
  const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE
  targetPos.current.set(gridToWorldX(x), groundY, gridToWorldZ(y))

  // Smooth movement interpolation
  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group) return
    currentPos.current.lerp(targetPos.current, 1 - Math.pow(0.001, delta))
    group.position.copy(currentPos.current)
    group.rotation.y += shortestAngleDelta(group.rotation.y, targetYaw.current) * (1 - Math.pow(0.0001, delta))

    // Slight bob animation
    group.position.y += Math.sin(Date.now() * 0.003) * 0.02
  })

  // Voxel character: body + head + legs + arms
  const s = 0.16 // unit scale for body parts
  return (
    <group ref={groupRef}>
      {/* Body - main torso */}
      <mesh position={[0, s * 3.5, 0]}>
        <boxGeometry args={[s * 4, s * 4, s * 3]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.explorerJacket} flatShading />
      </mesh>

      {/* Head */}
      <mesh position={[0, s * 7, 0]}>
        <boxGeometry args={[s * 3.5, s * 3.5, s * 3.5]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.skin} flatShading />
      </mesh>

      {/* Hair */}
      <mesh position={[0, s * 9, 0]}>
        <boxGeometry args={[s * 3.8, s * 1.5, s * 3.8]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.hair} flatShading />
      </mesh>

      {/* Eyes */}
      <mesh position={[s * 0.7, s * 7.2, s * 1.6]}>
        <boxGeometry args={[s * 0.7, s * 0.7, s * 0.3]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      <mesh position={[-s * 0.7, s * 7.2, s * 1.6]}>
        <boxGeometry args={[s * 0.7, s * 0.7, s * 0.3]} />
        <meshStandardMaterial color="#222222" />
      </mesh>

      {/* Left leg */}
      <mesh position={[-s * 1, s * 0.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 2.5, s * 1.8]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.explorerPants} flatShading />
      </mesh>

      {/* Right leg */}
      <mesh position={[s * 1, s * 0.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 2.5, s * 1.8]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.explorerPants} flatShading />
      </mesh>

      {/* Left arm */}
      <mesh position={[-s * 2.8, s * 3.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 3.5, s * 1.5]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.explorerJacket} flatShading />
      </mesh>

      {/* Right arm */}
      <mesh position={[s * 2.8, s * 3.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 3.5, s * 1.5]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.explorerJacket} flatShading />
      </mesh>

      {/* Backpack */}
      <mesh position={[0, s * 3.5, -s * 2]}>
        <boxGeometry args={[s * 3, s * 3, s * 1.5]} />
        <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.explorerPack} flatShading />
      </mesh>
    </group>
  )
}
