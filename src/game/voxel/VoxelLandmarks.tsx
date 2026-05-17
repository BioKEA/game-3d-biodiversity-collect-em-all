import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { LANDMARKS } from '../landmarks'
import { FIELD_GUIDE_ENTITY_COLORS } from '../artDirection'
import PixelLandmarkIcon from '../PixelLandmarkIcon'
import type { MapTile } from '@/types/game'
import { TILE_SIZE, TILE_BASE_HEIGHT, ELEVATION_SCALE, VIEW_RADIUS } from './constants'

interface Props {
  playerX: number
  playerY: number
  map: MapTile[][]
}

const PRIORITY_LABELS = new Set([
  'Golden Gate Bridge',
  'Alcatraz Island',
  'Coit Tower',
  'Transamerica Pyramid',
  'Salesforce Tower',
  'Muir Woods',
  'Mt. Tamalpais',
  'Twin Peaks',
  'UC Berkeley',
  'Stanford',
  'Lake Merritt',
  'Mt. Diablo',
])

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
        const dx = lm.x - playerX
        const dy = lm.y - playerY
        const tile = map[lm.y]?.[lm.x]
        const elevation = tile?.elevation ?? 0
        const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE
        const buildingH = lm.height * 0.04
        const buildingW = lm.width * 0.06
        const wx = lm.x * TILE_SIZE
        const wz = -lm.y * TILE_SIZE
        const labelRadius = PRIORITY_LABELS.has(lm.name) ? 13 : 8
        const showLabel = dx * dx + dy * dy <= labelRadius * labelRadius

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
            {showLabel && (
              <Html
                position={[0, buildingH + 0.5, 0]}
                center
                occlude={false}
                zIndexRange={[8, 0]}
                style={{ pointerEvents: 'none' }}
              >
                <div style={{
                  background: FIELD_GUIDE_ENTITY_COLORS.labelBg,
                  color: FIELD_GUIDE_ENTITY_COLORS.labelText,
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontSize: 10,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  fontFamily: 'system-ui',
                  border: '1px solid rgba(243, 236, 215, 0.16)',
                }}>
                  <PixelLandmarkIcon landmark={lm} size={16} selected style={{ marginRight: 4, verticalAlign: -4 }} />
                  {lm.label}
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </>
  )
}
