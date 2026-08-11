import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { useInView } from '../lib/useInView'

/* Soft round sprite texture for realistic steam puffs */
function useSteamTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 64
    const ctx = c.getContext('2d')!
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 64, 64)
    return new THREE.CanvasTexture(c)
  }, [])
}

/* Rising steam column above the heater */
function Steam({ count = 140 }: { count?: number }) {
  const tex = useSteamTexture()
  const ref = useRef<THREE.Points>(null)
  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 1.4
      positions[i * 3 + 1] = Math.random() * 3.2 - 0.4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.4
      speeds[i] = 0.15 + Math.random() * 0.3
    }
    return { positions, speeds }
  }, [count])

  /* Scratch objects + reusable state so the pointer-repel loop allocates nothing. */
  const cursor = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])
  const moved = useRef(false)
  const prevPointer = useRef({ x: 0, y: 0 })

  useFrame((state, delta) => {
    const pts = ref.current
    if (!pts) return

    // Only start repelling once the pointer has actually moved, so the column
    // isn't blown apart from the default (0,0) pointer on first paint.
    const p = state.pointer
    if (p.x !== prevPointer.current.x || p.y !== prevPointer.current.y) {
      moved.current = true
      prevPointer.current.x = p.x
      prevPointer.current.y = p.y
    }

    // Project the pointer onto the steam plane (z≈0 in world), then bring it
    // into the points' local space so it stays aligned through the Float wobble.
    let cx = Infinity
    let cy = Infinity
    if (moved.current) {
      cursor.set(p.x, p.y, 0.5).unproject(state.camera)
      dir.copy(cursor).sub(state.camera.position).normalize()
      const t = -state.camera.position.z / dir.z
      cursor.copy(state.camera.position).addScaledVector(dir, t)
      pts.worldToLocal(cursor)
      cx = cursor.x
      cy = cursor.y
    }

    const R = 1.05 // influence radius
    const strength = 2.6 // how hard the steam is pushed away

    const arr = pts.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i] * delta
      // gentle sway
      arr[i * 3 + 0] += Math.sin(arr[i * 3 + 1] * 2 + i) * 0.0015

      // push away from the cursor with a smooth radial falloff
      const dx = arr[i * 3 + 0] - cx
      const dy = arr[i * 3 + 1] - cy
      const d2 = dx * dx + dy * dy
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1e-4
        const f = 1 - d / R // 1 at the cursor, 0 at the edge
        const push = f * f * strength * delta
        arr[i * 3 + 0] += (dx / d) * push
        arr[i * 3 + 1] += (dy / d) * push
      }

      if (arr[i * 3 + 1] > 3) {
        arr[i * 3 + 1] = -0.4
        arr[i * 3 + 0] = (Math.random() - 0.5) * 1.4
        arr[i * 3 + 2] = (Math.random() - 0.5) * 1.4
      }
    }
    pts.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={ref} position={[0, 0.4, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={tex}
        size={0.7}
        transparent
        opacity={0.32}
        depthWrite={false}
        sizeAttenuation
        color="#f3ece4"
      />
    </points>
  )
}

/* A pile of glowing sauna rocks */
function Rocks() {
  const stones = useMemo(() => {
    const arr: { p: [number, number, number]; s: number }[] = []
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2
      const r = 0.12 + Math.random() * 0.22
      arr.push({
        p: [Math.cos(a) * r, 0.05 + Math.random() * 0.12, Math.sin(a) * r],
        s: 0.1 + Math.random() * 0.08,
      })
    }
    return arr
  }, [])
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    // flicker the ember glow
    if (ref.current) {
      const flick = 0.7 + Math.sin(state.clock.elapsedTime * 6) * 0.15 + Math.random() * 0.1
      ref.current.children.forEach((m) => {
        const mat = (m as THREE.Mesh).material as THREE.MeshStandardMaterial
        if (mat) mat.emissiveIntensity = flick
      })
    }
  })
  return (
    <group ref={ref} position={[0, 0.28, 0]}>
      {stones.map((st, i) => (
        <mesh key={i} position={st.p} scale={st.s}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#3a3330" emissive="#ff5a1e" emissiveIntensity={0.8} roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* Traditional sauna heater (kiuas) with a wooden slat wall behind. */
function SaunaRoom() {
  const wood = { color: '#5a3a22', roughness: 0.85, metalness: 0.05 }
  const woodDark = { color: '#432c1a', roughness: 0.9, metalness: 0.05 }
  const metal = { color: '#2a2a2e', roughness: 0.5, metalness: 0.9 }

  return (
    <group position={[0, -1.2, 0]}>
      {/* wooden slat back wall */}
      <group position={[0, 1.6, -1.6]}>
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[0, i * 0.34 - 0.4, 0]}>
            <boxGeometry args={[5, 0.3, 0.12]} />
            <meshStandardMaterial {...(i % 2 ? woodDark : wood)} />
          </mesh>
        ))}
      </group>

      {/* wooden bench */}
      <mesh position={[0, 0.05, 0.9]}>
        <boxGeometry args={[4.4, 0.16, 1]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      <mesh position={[0, -0.35, 1.25]}>
        <boxGeometry args={[4.4, 0.16, 0.8]} />
        <meshStandardMaterial {...woodDark} />
      </mesh>

      {/* heater body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.55, 0.62, 1, 6]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* heater top rim */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.05, 12, 6]} />
        <meshStandardMaterial {...metal} />
      </mesh>

      <Rocks />
      <Steam />

      {/* warm glow from the coals */}
      <pointLight position={[0, 0.5, 0.2]} intensity={3} distance={5} color="#ff7a2e" />
      <pointLight position={[0, 2.4, 0.5]} intensity={0.8} distance={6} color="#ffd9a0" />
    </group>
  )
}

/* Right-column 3D sauna/steam vignette for the creed band.
   Only mounts while near the viewport; capped dpr + lighter bloom for perf. */
export default function SaunaScene() {
  const { ref, inView } = useInView<HTMLDivElement>('200px 0px')
  return (
    <div ref={ref} className="sauna-canvas" aria-hidden="true">
      {inView && (
        <Canvas
          camera={{ position: [0, 0.4, 5.2], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.35} color="#ffcfa0" />
          <spotLight position={[3, 5, 4]} angle={0.5} penumbra={1} intensity={1.2} color="#ffe0b0" />
          <Float speed={1} rotationIntensity={0.15} floatIntensity={0.4}>
            <SaunaRoom />
          </Float>
          <Environment preset="warehouse" />
          <EffectComposer>
            <Bloom intensity={0.55} luminanceThreshold={0.4} luminanceSmoothing={0.9} mipmapBlur />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  )
}
