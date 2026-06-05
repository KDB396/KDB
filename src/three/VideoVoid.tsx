/**
 * VideoVoid — fond plein écran qui lit les vrais clips (public/clips/clip1-4.mp4)
 * en VideoTexture et les fait FONDRE l'un dans l'autre par un melt de bruit,
 * le tout étalonné SOMBRE (le footage devient l'ambiance, pas le sujet).
 *
 * Implémentation : 2 éléments <video> seulement (front/back) dont on fait
 * tourner les 4 sources → on ne décode que 2 flux à la fois (perf mobile).
 * Respecte compact (preload) et reducedMotion (melt → simple fondu).
 */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { bus, useKdb } from '../state/store'
import { clearAnalyser, setAnalyser } from '../audio/audio'

// --- Réglages (pilotent le rythme ; ne toucher que si demandé) -------------
/** Durée d'affichage d'un clip avant le fondu (s). */
const HOLD = 6.5
/** Durée du melt/fondu entre deux clips (s). */
const MELT = 2.6
/** Ratio des clips (16:9 par défaut — ajuster si vertical, ex. 9/16). */
const MEDIA_ASPECT = 16 / 9

const ACCENT = new THREE.Color('#00ff9d')
const CLIPS = [
  `${import.meta.env.BASE_URL}clips/clip1.mp4`,
  `${import.meta.env.BASE_URL}clips/clip2.mp4`,
  `${import.meta.env.BASE_URL}clips/clip3.mp4`,
  `${import.meta.env.BASE_URL}clips/clip4.mp4`,
]

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main(){
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTexFront;
  uniform sampler2D uTexBack;
  uniform float uMix;        // 0 = front, 1 = back
  uniform float uMelt;       // 0 = fondu simple, 1 = melt par bruit
  uniform float uTime;
  uniform float uAudio;
  uniform vec2  uRes;
  uniform float uMediaAspect;
  uniform vec3  uAccent;

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
  float vnoise2(vec2 p){
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), u.x),
               mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), u.x), u.y);
  }

  // Cover-fit (remplit l'écran sans déformer, en croppant)
  vec2 coverUv(vec2 uv){
    float sa = uRes.x / max(uRes.y, 1.0);
    vec2 s = uv - 0.5;
    if (sa > uMediaAspect) s.y *= uMediaAspect / sa;
    else                   s.x *= sa / uMediaAspect;
    return s + 0.5;
  }

  void main(){
    vec2 uv = coverUv(vUv);
    vec3 front = texture2D(uTexFront, uv).rgb;
    vec3 back  = texture2D(uTexBack,  uv).rgb;

    float reveal;
    if (uMelt > 0.5){
      float nz = vnoise2(vUv * vec2(6.0*uMediaAspect, 6.0)
                         + vnoise2(vUv*3.0 + uTime*0.05));
      float e = 0.18;
      reveal = smoothstep(nz - e, nz + e, uMix);
    } else {
      reveal = uMix;
    }
    vec3 col = mix(front, back, reveal);

    // --- Étalonnage SOMBRE -------------------------------------------------
    col = pow(col, vec3(1.25));                 // contraste / écrase les noirs
    col *= 0.40 + uAudio * 0.10;                // assombrit (respire au son)
    float luma = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(col, col * uAccent * 1.6,
              smoothstep(0.22, 0.0, luma) * 0.25); // ombres teintées vert

    // Scanline fine + vignette
    col *= 0.96 + 0.04 * sin(vUv.y * uRes.y * 1.3 + uTime * 1.5);
    vec2 p = vUv - 0.5; p.x *= uRes.x / max(uRes.y, 1.0);
    col *= smoothstep(1.25, 0.3, length(p));

    gl_FragColor = vec4(col, 1.0);
  }
