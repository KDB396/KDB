/** Plan plein écran : la nébuleuse-vide derrière toute la scène. */
import { useMemo, useRef, type ReactElement } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { bus } from '../state/store'
import { voidFragment, voidVertex } from './shaders'

const ACCENT = new THREE.Color('#00ff9d')

export function VoidBackground(): ReactElement {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const size = useThree((s) => s.size)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uScroll: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uRes: { value: new THREE.Vector2(1, 1) },
      uAccent: { value: ACCENT.clone() },
    }),
    [],
  )

  useFrame((state) => {
    const u = matRef.current?.uniforms
    if (!u) return
    u.uTime.value = state.clock.elapsedTime
    u.uAudio.value = bus.audio
    u.uScroll.value = bus.scroll
    u.uPointer.value.set(bus.pointer.x, bus.pointer.y)
    u.uRes.value.set(size.width, size.height)
  })

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={voidVertex}
        fragmentShader={voidFragment}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
