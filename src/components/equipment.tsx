import { useRef } from 'react'
import { useFrame, type GroupProps } from '@react-three/fiber'
import * as THREE from 'three'

/* Shared PBR materials */
export const mat = {
  chrome: { color: '#cdced4', metalness: 1, roughness: 0.16, envMapIntensity: 1.8 },
  steel: { color: '#8a8b93', metalness: 1, roughness: 0.3, envMapIntensity: 1.4 },
  rubber: { color: '#151519', metalness: 0.2, roughness: 0.75 },
  red: {
    color: '#e11d2a',
    metalness: 0.6,
    roughness: 0.3,
    emissive: '#e11d2a',
    emissiveIntensity: 0.5,
  },
} as const

/* ============================================================
   REALISTIC HEX RUBBER DUMBBELL
   Chrome knurled handle + two black hexagonal rubber heads,
   chrome collars, chrome end caps, red SD18 accent ring.
   Built along the X axis.
   ============================================================ */
export function HexDumbbell(props: GroupProps) {
  const HEAD_X = 1.28
  return (
    <group {...props}>
      {/* --- handle --- */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* smooth shaft */}
        <mesh castShadow>
          <cylinderGeometry args={[0.135, 0.135, 2.5, 32]} />
          <meshStandardMaterial {...mat.chrome} />
        </mesh>
        {/* knurled grip (rougher, slightly fatter) */}
        <mesh castShadow>
          <cylinderGeometry args={[0.155, 0.155, 1.15, 24]} />
          <meshStandardMaterial color="#b9bac2" metalness={1} roughness={0.62} />
        </mesh>
      </group>

      {[1, -1].map((dir) => (
        <group key={dir} position={[dir * HEAD_X, 0, 0]}>
          {/* chrome collar where handle meets head */}
          <mesh position={[-dir * 0.42, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.16, 32]} />
            <meshStandardMaterial {...mat.chrome} />
          </mesh>

          {/* hexagonal rubber head */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.82, 0.82, 0.72, 6]} />
            <meshStandardMaterial {...mat.rubber} />
          </mesh>
          {/* subtle rounded inner hex for a moulded look */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.7, 0.7, 0.74, 6]} />
            <meshStandardMaterial color="#0e0e11" metalness={0.2} roughness={0.85} />
          </mesh>

          {/* red SD18 accent ring on the outer face */}
          <mesh position={[dir * 0.38, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.5, 0.045, 12, 32]} />
            <meshStandardMaterial {...mat.red} />
          </mesh>
          {/* chrome end cap */}
          <mesh position={[dir * 0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.24, 0.24, 0.14, 24]} />
            <meshStandardMaterial {...mat.chrome} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ============================================================
   KETTLEBELL — cast-iron bell body + chrome handle
   ============================================================ */
export function Kettlebell(props: GroupProps) {
  return (
    <group {...props}>
      {/* bell body */}
      <mesh scale={[1, 0.92, 1]} position={[0, -0.15, 0]} castShadow>
        <sphereGeometry args={[0.62, 40, 40]} />
        <meshStandardMaterial color="#17171b" metalness={0.55} roughness={0.45} />
      </mesh>
      {/* flat base */}
      <mesh position={[0, -0.66, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.12, 32]} />
        <meshStandardMaterial color="#101013" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* neck */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.28, 0.28, 24]} />
        <meshStandardMaterial {...mat.steel} />
      </mesh>
      {/* arched handle */}
      <mesh position={[0, 0.62, 0]}>
        <torusGeometry args={[0.3, 0.075, 16, 40, Math.PI]} />
        <meshStandardMaterial {...mat.chrome} />
      </mesh>
      {/* handle legs */}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.5, 0]}>
          <cylinderGeometry args={[0.075, 0.075, 0.3, 16]} />
          <meshStandardMaterial {...mat.chrome} />
        </mesh>
      ))}
    </group>
  )
}

/* ============================================================
   BARBELL — chrome bar loaded with plates on both ends
   (scale it down when placing; the bar is ~5 units long)
   ============================================================ */
export function Barbell(props: GroupProps) {
  const plate = (x: number, r: number, dir: number) => (
    <group position={[x, 0, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, 0.14, 40]} />
        <meshStandardMaterial {...mat.rubber} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[r - 0.03, 0.03, 12, 40]} />
        <meshStandardMaterial {...mat.red} />
      </mesh>
      <mesh position={[dir * 0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.2, 24]} />
        <meshStandardMaterial {...mat.chrome} />
      </mesh>
    </group>
  )
  return (
    <group {...props}>
      {/* bar */}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.075, 0.075, 5, 24]} />
        <meshStandardMaterial {...mat.chrome} />
      </mesh>
      {/* sleeves + collars each side */}
      {[1, -1].map((dir) => (
        <group key={dir}>
          {plate(dir * 1.7, 0.62, dir)}
          {plate(dir * 1.95, 0.55, dir)}
          {plate(dir * 2.16, 0.46, dir)}
          {/* outer collar */}
          <mesh position={[dir * 2.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.22, 20]} />
            <meshStandardMaterial {...mat.steel} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* ============================================================
   WEIGHT PLATE — single rubber bumper plate with red rim
   ============================================================ */
export function WeightPlate(props: GroupProps) {
  return (
    <group {...props}>
      <mesh>
        <torusGeometry args={[0.72, 0.16, 20, 48]} />
        <meshStandardMaterial {...mat.red} emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.74, 0.74, 0.14, 48]} />
        <meshStandardMaterial {...mat.rubber} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.18, 32]} />
        <meshStandardMaterial {...mat.chrome} />
      </mesh>
    </group>
  )
}

/* Small helper: spins a wrapped piece on its own axis while drifting */
export function Spin({
  children,
  speed = 0.3,
  axis = 'y',
  ...props
}: GroupProps & { speed?: number; axis?: 'x' | 'y' | 'z'; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) ref.current.rotation[axis] = state.clock.getElapsedTime() * speed
  })
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  )
}
