import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { HexDumbbell, Kettlebell, Barbell, WeightPlate, Spin } from './equipment'

type Piece = 'dumbbell' | 'kettlebell' | 'barbell' | 'plate'

const PIECE = {
  dumbbell: HexDumbbell,
  kettlebell: Kettlebell,
  barbell: Barbell,
  plate: WeightPlate,
} as const

interface Item {
  piece: Piece
  position: [number, number, number]
  scale?: number
  spin?: number
}

/* Gentle pointer parallax on the whole group */
function Rig({ items }: { items: Item[] }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const { x, y } = state.pointer
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.25, 0.04)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.15, 0.04)
  })
  return (
    <group ref={group}>
      {items.map((it, i) => {
        const Comp = PIECE[it.piece]
        return (
          <Float key={i} speed={1.2 + i * 0.2} rotationIntensity={0.5} floatIntensity={1.2}>
            <Spin
              speed={it.spin ?? 0.35}
              position={it.position}
              scale={it.scale ?? 1}
              rotation={[0.3, 0.2, 0.15]}
            >
              <Comp />
            </Spin>
          </Float>
        )
      })}
    </group>
  )
}

/* Ambient equipment canvas that only mounts while near the viewport. */
export default function EquipmentBackdrop({
  items,
  className = 'equip-canvas',
}: {
  items: Item[]
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { rootMargin: '200px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={wrapRef} className={className} aria-hidden="true">
      {visible && (
        <Canvas camera={{ position: [0, 0, 7], fov: 45 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[-6, 4, 4]} intensity={1.8} color="#e11d2a" />
          <pointLight position={[6, -3, 2]} intensity={1.2} color="#ff2b3a" />
          <spotLight position={[0, 8, 6]} angle={0.4} penumbra={1} intensity={1.4} color="#ffffff" />
          <Rig items={items} />
          <Environment preset="night" />
        </Canvas>
      )}
    </div>
  )
}
