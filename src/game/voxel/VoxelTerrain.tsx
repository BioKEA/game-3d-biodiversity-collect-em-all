import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { MapTile } from '@/types/game'
import { TILE_SIZE, TILE_BASE_HEIGHT, ELEVATION_SCALE, VIEW_RADIUS, getBiomeColor, seededRand } from './constants'

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
}

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

export default function VoxelTerrain({ map, playerX, playerY }: Props) {
  const landRef = useRef<THREE.InstancedMesh>(null)
  const waterRef = useRef<THREE.InstancedMesh>(null)

  // Collect visible tiles in view radius
  const { landTiles, waterTiles } = useMemo(() => {
    const land: MapTile[] = []
    const water: MapTile[] = []
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
        if (tile.biome === 'water' || tile.biome === 'kelp_forest') {
          water.push(tile)
        } else {
          land.push(tile)
        }
      }
    }
    return { landTiles: land, waterTiles: water }
  }, [map, playerX, playerY])

  // Update land instances
  useEffect(() => {
    const mesh = landRef.current
    if (!mesh) return
    landTiles.forEach((tile, i) => {
      const h = TILE_BASE_HEIGHT + tile.elevation * ELEVATION_SCALE
      _dummy.position.set(tile.x * TILE_SIZE, h / 2, -tile.y * TILE_SIZE)
      _dummy.scale.set(TILE_SIZE, h, TILE_SIZE)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      _color.copy(getBiomeColor(tile.biome))
      // Slight per-tile variation for visual interest
      const variation = seededRand(tile.x, tile.y) * 0.08 - 0.04
      _color.r = Math.max(0, Math.min(1, _color.r + variation))
      _color.g = Math.max(0, Math.min(1, _color.g + variation))
      _color.b = Math.max(0, Math.min(1, _color.b + variation))
      mesh.setColorAt(i, _color)
    })
    mesh.count = landTiles.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [landTiles])

  // Update water instances
  useEffect(() => {
    const mesh = waterRef.current
    if (!mesh) return
    waterTiles.forEach((tile, i) => {
      const h = TILE_BASE_HEIGHT * 0.5
      _dummy.position.set(tile.x * TILE_SIZE, h / 2, -tile.y * TILE_SIZE)
      _dummy.scale.set(TILE_SIZE, h, TILE_SIZE)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
      const isKelp = tile.biome === 'kelp_forest'
      _color.set(isKelp ? '#0f766e' : '#2196F3')
      mesh.setColorAt(i, _color)
    })
    mesh.count = waterTiles.length
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [waterTiles])

  const maxTiles = (VIEW_RADIUS * 2 + 1) ** 2

  return (
    <>
      {/* Land tiles */}
      <instancedMesh ref={landRef} args={[undefined, undefined, maxTiles]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.85} flatShading />
      </instancedMesh>

      {/* Water tiles */}
      <instancedMesh ref={waterRef} args={[undefined, undefined, maxTiles]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          transparent
          opacity={0.75}
          roughness={0.1}
          metalness={0.3}
          flatShading
        />
      </instancedMesh>
    </>
  )
}
