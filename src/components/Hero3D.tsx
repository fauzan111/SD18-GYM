import { useRef, useMemo, useEffect, type ReactNode } from 'react'
import { Canvas, useFrame, useThree, type GroupProps } from '@react-three/fiber'
import { Float, Environment, Grid, MeshTransmissionMaterial, MeshDistortMaterial } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import { HexDumbbell, Kettlebell, Barbell, Spin } from './equipment'

const chrome = { color: '#c8c9d0', metalness: 1, roughness: 0.12, envMapIntensity: 2 }
const redMetal = {
  color: '#e11d2a',
  metalness: 0.9,
  roughness: 0.18,
  emissive: '#e11d2a',
  emissiveIntensity: 0.9,
}

/* Keeps the wide dumbbell centerpiece fully in frame on any screen.
   A perspective camera's fov is *vertical*, so on narrow/portrait phones the
   horizontal view shrinks and clips the ends of the (wide, spinning) dumbbell.
   As the screen gets narrower we widen the fov — and, once that hits a sane cap,
   dolly the camera back — so the full ~±2-unit dumbbell always fits. Desktop
   (wide) aspect ratios keep the original framing untouched. */
function ResponsiveCamera() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  useEffect(() => {
    const aspect = size.width / size.height
    const targetHalfWidth = 2.3 // horizontal half-extent we must keep visible
    const baseFov = 42
    const baseDist = 8
    const maxFov = 60

    // Vertical half-fov tangent needed so the horizontal half-width fits.
    let tanHalf = targetHalfWidth / (baseDist * aspect)
    // Never zoom in tighter than the desktop baseline.
    tanHalf = Math.max(Math.tan(THREE.MathUtils.degToRad(baseFov) / 2), tanHalf)
    let fov = THREE.MathUtils.radToDeg(Math.atan(tanHalf) * 2)
    let dist = baseDist

    // Cap the fov to avoid harsh distortion; make up the rest by dollying back.
    if (fov > maxFov) {
      fov = maxFov
      dist = targetHalfWidth / (Math.tan(THREE.MathUtils.degToRad(maxFov) / 2) * aspect)
    }

    camera.fov = fov
    camera.position.set(0, 0.5, dist)
    camera.updateProjectionMatrix()
  }, [camera, size])

  return null
}

/* Realistic hex dumbbell centerpiece with pointer-reactive spin */
function Dumbbell(props: GroupProps) {
  const group = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!group.current) return
    group.current.rotation.y = t * 0.4
    const { x, y } = state.pointer
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, y * 0.4 + 0.15, 0.05)
    group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, x * -0.3, 0.05)
  })

  return (
    <group ref={group} rotation={[0.15, 0, 0]} {...props}>
      <HexDumbbell />
    </group>
  )
}

/* Glowing energy rings orbiting the centerpiece */
function EnergyRings() {
  const g = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!g.current) return
    g.current.rotation.z = t * 0.25
    g.current.rotation.x = Math.sin(t * 0.3) * 0.4
  })
  const ring = (r: number, tube: number, tilt: number, key: string): ReactNode => (
    <mesh key={key} rotation={[tilt, tilt * 0.5, 0]}>
      <torusGeometry args={[r, tube, 16, 100]} />
      <meshStandardMaterial color="#e11d2a" emissive="#ff2b3a" emissiveIntensity={2.4} toneMapped={false} />
    </mesh>
  )
  return (
    <group ref={g}>
      {ring(3.1, 0.012, 0.4, 'a')}
      {ring(3.5, 0.008, 1.2, 'b')}
      {ring(2.7, 0.01, -0.6, 'c')}
    </group>
  )
}

/* A single floating weight plate that drifts + spins on its own axis */
function WeightPlate({
  position,
  scale = 1,
  speed = 1,
}: {
  position: [number, number, number]
  scale?: number
  speed?: number
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (!ref.current) return
    ref.current.rotation.z = t * 0.3 * speed
    ref.current.rotation.x = 0.4 + Math.sin(t * 0.5 * speed) * 0.2
    ref.current.position.y = position[1] + Math.sin(t * 0.6 * speed + position[0]) * 0.35
  })
  return (
    <group ref={ref} position={position} scale={scale}>
      {/* outer rim */}
      <mesh>
        <torusGeometry args={[0.7, 0.16, 20, 48]} />
        <meshStandardMaterial {...redMetal} emissiveIntensity={0.5} />
      </mesh>
      {/* plate body */}
      <mesh>
        <cylinderGeometry args={[0.72, 0.72, 0.14, 48]} />
        <meshStandardMaterial color="#18181c" metalness={0.8} roughness={0.35} />
      </mesh>
      {/* center hub */}
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.18, 32]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
    </group>
  )
}

