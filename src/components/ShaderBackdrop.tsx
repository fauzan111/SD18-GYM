import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useInView } from '../lib/useInView'

/* ---- Custom GLSL: a slow flowing red/black energy field (fbm noise) ---- */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;

  // 2D hash + value noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 3.0;
    p.x += uTime * 0.06;
    p.y += uTime * 0.03;

    float n = fbm(p + fbm(p + uTime * 0.05));
    float glow = smoothstep(0.2, 0.9, n);

    // red -> deep crimson -> black palette
    vec3 red = vec3(0.882, 0.114, 0.165);
    vec3 crimson = vec3(0.30, 0.03, 0.06);
    vec3 black = vec3(0.03, 0.03, 0.04);

    vec3 col = mix(black, crimson, glow);
    col = mix(col, red, pow(glow, 3.0) * 0.8);

    // soft moving highlight following pointer
    float d = distance(uv, uMouse);
    col += red * smoothstep(0.5, 0.0, d) * 0.25;

    // vignette
    float vig = smoothstep(1.1, 0.2, length(uv - 0.5));
    col *= vig;

    gl_FragColor = vec4(col, 1.0);
  }
`

function Plane() {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { viewport, pointer } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    }),
    []
  )

  useFrame((_, delta) => {
    if (!mat.current) return
    uniforms.uTime.value += delta
    // ease pointer (-1..1) into uv space (0..1)
    uniforms.uMouse.value.x += (pointer.x * 0.5 + 0.5 - uniforms.uMouse.value.x) * 0.05
    uniforms.uMouse.value.y += (pointer.y * 0.5 + 0.5 - uniforms.uMouse.value.y) * 0.05
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={mat}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

/* Fullscreen animated WebGL gradient — used as a section background strip.
   Only mounts the WebGL context while the band is near the viewport. */
export default function ShaderBackdrop() {
  const { ref, inView } = useInView<HTMLDivElement>('200px 0px')
  return (
    <div ref={ref} className="shader-canvas" aria-hidden="true">
      {inView && (
        <Canvas orthographic camera={{ position: [0, 0, 1], zoom: 1 }} dpr={[1, 1.5]}>
          <Plane />
        </Canvas>
      )}
    </div>
  )
}
