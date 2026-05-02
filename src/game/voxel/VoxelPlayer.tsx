import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TILE_SIZE, TILE_BASE_HEIGHT, ELEVATION_SCALE } from './constants'
import type { MapTile } from '@/types/game'

interface Props {
  x: number
  y: number
  map: MapTile[][]
}

export default function VoxelPlayer({ x, y, map }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const targetPos = useRef(new THREE.Vector3())
  const currentPos = useRef(new THREE.Vector3(x, 0, -y))

  // Calculate target position based on tile elevation
  const tile = map[y]?.[x]
  const elevation = tile?.elevation ?? 0
  const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE
  targetPos.current.set(x * TILE_SIZE, groundY, -y * TILE_SIZE)

  // Smooth movement interpolation
  useFrame((_state, delta) => {
    const group = groupRef.current
    if (!group) return
    currentPos.current.lerp(targetPos.current, 1 - Math.pow(0.001, delta))
    group.position.copy(currentPos.current)

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
        <meshStandardMaterial color="#4a90d9" flatShading />
      </mesh>

      {/* Head */}
      <mesh position={[0, s * 7, 0]}>
        <boxGeometry args={[s * 3.5, s * 3.5, s * 3.5]} />
        <meshStandardMaterial color="#ffd5a0" flatShading />
      </mesh>

      {/* Hair */}
      <mesh position={[0, s * 9, 0]}>
        <boxGeometry args={[s * 3.8, s * 1.5, s * 3.8]} />
        <meshStandardMaterial color="#5c3317" flatShading />
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
        <meshStandardMaterial color="#3d3d3d" flatShading />
      </mesh>

      {/* Right leg */}
      <mesh position={[s * 1, s * 0.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 2.5, s * 1.8]} />
        <meshStandardMaterial color="#3d3d3d" flatShading />
      </mesh>

      {/* Left arm */}
      <mesh position={[-s * 2.8, s * 3.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 3.5, s * 1.5]} />
        <meshStandardMaterial color="#4a90d9" flatShading />
      </mesh>

      {/* Right arm */}
      <mesh position={[s * 2.8, s * 3.5, 0]}>
        <boxGeometry args={[s * 1.5, s * 3.5, s * 1.5]} />
        <meshStandardMaterial color="#4a90d9" flatShading />
      </mesh>

      {/* Backpack */}
      <mesh position={[0, s * 3.5, -s * 2]}>
        <boxGeometry args={[s * 3, s * 3, s * 1.5]} />
        <meshStandardMaterial color="#c05621" flatShading />
      </mesh>
    </group>
  )
}
