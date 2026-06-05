/** Champ de particules audio-réactif, attiré par la lumière-curseur. */
import { useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bus } from '../state/store'
import { particlesFragment, particlesVertex } from './shaders'

const COLOR_A = new THREE.Color('#00ff9d')
const COLOR_B = new THREE.Color('#0a3326')

export function Particles({
  count,
  pointerWorld,
}: {
  count: number
  /** Réf vivante de la position monde de la lumière-curseur. */
  pointerWorld: React.MutableRefObject<THREE.Vector3>
}): ReactElement {
  const matRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    // RNG déterministe (évite Math.random pour un rendu stable)
    let s = 0x9e3779b9
    const rand = (): number => {
      s = (s * 1664525 + 1013904223) >>> 0
      return s / 0xffffffff
    }
    for (let i = 0; i < count; i += 1) {
      // Distribution dans un volume vertical (la "colonne" de la descente)
      const r = Math.pow(rand(), 0.6) * 7
      const a = rand() * Math.PI * 2
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = (rand() - 0.5) * 16
      positions[i * 3 + 2] = Math.sin(a) * r - 2
      seeds[i] = rand()
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uBands: { value: new THREE.Vector3() },
      uPointer: { value: new THREE.Vector3() },
      uScroll: { value: 0 },
      uSize: { value: 1.0 },
      uColorA: { value: COLOR_A.clone() },
      uColorB: { value: COLOR_B.clone() },
    }),
    [],
  )

  useFrame((state) => {
    const u = matRef.current?.uniforms
    if (!u) return
    u.uTime.value = state.clock.elapsedTime
    u.uAudio.value = bus.audio
    u.uBands.value.set(bus.bands.low, bus.bands.mid, bus.bands.high)
    u.uPointer.value.copy(pointerWorld.current)
    u.uScroll.value = bus.scroll
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={particlesVertex}
        fragmentShader={particlesFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
