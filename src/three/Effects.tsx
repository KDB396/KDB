/** Post-processing global du canvas persistant — look "clip / KDB_OS". */
import { useMemo, type ReactElement } from 'react'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

export function Effects({ compact }: { compact: boolean }): ReactElement {
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0009), [])

  return (
    <EffectComposer enableNormalPass={false} multisampling={compact ? 0 : 2}>
      {/* Bloom = halo autour de l'orbe curseur uniquement, pas une nappe globale */}
      <Bloom
        intensity={compact ? 0.28 : 0.4}
        luminanceThreshold={0.8}
        luminanceSmoothing={0.3}
        mipmapBlur
        radius={0.4}
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
      />
      {/* Grain CRT — OVERLAY (n'éclaircit JAMAIS le fond), très discret */}
      <Noise blendFunction={BlendFunction.OVERLAY} opacity={0.05} />
      <Vignette offset={0.3} darkness={0.6} eskil={false} />
    </EffectComposer>
  )
}