/* Floating glass orb for depth */
function GlassOrb() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ref.current) ref.current.position.x = -4.2 + Math.sin(t * 0.4) * 0.3
  })
  return (
    <mesh ref={ref} position={[-4.2, 1.6, -3]}>
      <sphereGeometry args={[0.9, 64, 64]} />
      <MeshTransmissionMaterial
        thickness={0.6}
        roughness={0.05}
        transmission={1}
        ior={1.4}
        chromaticAberration={0.4}
        backside
        color="#ff5560"
      />
    </mesh>
  )
}

/* A gooey red blob using MeshDistortMaterial — extra WebGL richness, low poly cost */
function EnergyBlob() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.y = t * 0.2
      ref.current.position.x = 4.6 + Math.sin(t * 0.35) * 0.25
    }
  })
  return (
    <mesh ref={ref} position={[4.6, -1.4, -3.5]}>
      <icosahedronGeometry args={[0.85, 12]} />
      <MeshDistortMaterial
        color="#e11d2a"
        emissive="#7a0f16"
        emissiveIntensity={0.6}
        roughness={0.2}
        metalness={0.4}
        distort={0.45}
        speed={2}
      />
    </mesh>
  )
}

/* Drifting particle field */
function Particles({ count = 800 }: { count?: number }) {
  const points = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 0] = (Math.random() - 0.5) * 28
      arr[i * 3 + 1] = (Math.random() - 0.5) * 16
      arr[i * 3 + 2] = (Math.random() - 0.5) * 16 - 4
    }
    return arr
  }, [count])
  useFrame((state) => {
    if (!points.current) return
    const t = state.clock.getElapsedTime()
    points.current.rotation.y = t * 0.04
    points.current.position.y = Math.sin(t * 0.2) * 0.4
  })
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#ff3b48"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        toneMapped={false}
      />
    </points>
  )
}

export default function Hero3D() {
  return (
    <Canvas
      className="hero-canvas"
      camera={{ position: [0, 0.5, 8], fov: 42 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ResponsiveCamera />
      <color attach="background" args={['#08080a']} />
      <fog attach="fog" args={['#08080a', 9, 24]} />

      <ambientLight intensity={0.35} />
      <spotLight position={[8, 10, 8]} angle={0.3} penumbra={1} intensity={2.6} color="#ffffff" castShadow />
      <pointLight position={[-6, -4, -2]} intensity={2.4} color="#e11d2a" />
      <pointLight position={[6, 3, 4]} intensity={1.6} color="#ff2b3a" />

      <Particles />
      <GlassOrb />
      <EnergyBlob />

      {/* floating gym equipment drifting around the centerpiece */}
      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.2}>
        <WeightPlate position={[-3.4, -1.8, -1]} scale={0.9} speed={1.1} />
      </Float>
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1}>
        <WeightPlate position={[3.6, 2, -1.5]} scale={0.7} speed={1.4} />
      </Float>
      <Float speed={1.2} rotationIntensity={0.4} floatIntensity={1.3}>
        <WeightPlate position={[2.2, -2.4, 0.5]} scale={0.55} speed={0.9} />
      </Float>
      {/* kettlebell, top-left */}
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.4}>
        <Spin speed={0.4} position={[-4, 1.9, -1.5]} scale={0.9} rotation={[0.3, 0, 0.2]}>
          <Kettlebell />
        </Spin>
      </Float>
      {/* loaded barbell, drifting low-right, tilted */}
      <Float speed={1.1} rotationIntensity={0.3} floatIntensity={1}>
        <Spin speed={0.25} axis="x" position={[3.9, -2.1, -2.5]} scale={0.62} rotation={[0.4, 0.5, 0.3]}>
          <Barbell />
        </Spin>
      </Float>

      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.9}>
        <Dumbbell scale={1.05} />
        <EnergyRings />
      </Float>

      {/* neon grid floor */}
      <Grid
        position={[0, -3.4, 0]}
        args={[40, 40]}
        cellSize={0.7}
        cellThickness={0.6}
        cellColor="#3a0a0f"
        sectionSize={3}
        sectionThickness={1.2}
        sectionColor="#e11d2a"
        fadeDistance={26}
        fadeStrength={1.5}
        infiniteGrid
      />

      <Environment preset="night" />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.9} mipmapBlur />
        <ChromaticAberration
          offset={new THREE.Vector2(0.0006, 0.0006)}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette eskil={false} offset={0.15} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  )
}
