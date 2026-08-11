import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { HexDumbbell, Kettlebell, Barbell, Spin } from './equipment'
import { useInView } from '../lib/useInView'

const chrome = { color: '#c8c9d0', metalness: 1, roughness: 0.14, envMapIntensity: 1.6 }
const dark = { color: '#141418', metalness: 0.85, roughness: 0.35 }

/* A single stylised weight plate */
function Plate({
  position,
  scale = 1,
  spin = 1,
}: {
  position: [number, number, number]
  scale?: number
  spin?: number
}) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ref.current) ref.current.rotation.z = t * 0.25 * spin
  })
  return (
    <group ref={ref} position={position} scale={scale} rotation={[0.5, 0.3, 0]}>
      <mesh>
        <torusGeometry args={[0.8, 0.18, 20, 48]} />
        <meshStandardMaterial color="#e11d2a" metalness={0.9} roughness={0.2} emissive="#e11d2a" emissiveIntensity={0.35} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.82, 0.82, 0.16, 48]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.24, 0.24, 0.2, 32]} />
        <meshStandardMaterial {...chrome} />
      </mesh>
    </group>
  )
}

/* Gooey energy sphere for a soft accent */
function Blob({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale}>
      <icosahedronGeometry args={[0.8, 12]} />
      <MeshDistortMaterial color="#e11d2a" emissive="#4a0a10" emissiveIntensity={0.5} roughness={0.25} metalness={0.35} distort={0.4} speed={1.6} />
    </mesh>
  )
}

/* Whole rig gets a gentle pointer + scroll parallax */
function Rig() {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const { x, y } = state.pointer
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.3, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.2, 0.04)
  })
  return (
    <group ref={group}>
      <Float speed={1.6} rotationIntensity={0.7} floatIntensity={1.4}>
        <Plate position={[-3.4, 1.4, 0]} scale={0.8} spin={1.1} />
      </Float>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.6}>
        <Plate position={[1.6, 1.8, -2]} scale={0.5} spin={1.4} />
      </Float>
      {/* dumbbell */}
      <Float speed={1.3} rotationIntensity={0.6} floatIntensity={1.2}>
        <Spin speed={0.4} position={[3, 1, -1]} scale={0.7} rotation={[0.3, 0.2, 0.2]}>
          <HexDumbbell />
        </Spin>
      </Float>
      {/* kettlebell */}
      <Float speed={1.5} rotationIntensity={0.8} floatIntensity={1.5}>
        <Spin speed={0.5} position={[-2.6, -1.3, -0.5]} scale={0.85} rotation={[0.2, 0, 0.15]}>
          <Kettlebell />
        </Spin>
      </Float>
      {/* barbell in the deep background */}
      <Float speed={1} rotationIntensity={0.3} floatIntensity={0.9}>
        <Spin speed={0.2} axis="x" position={[2.6, -1.6, -3]} scale={0.5} rotation={[0.4, 0.3, 0.25]}>
          <Barbell />
        </Spin>
      </Float>
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
        <Blob position={[-3.6, -1.2, -2]} scale={0.7} />
      </Float>
    </group>
  )
}

/* Ambient WebGL layer behind the Membership section.
   Only mounts while near the viewport so it stops rendering off-screen. */
export default function FloatingWeights() {
  const { ref, inView } = useInView<HTMLDivElement>('200px 0px')
  return (
    <div ref={ref} className="weights-canvas" aria-hidden="true">
      {inView && (
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[-6, 4, 4]} intensity={2} color="#e11d2a" />
          <pointLight position={[6, -3, 2]} intensity={1.4} color="#ff2b3a" />
          <spotLight position={[0, 8, 6]} angle={0.4} penumbra={1} intensity={1.6} color="#ffffff" />
          <Rig />
          <Environment preset="night" />
        </Canvas>
      )}
    </div>
  )
}
