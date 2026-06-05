/**
 * Lumière-curseur : un orbe lumineux qui suit le pointeur en espace monde.
 * C'est la "présence" du visiteur — la seule vraie source de lumière du vide.
 * Lisse aussi bus.pointer (cible → réel) pour toute la scène.
 */
import { useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { bus } from '../state/store'

const SPAN_X = 4.2
const SPAN_Y = 2.6

export function CursorRig({
  pointerWorld,
  compact,
}: {
  pointerWorld: React.MutableRefObject<THREE.Vector3>
  compact: boolean
}): ReactElement {
  const lightRef = useRef<THREE.PointLight>(null)
  const orbRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    const a = Math.min(1, delta * 6)
    bus.pointer.x += (bus.pointer.tx - bus.pointer.x) * a
    bus.pointer.y += (bus.pointer.ty - bus.pointer.y) * a

    const wx = bus.pointer.x * SPAN_X
    const wy = bus.pointer.y * SPAN_Y + 0.6
    const wz = 2.4
    pointerWorld.current.set(wx, wy, wz)

    const light = lightRef.current
    if (light) {
      light.position.set(wx, wy, wz)
      light.intensity = (compact ? 9 : 14) * (0.7 + bus.audio * 0.8)
    }
    const orb = orbRef.current
    if (orb) {
      orb.position.set(wx, wy, wz)
      const s = 0.06 + bus.audio * 0.05
      orb.scale.setScalar(s)
    }
  })

  return (
    <>
      <pointLight
        ref={lightRef}
        color="#9dffe0"
        intensity={compact ? 9 : 14}
        distance={compact ? 13 : 18}
        decay={2}
      />
      <mesh ref={orbRef} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#caffef" toneMapped={false} />
      </mesh>
    </>
  )
}
