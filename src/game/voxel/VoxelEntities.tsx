import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { MapTile } from '@/types/game'
import { FIELD_GUIDE_ENTITY_COLORS } from '../artDirection'
import { TILE_BASE_HEIGHT, ELEVATION_SCALE, VIEW_RADIUS, gridToWorldX, gridToWorldZ, seededRand } from './constants'

interface RangerPosition {
  x: number
  y: number
  sprite: string
}

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
  rangers?: RangerPosition[]
}

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

// Creature markers on tiles that have creatures
function CreatureMarkers({ map, playerX, playerY }: Omit<Props, 'rangers'>) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const creatureTiles = useMemo(() => {
    const tiles: MapTile[] = []
    const minX = Math.max(0, playerX - VIEW_RADIUS)
    const maxX = Math.min((map[0]?.length ?? 60) - 1, playerX + VIEW_RADIUS)
    const minY = Math.max(0, playerY - VIEW_RADIUS)
    const maxY = Math.min(map.length - 1, playerY + VIEW_RADIUS)
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = map[y]?.[x]
        if (!tile?.hasCreature) continue
        if (tile.x === playerX && tile.y === playerY) continue
        const dx = x - playerX
        const dy = y - playerY
        if (dx * dx + dy * dy > VIEW_RADIUS * VIEW_RADIUS) continue
        tiles.push(tile)
      }
    }
    return tiles
  }, [map, playerX, playerY])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    creatureTiles.forEach((tile, i) => {
      const elevation = tile.elevation ?? 0
      const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE
      const bob = Math.sin(t * 2 + seededRand(tile.x, tile.y) * 6.28) * 0.08
      _dummy.position.set(gridToWorldX(tile.x), groundY + 0.3 + bob, gridToWorldZ(tile.y))
      const pulse = Math.sin(t * 3 + i) * 0.015
      _dummy.scale.set(0.12 + pulse, 0.18 + pulse, 0.12 + pulse)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      _color.set(seededRand(tile.x, tile.y, 1) > 0.5 ? FIELD_GUIDE_ENTITY_COLORS.creatureMarker : FIELD_GUIDE_ENTITY_COLORS.creatureMarkerDark)
      mesh.setColorAt(i, _color)
    })
    mesh.count = creatureTiles.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 200]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive={FIELD_GUIDE_ENTITY_COLORS.creatureMarkerDark}
        emissiveIntensity={0.08}
        transparent
        opacity={0.9}
        roughness={0.92}
        toneMapped={false}
        flatShading
      />
    </instancedMesh>
  )
}

// Rangers as blocky voxel characters
function Rangers({ rangers = [], map }: { rangers: RangerPosition[]; map: MapTile[][] }) {
  return (
    <>
      {rangers.map((ranger, i) => {
        const tile = map[ranger.y]?.[ranger.x]
        const elevation = tile?.elevation ?? 0
        const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE
        const s = 0.1
        return (
          <group
            key={i}
            position={[gridToWorldX(ranger.x), groundY, gridToWorldZ(ranger.y)]}
          >
            {/* Body */}
            <mesh position={[0, s * 3.5, 0]}>
              <boxGeometry args={[s * 3.5, s * 4, s * 2.5]} />
              <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.rangerJacket} flatShading />
            </mesh>
            {/* Head */}
            <mesh position={[0, s * 7, 0]}>
              <boxGeometry args={[s * 3, s * 3, s * 3]} />
              <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.skin} flatShading />
            </mesh>
            {/* Ranger hat */}
            <mesh position={[0, s * 9, 0]}>
              <boxGeometry args={[s * 4, s * 1, s * 4]} />
              <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.rangerHat} flatShading />
            </mesh>
            <mesh position={[0, s * 9.8, 0]}>
              <boxGeometry args={[s * 2.5, s * 1.2, s * 2.5]} />
              <meshStandardMaterial color={FIELD_GUIDE_ENTITY_COLORS.rangerHat} flatShading />
            </mesh>
            {/* Legs */}
            <mesh position={[-s * 0.8, s * 0.5, 0]}>
              <boxGeometry args={[s * 1.3, s * 2.5, s * 1.5]} />
              <meshStandardMaterial color="#4a3728" flatShading />
            </mesh>
            <mesh position={[s * 0.8, s * 0.5, 0]}>
              <boxGeometry args={[s * 1.3, s * 2.5, s * 1.5]} />
              <meshStandardMaterial color="#4a3728" flatShading />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

export default function VoxelEntities(props: Props) {
  return (
    <>
      <CreatureMarkers map={props.map} playerX={props.playerX} playerY={props.playerY} />
      <Rangers rangers={props.rangers ?? []} map={props.map} />
    </>
  )
}
