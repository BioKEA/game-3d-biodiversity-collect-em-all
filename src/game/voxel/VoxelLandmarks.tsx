import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { LANDMARKS } from '../landmarks'
import type { MapTile } from '@/types/game'
import { TILE_SIZE, TILE_BASE_HEIGHT, ELEVATION_SCALE, VIEW_RADIUS } from './constants'

interface Props {
  playerX: number
  playerY: number
  map: MapTile[][]
}

export default function VoxelLandmarks({ playerX, playerY, map }: Props) {
  const visible = useMemo(() => {
    return LANDMARKS.filter(lm => {
      const dx = lm.x - playerX
      const dy = lm.y - playerY
      return dx * dx + dy * dy <= (VIEW_RADIUS + 3) * (VIEW_RADIUS + 3)
    })
  }, [playerX, playerY])

  return (
    <>
      {visible.map(lm => {
        const tile = map[lm.y]?.[lm.x]
        const elevation = tile?.elevation ?? 0
        const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE
        const buildingH = lm.height * 0.04
        const buildingW = lm.width * 0.06
        const wx = lm.x * TILE_SIZE
        const wz = -lm.y * TILE_SIZE

        return (
          <group key={lm.name} position={[wx, groundY, wz]}>
            {/* Main building body */}
            <mesh position={[0, buildingH / 2, 0]}>
              <boxGeometry args={[buildingW, buildingH, buildingW]} />
              <meshStandardMaterial color={lm.color} flatShading />
            </mesh>

            {/* Accent roof */}
            <mesh position={[0, buildingH + 0.06, 0]}>
              <boxGeometry args={[buildingW + 0.05, 0.12, buildingW + 0.05]} />
              <meshStandardMaterial color={lm.accent} flatShading />
            </mesh>

            {/* Glow point light */}
            <pointLight
              position={[0, buildingH + 0.2, 0]}
              color={lm.glow}
              intensity={0.4}
              distance={3}
            />

            {/* Floating label */}
            <Html
              position={[0, buildingH + 0.5, 0]}
              center
              distanceFactor={12}
              occlude={false}
              style={{ pointerEvents: 'none' }}
            >
              <div style={{
                background: 'rgba(0,0,0,0.7)',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 10,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                fontFamily: 'system-ui',
                textShadow: `0 0 4px ${lm.glow}`,
              }}>
                {lm.emoji && <span style={{ marginRight: 3 }}>{lm.emoji}</span>}
                {lm.label}
              </div>
            </Html>
          </group>
        )
      })}
    </>
  )
}
