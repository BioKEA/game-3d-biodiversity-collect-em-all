import { useRef, useCallback, memo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { MapTile, TimeOfDay, WeatherType } from '@/types/game'
import { TILE_SIZE, CAMERA_ZOOM, CAMERA_OFFSET, TILE_BASE_HEIGHT, ELEVATION_SCALE } from './constants'
import VoxelTerrain from './VoxelTerrain'
import VoxelPlayer from './VoxelPlayer'
import VoxelLandmarks from './VoxelLandmarks'
import VoxelEntities from './VoxelEntities'
import VoxelEnvironment from './VoxelEnvironment'
import VoxelDecorations from './VoxelDecorations'
import VoxelSurfaceDetails from './VoxelSurfaceDetails'

interface RangerPosition {
  x: number
  y: number
  sprite: string
}

interface Props {
  map: MapTile[][]
  playerX: number
  playerY: number
  viewRadius?: number
  onTileClick?: (x: number, y: number) => void
  rangers?: RangerPosition[]
  timeOfDay?: TimeOfDay
  weather?: WeatherType
  gameMinutes?: number
}

// Camera controller that follows the player with Crossy Road angle
function CameraController({ playerX, playerY, map }: { playerX: number; playerY: number; map: MapTile[][] }) {
  const { camera } = useThree()
  const targetLook = useRef(new THREE.Vector3())
  const targetPos = useRef(new THREE.Vector3())
  const initialized = useRef(false)

  useFrame((_state, delta) => {
    const tile = map[playerY]?.[playerX]
    const elevation = tile?.elevation ?? 0
    const groundY = TILE_BASE_HEIGHT + elevation * ELEVATION_SCALE

    // Player world position
    const px = playerX * TILE_SIZE
    const pz = -playerY * TILE_SIZE

    // Crossy Road camera: orthographic, 35° elevation, 45° azimuth
    targetPos.current.set(px + CAMERA_OFFSET.x, groundY + CAMERA_OFFSET.y, pz + CAMERA_OFFSET.z)
    targetLook.current.set(px, groundY, pz)

    if (!initialized.current) {
      // Snap to position on first frame — don't lerp from wrong position
      camera.position.copy(targetPos.current)
      camera.lookAt(targetLook.current)
      initialized.current = true
      return
    }

    // Smooth follow
    const smoothing = 1 - Math.pow(0.0001, delta)
    camera.position.lerp(targetPos.current, smoothing)
    camera.lookAt(targetLook.current)
  })

  return null
}

function Scene({ map, playerX, playerY, rangers, timeOfDay = 'day', weather = 'clear' }: Props) {
  return (
    <>
      <CameraController playerX={playerX} playerY={playerY} map={map} />
      <VoxelEnvironment timeOfDay={timeOfDay} weather={weather} />
      <VoxelTerrain map={map} playerX={playerX} playerY={playerY} />
      <VoxelSurfaceDetails map={map} playerX={playerX} playerY={playerY} />
      <VoxelDecorations map={map} playerX={playerX} playerY={playerY} />
      <VoxelLandmarks playerX={playerX} playerY={playerY} map={map} />
      <VoxelPlayer x={playerX} y={playerY} map={map} />
      <VoxelEntities map={map} playerX={playerX} playerY={playerY} rangers={rangers} />
    </>
  )
}

const VoxelRenderer = memo(function VoxelRenderer(props: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Force resize event on mount — the preview iframe's ResizeObserver
  // may not fire, leaving the canvas at 300x150 (blurry when CSS-scaled)
  const handleCreated = useCallback(({ gl, scene }: { gl: THREE.WebGLRenderer; scene: THREE.Scene }) => {
    gl.toneMapping = THREE.NoToneMapping
    gl.setClearColor('#87ceeb', 1)
    scene.background = new THREE.Color('#87ceeb')
    // Nudge resize so R3F picks up the actual container dimensions
    setTimeout(() => window.dispatchEvent(new Event('resize')), 50)
    setTimeout(() => window.dispatchEvent(new Event('resize')), 300)
  }, [])

  return (
    <div ref={containerRef} className="w-full h-full" style={{ touchAction: 'none' }}>
      <Canvas
        orthographic
        camera={{
          zoom: CAMERA_ZOOM,
          position: [42, 12, -30],
          near: 0.1,
          far: 200,
          up: [0, 1, 0],
        }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onCreated={handleCreated}
      >
        <Scene {...props} />
      </Canvas>
    </div>
  )
})

export default VoxelRenderer
