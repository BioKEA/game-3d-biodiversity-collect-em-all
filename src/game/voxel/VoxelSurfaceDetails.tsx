import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { MapTile } from '@/types/game'
import { FIELD_GUIDE_BIOME_COLORS } from '../artDirection'
import { TILE_BASE_HEIGHT, ELEVATION_SCALE, VIEW_RADIUS, gridToWorldX, gridToWorldZ, seededRand } from './constants'

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
}

interface DetailInstance {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
  rotationY: number
  color: string
}

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

function getSurfaceDetails(tile: MapTile): DetailInstance[] {
  const biome = tile.biome
  const palette = FIELD_GUIDE_BIOME_COLORS[biome]
  const r = seededRand(tile.x, tile.y, 20)
  const r2 = seededRand(tile.x, tile.y, 21)
  const r3 = seededRand(tile.x, tile.y, 22)
  const topY = (biome === 'water' || biome === 'kelp_forest')
    ? TILE_BASE_HEIGHT * 0.5
    : TILE_BASE_HEIGHT + tile.elevation * ELEVATION_SCALE
  const wx = gridToWorldX(tile.x)
  const wz = gridToWorldZ(tile.y)
  const instances: DetailInstance[] = []

  if (biome === 'water' || biome === 'kelp_forest') {
    if (r < 0.2) return instances
    instances.push({
      x: wx + (r2 - 0.5) * 0.5,
      y: topY + 0.012,
      z: wz + (r3 - 0.5) * 0.5,
      sx: 0.34 + r2 * 0.26,
      sy: 0.012,
      sz: 0.025,
      rotationY: r > 0.58 ? Math.PI / 2 : 0,
      color: r > 0.72 ? palette.detail : palette.dark,
    })
    return instances
  }

  if (r < 0.28) return instances

  const isDry = biome === 'desert' || biome === 'dunes' || biome === 'scrubland' || biome === 'canyon' || biome === 'beach'
  const isUrban = biome === 'urban'

  instances.push({
    x: wx + (r2 - 0.5) * 0.54,
    y: topY + 0.014,
    z: wz + (r3 - 0.5) * 0.54,
    sx: isUrban ? 0.24 + r * 0.16 : isDry ? 0.32 + r * 0.18 : 0.11 + r * 0.12,
    sy: 0.018,
    sz: isUrban ? 0.035 : isDry ? 0.035 : 0.08 + r2 * 0.08,
    rotationY: isDry || isUrban ? (r > 0.55 ? Math.PI / 2 : 0) : 0,
    color: r > 0.66 ? palette.detail : palette.dark,
  })

  if (!isUrban && !isDry && r2 > 0.78) {
    instances.push({
      x: wx + (r3 - 0.5) * 0.42,
      y: topY + 0.018,
      z: wz + (r - 0.5) * 0.42,
      sx: 0.06,
      sy: 0.026,
      sz: 0.06,
      rotationY: 0,
      color: palette.detail,
    })
  }

  return instances
}

export default function VoxelSurfaceDetails({ map, playerX, playerY }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const instances = useMemo(() => {
    const all: DetailInstance[] = []
    const minX = Math.max(0, playerX - VIEW_RADIUS)
    const maxX = Math.min((map[0]?.length ?? 60) - 1, playerX + VIEW_RADIUS)
    const minY = Math.max(0, playerY - VIEW_RADIUS)
    const maxY = Math.min(map.length - 1, playerY + VIEW_RADIUS)

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = map[y]?.[x]
        if (!tile) continue
        const dx = x - playerX
        const dy = y - playerY
        if (dx * dx + dy * dy > VIEW_RADIUS * VIEW_RADIUS) continue
        all.push(...getSurfaceDetails(tile))
      }
    }

    return all.slice(0, 5200)
  }, [map, playerX, playerY])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    instances.forEach((inst, i) => {
      _dummy.position.set(inst.x, inst.y, inst.z)
      _dummy.rotation.set(0, inst.rotationY, 0)
      _dummy.scale.set(inst.sx, inst.sy, inst.sz)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      _color.set(inst.color)
      mesh.setColorAt(i, _color)
    })
    mesh.count = instances.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [instances])

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 5200]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" flatShading roughness={0.96} />
    </instancedMesh>
  )
}
