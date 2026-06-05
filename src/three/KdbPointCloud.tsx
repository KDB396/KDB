/**
 * KdbPointCloud — kdb.glb échantillonné en ~100k points qui tiennent la
 * silhouette de KDB et qui sont VIVANTS :
 *  · respiration lente au repos (simplex noise) ;
 *  · les basses dispersent la matière ;
 *  · le curseur (en mouvement) écarte les points autour de lui ;
 *  · les kicks font "exploser puis rassembler" l'entité.
 * KDB = sound architect → littéralement constitué de matière sonore.
 */
import { useMemo, useRef, type ReactElement } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { bus, useKdb } from '../state/store'

const MODEL = `${import.meta.env.BASE_URL}models/kdb.glb`
useGLTF.preload(MODEL)

// --- Réglages exposés ------------------------------------------------------
const COUNT = 100_000 // points (compact : 40 000)
const COUNT_COMPACT = 40_000
const POINT_SIZE = 1.9 // taille de base d'un point (px @ distance moyenne)
const BREATHE = 0.03 // turbulence au repos
const BASS_DISPERSE = 0.25 // influence des basses
const CURSOR_RADIUS = 0.9 // rayon d'action du curseur (espace local)
const CURSOR_PUSH = 0.6 // force de poussée du curseur
const AUTO_ROTATION = 0.18
const FLOAT_Y = 0.12
const FLOAT_AMP = 0.045

/** Échantillonne la surface du modèle en un nuage de points centré sur le modèle. */
function buildCloud(scene: THREE.Object3D, count: number): THREE.BufferGeometry {
  scene.updateWorldMatrix(true, true)
  const geoms: THREE.BufferGeometry[] = []
  scene.traverse((o) => {
    const m = o as THREE.Mesh
    if (m.isMesh && m.geometry) {
      const g = m.geometry.clone().toNonIndexed()
      g.applyMatrix4(m.matrixWorld)
      // ne garder que 'position' pour merger sans mismatch d'attributs
      for (const k of Object.keys(g.attributes)) {
        if (k !== 'position') g.deleteAttribute(k)
      }
      geoms.push(g)
    }
  })

  const geo = new THREE.BufferGeometry()
  if (geoms.length === 0) return geo

  const merged =
    geoms.length > 1 ? (mergeGeometries(geoms, false) ?? geoms[0]!) : geoms[0]!
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(merged)).build()

  const positions = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const p = new THREE.Vector3()
  // RNG déterministe (rendu stable d'une session à l'autre)
  let s = 0x6d2b79f5
  const rand = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 0xffffffff
  }
  for (let i = 0; i < count; i += 1) {
    sampler.sample(p)
    positions[i * 3] = p.x
    positions[i * 3 + 1] = p.y
    positions[i * 3 + 2] = p.z
    seeds[i] = rand()
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
  return geo
}

// Simplex noise 3D (Ashima Arts / webgl-noise) — domaine public.
const SNOISE = /* glsl */ `
  vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute( permute( permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`

const vertex = /* glsl */ `
  ${SNOISE}
  uniform float uTime, uAudio, uSize, uDisperse, uPointerForce, uMotion;
  uniform vec3 uBands;     // x=low y=mid z=high
  uniform vec3 uPointer;   // curseur en espace LOCAL du groupe
  attribute float aSeed;
  varying float vGlow;
  void main(){
    vec3 pos = position;
    float t = uTime * 0.4 + aSeed * 6.2831;
    vec3 flow = vec3(
      snoise(pos*0.6 + t*0.1),
      snoise(pos*0.6 + 13.0 + t*0.1),
      snoise(pos*0.6 + 31.0 + t*0.1)
    );
    pos += flow * (${BREATHE.toFixed(3)} + uBands.x * ${BASS_DISPERSE.toFixed(3)}) * uMotion;

    vec3 toP = pos - uPointer;
    float d = length(toP);
    float push = smoothstep(${CURSOR_RADIUS.toFixed(3)}, 0.0, d) * uPointerForce;
    pos += normalize(toP + 1e-4) * push * ${CURSOR_PUSH.toFixed(3)};

    pos += flow * uDisperse * 1.5 * uMotion;

    vGlow = 0.4 + uBands.y * 0.6 + push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float sz = uSize * (0.6 + aSeed*0.8) * (1.0 + uAudio*0.6) * (9.0 / -mv.z);
    gl_PointSize = clamp(sz, 1.0, 12.0);
    gl_Position = projectionMatrix * mv;
  }
`

const fragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vGlow;
  void main(){
    float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(uColor * (0.6 + vGlow), a * 0.9);
  }
`

export function KdbPointCloud({ compact }: { compact: boolean }): ReactElement {
  const { scene } = useGLTF(MODEL)
  const reducedMotion = useKdb((s) => s.reducedMotion)
  const count = compact ? COUNT_COMPACT : COUNT
  const geo = useMemo(() => buildCloud(scene.clone(), count), [scene, count])

  const groupRef = useRef<THREE.Group>(null)
  const matRef = useRef<THREE.ShaderMaterial>(null)
  const camera = useThree((s) => s.camera)
  const pointer = useThree((s) => s.pointer)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAudio: { value: 0 },
      uBands: { value: new THREE.Vector3() },
      uPointer: { value: new THREE.Vector3(999, 999, 999) },
      uPointerForce: { value: 0 },
      uDisperse: { value: 0 },
      uMotion: { value: 1 },
      uSize: { value: POINT_SIZE },
      uColor: { value: new THREE.Color('#00ff9d') },
    }),
    [],
  )

  const st = useRef({ lastPx: 0, lastPy: 0, force: 0, baseLow: 0, disperse: 0 })
  const cd = useRef(0)
  const tmp = useRef(new THREE.Vector3())
  const dir = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    const g = groupRef.current
    const u = matRef.current?.uniforms
    if (!g || !u) return

    const motion = reducedMotion ? 0.18 : 1
    u.uMotion.value = motion

    if (!reducedMotion) {
      g.rotation.y += AUTO_ROTATION * delta
      g.position.y = FLOAT_Y + Math.sin(state.clock.elapsedTime * 0.75) * FLOAT_AMP
    }

    u.uTime.value = state.clock.elapsedTime
    u.uAudio.value = bus.audio
    u.uBands.value.set(bus.bands.low, bus.bands.mid, bus.bands.high)

    // Curseur → point monde (le long du rayon) → espace local du groupe
    const v = tmp.current.set(pointer.x, pointer.y, 0.5).unproject(camera)
    dir.current.copy(v).sub(camera.position).normalize()
    const dist = camera.position.length()
    v.copy(camera.position).add(dir.current.multiplyScalar(dist))
    u.uPointer.value.copy(g.worldToLocal(v))

    // Force activée par le MOUVEMENT du curseur, décroît à l'arrêt
    const moved = Math.hypot(
      pointer.x - st.current.lastPx,
      pointer.y - st.current.lastPy,
    )
    st.current.lastPx = pointer.x
    st.current.lastPy = pointer.y
    const target = moved > 0.0005 ? 1 : 0
    st.current.force += (target - st.current.force) * Math.min(1, delta * 5)
    u.uPointerForce.value = st.current.force

    // Détection de kick sur les basses → impulsion d'explosion qui décroît
    const low = bus.bands.low
    st.current.baseLow = THREE.MathUtils.lerp(st.current.baseLow, low, 0.05)
    cd.current -= delta
    if (low > st.current.baseLow * 1.4 + 0.05 && cd.current <= 0) {
      st.current.disperse = 1
      cd.current = 0.25
    }
    st.current.disperse *= Math.exp(-delta * 4)
    u.uDisperse.value = st.current.disperse * 0.6
  })

  return (
    <group ref={groupRef}>
      <points geometry={geo} frustumCulled={false}>
        <shaderMaterial
          ref={matRef}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
