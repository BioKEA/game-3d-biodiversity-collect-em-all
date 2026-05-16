import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import type { MapTile } from '@/types/game'
import { TILE_SIZE, TILE_BASE_HEIGHT, ELEVATION_SCALE, VIEW_RADIUS, seededRand } from './constants'

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
}

const _dummy = new THREE.Object3D()
const _color = new THREE.Color()

interface DecoInstance {
  x: number; y: number; z: number
  sx: number; sy: number; sz: number
  color: string
}

function getDecorations(tile: MapTile): DecoInstance[] {
  const r = seededRand(tile.x, tile.y)
  const r2 = seededRand(tile.x, tile.y, 1)
  const groundY = TILE_BASE_HEIGHT + tile.elevation * ELEVATION_SCALE
  const wx = tile.x * TILE_SIZE
  const wz = -tile.y * TILE_SIZE
  const decos: DecoInstance[] = []
  const biome = tile.biome

  if (biome === 'water' || biome === 'kelp_forest') return decos

  // Trees for forest/redwood
  if ((biome === 'forest' || biome === 'redwood' || biome === 'oak_woodland') && r > 0.35) {
    const h = biome === 'redwood' ? 0.6 + r2 * 0.4 : 0.3 + r2 * 0.3
    const trunkC = biome === 'redwood' ? '#5b321d' : '#79613c'
    const leafC = biome === 'redwood' ? '#17482d' : biome === 'oak_woodland' ? '#5e7738' : '#356f45'
    // Trunk
    decos.push({ x: wx + (r2 - 0.5) * 0.3, y: groundY + h * 0.4, z: wz + (r - 0.5) * 0.3, sx: 0.08, sy: h * 0.8, sz: 0.08, color: trunkC })
    // Canopy (stacked cubes for voxel feel)
    decos.push({ x: wx + (r2 - 0.5) * 0.3, y: groundY + h * 0.85, z: wz + (r - 0.5) * 0.3, sx: 0.25, sy: h * 0.35, sz: 0.25, color: leafC })
    if (r > 0.6) {
      decos.push({ x: wx + (r2 - 0.5) * 0.3, y: groundY + h * 1.1, z: wz + (r - 0.5) * 0.3, sx: 0.18, sy: h * 0.2, sz: 0.18, color: leafC })
    }
  }

  // Grass tufts for grassland
  if (biome === 'grassland' && r > 0.5) {
    decos.push({ x: wx + (r2 - 0.5) * 0.4, y: groundY + 0.06, z: wz + (r - 0.5) * 0.4, sx: 0.08, sy: 0.12, sz: 0.08, color: '#b4bd77' })
  }

  // Rocks for mountain/rocky_beach
  if ((biome === 'mountain' || biome === 'rocky_beach') && r > 0.4) {
    const rs = 0.08 + r2 * 0.1
    decos.push({ x: wx + (r2 - 0.5) * 0.3, y: groundY + rs / 2, z: wz + (r - 0.5) * 0.3, sx: rs, sy: rs, sz: rs, color: '#8b8376' })
  }

  // Marsh reeds
  if (biome === 'marsh' && r > 0.4) {
    decos.push({ x: wx + (r2 - 0.5) * 0.3, y: groundY + 0.1, z: wz + (r - 0.5) * 0.3, sx: 0.03, sy: 0.2, sz: 0.03, color: '#788751' })
    if (r > 0.6) decos.push({ x: wx + (r - 0.5) * 0.3, y: groundY + 0.08, z: wz + (r2 - 0.5) * 0.3, sx: 0.03, sy: 0.16, sz: 0.03, color: '#a6a463' })
  }

  // Urban small buildings
  if (biome === 'urban' && r > 0.55) {
    const bh = 0.15 + r2 * 0.2
    decos.push({ x: wx + (r2 - 0.5) * 0.2, y: groundY + bh / 2, z: wz + (r - 0.5) * 0.2, sx: 0.18, sy: bh, sz: 0.18, color: '#9aa3a7' })
  }

  // Chaparral scrub bushes
  if (biome === 'chaparral' && r > 0.45) {
    decos.push({ x: wx + (r2 - 0.5) * 0.3, y: groundY + 0.06, z: wz + (r - 0.5) * 0.3, sx: 0.15, sy: 0.12, sz: 0.15, color: '#8f8458' })
  }

  // Beach shells/debris
  if (biome === 'beach' && r > 0.7) {
    decos.push({ x: wx + (r2 - 0.5) * 0.4, y: groundY + 0.02, z: wz + (r - 0.5) * 0.4, sx: 0.05, sy: 0.03, sz: 0.05, color: '#ead7a4' })
  }

  return decos
}

export default function VoxelDecorations({ map, playerX, playerY }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const instances = useMemo(() => {
    const all: DecoInstance[] = []
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
        all.push(...getDecorations(tile))
      }
    }
    return all
  }, [map, playerX, playerY])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    instances.forEach((inst, i) => {
      _dummy.position.set(inst.x, inst.y, inst.z)
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
    <instancedMesh ref={meshRef} args={[undefined, undefined, 3000]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" flatShading roughness={0.9} />
    </instancedMesh>
  )
}
