/**
 * La figure KDB (kdb.glb), seule dans le vide.
 * Matériau volontairement SOMBRE : silhouette quasi invisible au repos,
 * révélée quand la lumière-curseur passe dessus. C'est le cœur du concept.
 */
import { useMemo, useRef, type ReactElement } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import { bus } from '../state/store'

const MODEL_PATH = `${import.meta.env.BASE_URL}models/kdb.glb`
useGLTF.preload(MODEL_PATH)

export function KdbFigure({ compact }: { compact: boolean }): ReactElement {
  const { scene } = useGLTF(MODEL_PATH)
  const ref = useRef<Group>(null)

  // Matériau sombre partagé : roches dans le noir, révélé par la pointLight curseur.
  // Léger rim émissif vert pour décrocher la silhouette du fond.
  const darkMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#0b0d0c'),
        roughness: 0.7,
        metalness: 0.1,
        emissive: new THREE.Color('#00ff9d'),
        emissiveIntensity: 0.035,
      }),
    [],
  )

  const model = useMemo(() => {
    const m = scene.clone()
    m.traverse((o) => {
      const mesh = o as THREE.Mesh
      if (mesh.isMesh) {
        mesh.material = darkMat
        mesh.castShadow = false
        mesh.receiveShadow = false
      }
    })
    return m
  }, [scene, darkMat])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g) return
    g.rotation.y += delta * 0.12
    const t = state.clock.elapsedTime
    g.position.y = -0.2 + Math.sin(t * 0.6) * 0.05
    const s = (compact ? 1.05 : 1.2) * (1 + bus.bands.low * 0.04)
    g.scale.setScalar(s)
  })

  return (
    <group ref={ref}>
      <primitive object={model} dispose={null} />
    </group>
  )
}