`

type Rig = {
  vidA: HTMLVideoElement
  vidB: HTMLVideoElement
  texA: THREE.VideoTexture
  texB: THREE.VideoTexture
}

function makeVideo(compact: boolean): HTMLVideoElement {
  const v = document.createElement('video')
  v.muted = true
  v.loop = true
  v.playsInline = true
  v.crossOrigin = 'anonymous'
  v.preload = compact ? 'metadata' : 'auto'
  v.setAttribute('playsinline', '')
  v.setAttribute('muted', '')
  // Hors flux visuel mais attaché au DOM (décodage fiable des frames)
  v.style.cssText =
    'position:fixed;width:2px;height:2px;opacity:0;pointer-events:none;left:-10px;top:-10px;'
  return v
}

function createRig(compact: boolean): Rig {
  const vidA = makeVideo(compact)
  const vidB = makeVideo(compact)
  const texA = new THREE.VideoTexture(vidA)
  const texB = new THREE.VideoTexture(vidB)
  for (const t of [texA, texB]) {
    t.colorSpace = THREE.SRGBColorSpace
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
  }
  return { vidA, vidB, texA, texB }
}

export function VideoVoid(): ReactElement {
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const size = useThree((s) => s.size)
  const compact = useKdb((s) => s.compact)
  const reducedMotion = useKdb((s) => s.reducedMotion)

  // Vidéos + textures créées une seule fois (init paresseux), stables au render
  const [rig] = useState(() => createRig(compact))

  const uniforms = useMemo(
    () => ({
      uTexFront: { value: rig.texA },
      uTexBack: { value: rig.texB },
      uMix: { value: 0 },
      uMelt: { value: 1 },
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMediaAspect: { value: MEDIA_ASPECT },
      uAccent: { value: ACCENT.clone() },
    }),
    [rig],
  )

  // État de séquencement (hors React)
  const seq = useRef({
    frontIsA: true,
    pos: 0,
    phase: 'hold' as 'hold' | 'melt',
    t: 0,
  })

  // Graphe audio des clips (construit au 1er clic = geste utilisateur).
  const audio = useRef<{
    ctx: AudioContext
    analyser: AnalyserNode
    gainA: GainNode
    gainB: GainNode
    on: boolean
  } | null>(null)

  const enableAudio = useCallback(async (): Promise<boolean> => {
    try {
      if (!audio.current) {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        const ctx = new Ctx()
        const srcA = ctx.createMediaElementSource(rig.vidA)
        const srcB = ctx.createMediaElementSource(rig.vidB)
        const gainA = ctx.createGain()
        const gainB = ctx.createGain()
        gainA.gain.value = 1
        gainB.gain.value = 0
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        analyser.smoothingTimeConstant = 0.82
        srcA.connect(gainA).connect(analyser)
        srcB.connect(gainB).connect(analyser)
        analyser.connect(ctx.destination)
        audio.current = { ctx, analyser, gainA, gainB, on: false }
        setAnalyser(ctx, analyser)
      }
      const a = audio.current
      if (a.ctx.state === 'suspended') await a.ctx.resume()
      // Mutation impérative volontaire d'éléments <video> (DOM mutable) :
      // eslint-disable-next-line react-hooks/immutability
      rig.vidA.muted = false
      rig.vidB.muted = false
      a.on = true
      return true
    } catch {
      return false
    }
  }, [rig])

  const disableAudio = useCallback((): void => {
    // eslint-disable-next-line react-hooks/immutability
    rig.vidA.muted = true
    rig.vidB.muted = true
    if (audio.current) audio.current.on = false
    clearAnalyser()
  }, [rig])

  useEffect(() => {
    bus.clipAudio = { enable: enableAudio, disable: disableAudio }
    return () => {
      bus.clipAudio = null
    }
  }, [enableAudio, disableAudio])

  useEffect(() => {
    const { vidA, vidB } = rig
    document.body.append(vidA, vidB)
    // Mutation impérative volontaire d'éléments <video> (DOM mutable) :
    // eslint-disable-next-line react-hooks/immutability
    vidA.src = CLIPS[0]!
    vidB.src = CLIPS[1 % CLIPS.length]!
    void vidA.play().catch(() => {})
    void vidB.play().catch(() => {})
    seq.current = { frontIsA: true, pos: 0, phase: 'hold', t: 0 }

    return () => {
      for (const v of [vidA, vidB]) {
        v.pause()
        v.removeAttribute('src')
        v.load()
        v.remove()
      }
      rig.texA.dispose()
      rig.texB.dispose()
    }
  }, [rig])

  useFrame((state, delta) => {
    const u = matRef.current?.uniforms
    if (!u) return
    u.uTime.value = state.clock.elapsedTime
    u.uAudio.value = bus.audio
    u.uRes.value.set(size.width, size.height)
    u.uMelt.value = reducedMotion ? 0 : 1

    const s = seq.current

    // Crossfade du son calé sur le melt visuel (front audible, back silencieux)
    const a = audio.current
    if (a && a.on) {
      const melt = s.phase === 'melt'
      const front = melt ? 1 - u.uMix.value : 1
      const back = melt ? u.uMix.value : 0
      a.gainA.gain.value = s.frontIsA ? front : back
      a.gainB.gain.value = s.frontIsA ? back : front
    }

    s.t += delta

    if (s.phase === 'hold') {
      if (s.t >= HOLD) {
        s.phase = 'melt'
        s.t = 0
      }
      return
    }

    // phase melt
    const m = Math.min(1, s.t / MELT)
    u.uMix.value = m
    if (m < 1) return

    // Fin du fondu : le back devient front, on précharge le clip suivant
    s.frontIsA = !s.frontIsA
    s.pos = (s.pos + 1) % CLIPS.length
    const nextSrc = CLIPS[(s.pos + 1) % CLIPS.length]!
    const backVid = s.frontIsA ? rig.vidB : rig.vidA
    // Mutation impérative volontaire d'un élément <video> (DOM mutable) :
    // eslint-disable-next-line react-hooks/immutability
    backVid.src = nextSrc
    void backVid.play().catch(() => {})
    u.uTexFront.value = s.frontIsA ? rig.texA : rig.texB
    u.uTexBack.value = s.frontIsA ? rig.texB : rig.texA
    u.uMix.value = 0
    s.phase = 'hold'
    s.t = 0
  })

  return (
    <mesh frustumCulled={false} renderOrder={-10}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
