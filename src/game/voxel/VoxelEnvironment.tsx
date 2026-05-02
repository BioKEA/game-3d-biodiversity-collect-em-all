import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { TimeOfDay, WeatherType } from '@/types/game'
import { TIME_LIGHTING } from './constants'

interface Props {
  timeOfDay: TimeOfDay
  weather: WeatherType
}

// Rain particles
function RainEffect() {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const count = 300
  const _dummy = useMemo(() => new THREE.Object3D(), [])

  const offsets = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 30
      arr[i * 3 + 1] = Math.random() * 12
      arr[i * 3 + 2] = (Math.random() - 0.5) * 30
    }
    return arr
  }, [])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      const ox = offsets[i * 3]
      const oy = offsets[i * 3 + 1]
      const oz = offsets[i * 3 + 2]
      const fallY = ((oy - t * 8) % 12 + 12) % 12
      _dummy.position.set(
        state.camera.position.x + ox,
        fallY,
        state.camera.position.z + oz
      )
      _dummy.scale.set(0.02, 0.15, 0.02)
      _dummy.updateMatrix()
      mesh.setMatrixAt(i, _dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#aaccff" transparent opacity={0.4} />
    </instancedMesh>
  )
}

// Fog particles for fog weather
function FogEffect() {
  const groupRef = useRef<THREE.Group>(null)
  const particles = useMemo(() => {
    const arr: { x: number; y: number; z: number; s: number; speed: number }[] = []
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 25,
        y: 0.5 + Math.random() * 2,
        z: (Math.random() - 0.5) * 25,
        s: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.3,
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    const t = state.clock.elapsedTime
    group.children.forEach((child, i) => {
      const p = particles[i]
      if (!p) return
      child.position.set(
        state.camera.position.x + p.x + Math.sin(t * p.speed) * 2,
        p.y,
        state.camera.position.z + p.z + Math.cos(t * p.speed * 0.7) * 2
      )
    })
  })

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} scale={[p.s * 2, p.s * 0.5, p.s * 2]}>
          <sphereGeometry args={[1, 6, 4]} />
          <meshBasicMaterial color="#cccccc" transparent opacity={0.15} depthWrite={false} />
        </mesh>
      ))}
    </group>
  )
}

export default function VoxelEnvironment({ timeOfDay, weather }: Props) {
  const { scene } = useThree()
  const config = TIME_LIGHTING[timeOfDay]

  // Update scene background and distance fog
  useMemo(() => {
    scene.background = new THREE.Color(config.bgColor)
    scene.fog = new THREE.Fog(config.fogColor, config.fogNear, config.fogFar)
  }, [scene, config])

  // Sun/moon direction varies by time
  const dirLightPos: [number, number, number] = useMemo(() => {
    switch (timeOfDay) {
      case 'dawn': return [-8, 4, 2]
      case 'day': return [-5, 10, 5]
      case 'dusk': return [8, 3, -2]
      case 'night': return [3, 6, 4]
    }
  }, [timeOfDay])

  return (
    <>
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />
      <directionalLight
        color={config.dirColor}
        intensity={config.dirIntensity}
        position={dirLightPos}
      />

      {/* Hemisphere light for subtle ground bounce */}
      <hemisphereLight
        args={[config.dirColor, '#3d2817', 0.3]}
      />

      {/* Weather effects */}
      {weather === 'rain' && <RainEffect />}
      {weather === 'fog' && <FogEffect />}
    </>
  )
}
