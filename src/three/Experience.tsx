/**
 * Canvas persistant KDB_OS — vit derrière toute l'UI, ne se démonte jamais.
 * Assemble : fond clips (melt) · lumière-curseur · post-fx.
 * La caméra plonge légèrement au scroll ; l'audio est échantillonné par frame.
 */
import { useRef, type ReactElement } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import * as THREE from 'three'
import { bus, useKdb } from '../state/store'
import { sampleAudio } from '../audio/audio'
import { VideoVoid } from './VideoVoid'
import { CursorRig } from './CursorRig'
import { Effects } from './Effects'

/** Pilote global : audio + caméra (parallaxe pointeur, plongée au scroll). */
function FrameDriver({ reducedMotion }: { reducedMotion: boolean }): null {
  const target = useRef(new THREE.Vector3(0, 0.3, 0))

  useFrame((state) => {
    sampleAudio(state.clock.elapsedTime)

    const cam = state.camera
    const parX = reducedMotion ? 0 : bus.pointer.x * 0.6
    const parY = reducedMotion ? 0 : bus.pointer.y * 0.4
    const pushIn = bus.scroll * 1.6

    cam.position.x += (parX - cam.position.x) * 0.05
    cam.position.y += (0.3 + parY - bus.scroll * 0.8 - cam.position.y) * 0.05
    cam.position.z += (7 - pushIn - cam.position.z) * 0.05
    cam.lookAt(target.current)
  })

  return null
}

export function Experience(): ReactElement {
  const compact = useKdb((s) => s.compact)
  const reducedMotion = useKdb((s) => s.reducedMotion)
  const pointerWorld = useRef(new THREE.Vector3(0, 0.6, 2.4))

  return (
    <Canvas
      className="!fixed inset-0 h-full w-full"
      frameloop="always"
      dpr={compact ? [1, 1.5] : [1, 2]}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: compact ? 'default' : 'high-performance',
        stencil: false,
        depth: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      camera={{ position: [0, 0.3, 7], fov: 42, near: 0.1, far: 100 }}
    >
      <color attach="background" args={['#040605']} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />

      <FrameDriver reducedMotion={reducedMotion} />

      <VideoVoid />

      {/* CursorRig conservé : il lisse bus.pointer (la parallaxe caméra en dépend). */}
      <CursorRig pointerWorld={pointerWorld} compact={compact} />

      <Effects compact={compact} />
    </Canvas>
  )
}
