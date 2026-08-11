import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

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
        <Plate position={[-3, 1.2, 0]} scale={1} spin={1.1} />
      </Float>
      <Float speed={1.2} rotationIntensity={0.5} floatIntensity={1.1}>
        <Plate position={[3.2, -0.8, -1]} scale={0.75} spin={-0.9} />
      </Float>
      <Float speed={2} rotationIntensity={0.6} floatIntensity={1.6}>
        <Plate position={[1.6, 1.8, -2]} scale={0.5} spin={1.4} />
      </Float>
      <Float speed={1.4} rotationIntensity={0.4} floatIntensity={1.2}>
        <Blob position={[-2.4, -1.4, -1.5]} scale={0.8} />
      </Float>
    </group>
  )
}

/* Ambient WebGL layer behind the Membership section. */
export default function FloatingWeights() {
  return (
    <Canvas className="weights-canvas" camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.6]} gl={{ alpha: true, antialias: true }}>
      <ambientLight intensity={0.4} />
      <pointLight position={[-6, 4, 4]} intensity={2} color="#e11d2a" />
      <pointLight position={[6, -3, 2]} intensity={1.4} color="#ff2b3a" />
      <spotLight position={[0, 8, 6]} angle={0.4} penumbra={1} intensity={1.6} color="#ffffff" />
      <Rig />
      <Environment preset="night" />
    </Canvas>
  )
}
