/**
 * KDB — Rappeur / Sound architect (dark premium, accent #00ff9d)
 * React Router v6 + React Three Fiber + Drei
 */
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  Center,
  Environment,
  Html,
  OrbitControls,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from 'react-router-dom'

// ---------------------------------------------------------------------------
// Base Vite (ex. GitHub Pages : vite.config base '/KDB/')
// ---------------------------------------------------------------------------

/** Chemins vers fichiers dans `public/` — respecte import.meta.env.BASE_URL */
function publicAsset(path: string): string {
  const p = path.replace(/^\//, '')
  return `${import.meta.env.BASE_URL}${p}`
}

const ROUTER_BASENAME =
  import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '')

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Fond vidéo du hero : un clip tiré au hasard à chaque chargement (fichiers dans public/clips/) */
const HERO_BG_VIDEO_CLIPS = [
  publicAsset('clips/clip1.mp4'),
  publicAsset('clips/clip2.mp4'),
  publicAsset('clips/clip3.mp4'),
] as const

/** Crossfade entre clips du hero (ms) */
const HERO_BG_CROSSFADE_MS = 900
const HERO_BG_SWITCH_MS = 14_000

const AUTO_ROTATION_SPEED = 0.25
const HOVER_SCALE = 1.08
const SCALE_LERP = 12

/** Logo 3D hero (route /) */
const HERO_LOGO_ROTATION_SPEED = 0.3
const HERO_LOGO_HOVER_SCALE = 1.05
const HERO_LOGO_SCALE_LERP = 14
const HERO_LOGO_MODEL_PATH = publicAsset('models/kdb-logo.glb')
const KDB_CHARACTER_MODEL_PATH = publicAsset('models/kdb.glb')
const ACCENT = '#00ff9d'

/** Artbook — ajustements visuels (masque artefacts, look premium) */
const ARTBOOK_BASE_SCALE = 1.04
const ARTBOOK_FLOAT_Y = 0.12
const ARTBOOK_FLOAT_AMPLITUDE = 0.045

const NAV_LINK_CLASS =
  'text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-500 transition-colors duration-300 hover:text-[#00ff9d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff9d] sm:text-xs'

/** max-width 767px (Tailwind md) : téléphone — perf & layout compacts */
function useCompactViewport(): boolean {
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = (): void => {
      setCompact(mq.matches)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  return compact
}

// ---------------------------------------------------------------------------
// Logo navbar — glitch prononcé + néon
// ---------------------------------------------------------------------------

function GlitchNavLogo(): ReactElement {
  return (
    <span
      className="relative inline-block select-none font-bold tracking-[-0.05em] text-3xl sm:text-4xl md:text-[2.65rem]"
      aria-hidden
    >
      <span className="absolute inset-0 translate-x-[1px] text-[#00ff9d]/40 blur-[0.5px] drop-shadow-[0_0_18px_rgba(0,255,157,0.55)] motion-safe:animate-pulse">
        KDB
      </span>
      <span className="absolute inset-0 -translate-x-[2px] text-[#ff2ea6]/35 blur-[1px]">
        KDB
      </span>
      <span className="absolute inset-0 translate-y-px text-[#00ff9d]/20 blur-[1.5px]">
        KDB
      </span>
      <span className="relative text-neutral-50 [text-shadow:0_0_16px_rgba(0,255,157,0.45),0_0_36px_rgba(0,255,157,0.2)]">
        KDB
      </span>
    </span>
  )
}

// ---------------------------------------------------------------------------
// Titre ARTBOOK (page 3D)
// ---------------------------------------------------------------------------

function GlitchHeading({ children }: { children: string }): ReactElement {
  return (
    <h1 className="relative text-center">
      <span className="pointer-events-none absolute inset-0 translate-x-[3px] text-[#00ff9d]/25 blur-[1px] sm:translate-x-[4px]">
        {children}
      </span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[3px] text-[#ff2ea6]/20 blur-[0.5px] sm:-translate-x-[4px]">
        {children}
      </span>
      <span className="relative bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-5xl font-black tracking-[0.28em] text-transparent drop-shadow-[0_0_20px_rgba(0,255,157,0.35)] sm:text-6xl md:text-7xl">
        {children}
      </span>
    </h1>
  )
}

// ---------------------------------------------------------------------------
// Hero — logo 3D (route /)
// ---------------------------------------------------------------------------

function HeroLogoModel({
  hovered,
  onHoverChange,
  logoScale,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  logoScale: number
}): ReactElement {
  const outerRef = useRef<Group>(null)
  const { scene } = useGLTF(HERO_LOGO_MODEL_PATH)
  const model = useMemo(() => scene.clone(), [scene])
  const scaleRef = useRef(1)

  const onPointerOver = useCallback(() => {
    onHoverChange(true)
  }, [onHoverChange])

  const onPointerOut = useCallback(() => {
    onHoverChange(false)
  }, [onHoverChange])

  useFrame((state, delta) => {
    const g = outerRef.current
    if (!g) return

    g.rotation.y += HERO_LOGO_ROTATION_SPEED * delta
    const t = state.clock.elapsedTime
    g.position.y = Math.sin(t * 0.85) * 0.1

    const target = hovered ? HERO_LOGO_HOVER_SCALE : 1
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      target,
      Math.min(1, HERO_LOGO_SCALE_LERP * delta),
    )
    g.scale.setScalar(scaleRef.current)
  })

  return (
    <group
      ref={outerRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <Center>
        <primitive object={model} scale={logoScale} />
      </Center>
    </group>
  )
}

function NeonPulse({
  compact,
}: {
  compact: boolean
}): ReactElement {
  const keyRef = useRef<THREE.PointLight>(null)
  const rimRef = useRef<THREE.DirectionalLight>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pulse =
      0.72 +
      0.28 * Math.sin(t * 1.25) +
      0.08 * Math.sin(t * 2.7 + 0.6)

    const key = keyRef.current
    if (key) key.intensity = (compact ? 0.38 : 0.62) * pulse

    const rim = rimRef.current
    if (rim) rim.intensity = (compact ? 0.7 : 0.95) * (0.85 + 0.15 * pulse)
  })

  return (
    <>
      <pointLight
        ref={keyRef}
        position={[0, 2.8, 6.3]}
        intensity={compact ? 0.38 : 0.62}
        color={ACCENT}
        distance={compact ? 11 : 14}
        decay={2}
      />
      <directionalLight
        ref={rimRef}
        position={[-2, 2.5, -7]}
        intensity={compact ? 0.7 : 0.95}
        color={ACCENT}
      />
    </>
  )
}

function LightningCrackle({
  compact,
}: {
  compact: boolean
}): ReactElement {
  const lineRef = useRef<THREE.LineSegments>(null)
  const materialRef = useRef<THREE.LineBasicMaterial>(null)
  const lifeRef = useRef(0)
  const nextRef = useRef(0)

  const { geometry } = useMemo(() => {
    const geometry = new THREE.BufferGeometry()
    const maxSegments = compact ? 10 : 18
    const positions = new Float32Array(maxSegments * 2 * 3)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setDrawRange(0, 0)
    return { geometry, maxSegments, positions }
  }, [compact])

  useFrame((state) => {
    const mat = materialRef.current
    const line = lineRef.current
    if (!mat || !line) return

    const t = state.clock.elapsedTime
    if (t >= nextRef.current && lifeRef.current <= 0) {
      // déclenchement rare, plus rare sur mobile
      const baseEvery = compact ? 5.8 : 4.2
      const jitter = compact ? 3.2 : 2.2
      nextRef.current = t + baseEvery + Math.random() * jitter

      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array
      const segCount = compact ? 4 + Math.floor(Math.random() * 3) : 6 + Math.floor(Math.random() * 5)
      const radius = compact ? 1.35 : 1.7

      for (let i = 0; i < segCount * 2; i += 2) {
        const a = Math.random() * Math.PI * 2
        const b = Math.random() * Math.PI - Math.PI / 2
        const r = radius * (0.6 + Math.random() * 0.45)

        const x1 = Math.cos(a) * Math.cos(b) * r
        const y1 = Math.sin(b) * r + (compact ? 0.02 : 0.06)
        const z1 = Math.sin(a) * Math.cos(b) * r

        // segment court, jitteré
        const x2 = x1 + (Math.random() - 0.5) * (compact ? 0.35 : 0.5)
        const y2 = y1 + (Math.random() - 0.5) * (compact ? 0.25 : 0.35)
        const z2 = z1 + (Math.random() - 0.5) * (compact ? 0.35 : 0.5)

        const o = i * 3
        arr[o + 0] = x1
        arr[o + 1] = y1
        arr[o + 2] = z1
        arr[o + 3] = x2
        arr[o + 4] = y2
        arr[o + 5] = z2
      }

      posAttr.needsUpdate = true
      geometry.setDrawRange(0, segCount * 2)
      lifeRef.current = compact ? 0.18 : 0.22
      mat.opacity = 0.9
      mat.visible = true
    }

    if (lifeRef.current > 0) {
      lifeRef.current = Math.max(0, lifeRef.current - state.clock.getDelta())
      mat.opacity = Math.min(1, lifeRef.current * 6.5)
      if (lifeRef.current === 0) {
        geometry.setDrawRange(0, 0)
        mat.visible = false
      }
    }
  })

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        ref={materialRef}
        color={ACCENT}
        transparent
        opacity={0}
        depthWrite={false}
        visible={false}
      />
    </lineSegments>
  )
}

function SubtleParticles({
  compact,
}: {
  compact: boolean
}): ReactElement {
  const pointsRef = useRef<THREE.Points>(null)
  const count = compact ? 36 : 80

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const speeds = new Float32Array(count)

    for (let i = 0; i < count; i += 1) {
      const r = 1.55 + Math.random() * 1.1
      const a = Math.random() * Math.PI * 2
      const y = (Math.random() - 0.5) * 1.2
      positions[i * 3 + 0] = Math.cos(a) * r
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = Math.sin(a) * r
      speeds[i] = 0.05 + Math.random() * 0.08
    }
    return { positions, speeds }
  }, [count])

  useFrame((state) => {
    const pts = pointsRef.current
    if (!pts) return
    const attr = pts.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = attr.array as Float32Array
    const t = state.clock.elapsedTime

    for (let i = 0; i < count; i += 1) {
      const o = i * 3
      arr[o + 1] += Math.sin(t * 0.35 + i) * (speeds[i] * 0.002)
      // léger drift circulaire
      const x = arr[o + 0]
      const z = arr[o + 2]
      arr[o + 0] = x * 0.9996 - z * 0.0004
      arr[o + 2] = z * 0.9996 + x * 0.0004
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={ACCENT}
        size={compact ? 0.016 : 0.02}
        sizeAttenuation
        transparent
        opacity={compact ? 0.14 : 0.18}
        depthWrite={false}
      />
    </points>
  )
}

function HeroLogoWorld({
  hovered,
  onHoverChange,
  logoScale,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  logoScale: number
}): ReactElement {
  const compact = useCompactViewport()

  return (
    <>
      <ambientLight intensity={0.18} />
      <hemisphereLight
        color="#eef8ff"
        groundColor="#080808"
        intensity={0.55}
      />
      <directionalLight
        position={[5, 8, 10]}
        intensity={1}
        color="#ffffff"
      />
      <directionalLight
        position={[-6, -4, -8]}
        intensity={0.35}
        color="#00ff9d"
      />
      <pointLight
        position={[-4, 2, 4]}
        intensity={0.25}
        color="#a8fff0"
        distance={12}
        decay={2}
      />
      <NeonPulse compact={compact} />
      <SubtleParticles compact={compact} />
      <LightningCrackle compact={compact} />
      <HeroLogoModel
        hovered={hovered}
        onHoverChange={onHoverChange}
        logoScale={logoScale}
      />
    </>
  )
}

function HeroLogo3DBlock(): ReactElement {
  const [hovered, setHovered] = useState(false)
  const compact = useCompactViewport()

  return (
    <Canvas
      className="relative mx-auto w-full max-w-[min(100%,320px)] -mt-2 cursor-grab touch-none active:cursor-grabbing sm:max-w-[min(100%,420px)] sm:-mt-3 md:max-w-4xl md:-mt-4 h-[min(40svh,300px)] min-h-[220px] md:h-[min(52vh,520px)] md:min-h-[320px]"
      frameloop="always"
      gl={{
        antialias: !compact,
        alpha: true,
        powerPreference: compact ? 'default' : 'high-performance',
        stencil: false,
      }}
      dpr={compact ? 1 : [1, 2]}
      camera={{
        position: [0, compact ? 0.2 : 0.28, compact ? 6 : 5],
        fov: compact ? 40 : 42,
      }}
    >
      <Suspense fallback={null}>
        <HeroLogoWorld
          hovered={hovered}
          onHoverChange={setHovered}
          logoScale={compact ? 1.7 : 2.55}
        />
      </Suspense>
    </Canvas>
  )
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

function Navbar(): ReactElement {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-20 border-b border-white/[0.06] bg-[#0a0a0a]/90 shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
      <nav
        className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Navigation principale"
      >
        <Link
          to="/"
          className="transition-opacity hover:opacity-90"
          aria-label="KDB — Accueil"
        >
          <GlitchNavLogo />
        </Link>

        <ul className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 sm:gap-x-10">
          <li>
            <Link to="/" className={NAV_LINK_CLASS}>
              Accueil
            </Link>
          </li>
          <li>
            <Link to="/artbook" className={NAV_LINK_CLASS}>
              Artbook
            </Link>
          </li>
          <li>
            <a
              href="https://open.spotify.com/artist/1NC0W7a8PRhAkuQxU15Bt1"
              target="_blank"
              rel="noopener noreferrer"
              className={NAV_LINK_CLASS}
            >
              Spotify
            </a>
          </li>
        </ul>
      </nav>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Accueil
// ---------------------------------------------------------------------------

function HomePage(): ReactElement {
  const compact = useCompactViewport()
  const pickRandomClip = useCallback(
    (exclude?: string): (typeof HERO_BG_VIDEO_CLIPS)[number] => {
      if (HERO_BG_VIDEO_CLIPS.length <= 1) return HERO_BG_VIDEO_CLIPS[0]!
      let next = HERO_BG_VIDEO_CLIPS[
        Math.floor(Math.random() * HERO_BG_VIDEO_CLIPS.length)
      ]!
      if (exclude) {
        // évite de retomber sur le même clip (quelques tentatives max)
        for (let i = 0; i < 4 && next === exclude; i += 1) {
          next = HERO_BG_VIDEO_CLIPS[
            Math.floor(Math.random() * HERO_BG_VIDEO_CLIPS.length)
          ]!
        }
      }
      return next
    },
    [],
  )

  const [heroBgA, setHeroBgA] = useState<(typeof HERO_BG_VIDEO_CLIPS)[number]>(
    () => pickRandomClip(),
  )
  const [heroBgB, setHeroBgB] = useState<(typeof HERO_BG_VIDEO_CLIPS)[number]>(
    () => pickRandomClip(),
  )
  const [showA, setShowA] = useState(true)
  const currentSrc = showA ? heroBgA : heroBgB

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = pickRandomClip(currentSrc)
      if (showA) setHeroBgB(next)
      else setHeroBgA(next)

      // laisse un court instant au navigateur pour charger avant le fade
      window.setTimeout(() => {
        setShowA((v) => !v)
      }, 80)
    }, HERO_BG_SWITCH_MS)

    return () => window.clearInterval(id)
  }, [currentSrc, pickRandomClip, showA])

  return (
    <main className="min-h-screen bg-[#060606] pb-24 pt-20 text-neutral-200 sm:pb-28">
      {/* Hero */}
      <section
        className="relative flex min-h-[calc(100svh-5rem)] w-full flex-col items-center justify-center overflow-hidden px-3 sm:px-6 md:px-8"
        aria-labelledby="hero-heading"
      >
        {/* Base mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070707] to-black" aria-hidden />

        {/* Crossfade: 2 vidéos empilées */}
        <video
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.5] transition-opacity ease-out sm:object-center ${
            showA ? 'opacity-[0.5]' : 'opacity-0'
          }`}
          style={{ transitionDuration: `${HERO_BG_CROSSFADE_MS}ms` }}
          src={heroBgA}
          muted
          autoPlay
          playsInline
          loop
          preload={compact ? 'metadata' : 'auto'}
          aria-hidden
        />
        <video
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.5] transition-opacity ease-out sm:object-center ${
            showA ? 'opacity-0' : 'opacity-[0.5]'
          }`}
          style={{ transitionDuration: `${HERO_BG_CROSSFADE_MS}ms` }}
          src={heroBgB}
          muted
          autoPlay
          playsInline
          loop
          preload={compact ? 'metadata' : 'auto'}
          aria-hidden
        />

        {/* Overlay cinéma: top→bottom + vignette coins */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/25 to-black/70"
          aria-hidden
        />
        <div
          className="absolute inset-0 [background:radial-gradient(closest-side,rgba(0,0,0,0)_55%,rgba(0,0,0,0.55)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#060606] via-black/20 to-black/65"
          aria-hidden
        />

        <div className="relative z-10 mx-auto w-full max-w-4xl px-2 text-center sm:px-4 md:px-6">
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.62em] text-[#00ff9d]/55 sm:mb-8 sm:text-[11px]">
            Valais
          </p>
          <h2 id="hero-heading" className="sr-only">
            KDB
          </h2>
          <HeroLogo3DBlock />
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.32em] text-[#00ff9d]/85 sm:mt-8 sm:text-base sm:tracking-[0.38em] md:text-lg">
            Rappeur <span className="mx-1 text-neutral-600">·</span> Sound Architect
          </p>
          <div className="mx-auto mt-8 h-px w-20 max-w-full bg-gradient-to-r from-transparent via-[#00ff9d]/35 to-transparent sm:mt-14 sm:w-28" />
        </div>
      </section>

      {/* Bio */}
      <section
        className="mx-auto max-w-5xl border-t border-white/[0.05] px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
        aria-labelledby="bio-heading"
      >
        <h3 id="bio-heading" className="sr-only">
          Biographie
        </h3>
        <div className="flex flex-col items-center gap-14 rounded-[2rem] border border-white/[0.05] bg-gradient-to-br from-white/[0.03] to-transparent px-8 py-12 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm md:flex-row md:items-center md:gap-16 md:px-12 md:py-14 lg:gap-20">
          <img
            src={publicAsset('images/bio-photo.jpg')}
            alt="KDB"
            className="w-64 shrink-0 rounded-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.08),0_0_48px_-8px_rgba(0,255,157,0.12)] ring-1 ring-white/[0.08]"
          />
          <p className="max-w-xl text-pretty text-base font-light leading-[1.75] tracking-wide text-neutral-400 sm:text-lg">
            KDB est un rappeur et sound architect du Valais. Il mélange rap
            sombre, flows tranchants et textures électroniques pour créer une
            atmosphère unique.
          </p>
        </div>
      </section>

      {/* Spotify — Artiste */}
      <section
        className="mx-auto max-w-3xl px-4 sm:px-6"
        aria-labelledby="spotify-artist-heading"
      >
        <h3
          id="spotify-artist-heading"
          className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.48em] text-[#00ff9d]/60 sm:text-[11px]"
        >
          Spotify — Artiste
        </h3>
        <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.06] bg-[#0a0a0a] p-[10px] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,255,157,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]">
          {/* Spotify Artiste */}
          <iframe
            style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/artist/1NC0W7a8PRhAkuQxU15Bt1?utm_source=generator"
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify — Profil artiste KDB"
          />
        </div>
      </section>

      {/* Spotify — EP EXIT */}
      <section
        className="mx-auto mt-20 max-w-3xl px-4 sm:px-6"
        aria-labelledby="spotify-exit-heading"
      >
        <h3
          id="spotify-exit-heading"
          className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.48em] text-[#00ff9d]/60 sm:text-[11px]"
        >
          EP — EXIT
        </h3>
        <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.06] bg-[#0a0a0a] p-[10px] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,255,157,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]">
          {/* Spotify EP EXIT */}
          <iframe
            style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/album/3IKatiK62lDIKTqZK5l7Sv?utm_source=generator"
            width="100%"
            height="352"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify — EP EXIT"
          />
        </div>
      </section>

      {/* CTA */}
      <div className="mx-auto mt-24 flex justify-center px-4">
        <Link
          to="/artbook"
          className="inline-flex items-center justify-center rounded-full border border-[#00ff9d]/40 bg-[#00ff9d]/[0.06] px-11 py-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#00ff9d] shadow-[0_0_32px_rgba(0,255,157,0.12)] transition duration-300 hover:border-[#00ff9d]/70 hover:bg-[#00ff9d]/10 hover:shadow-[0_0_48px_rgba(0,255,157,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff9d] sm:text-xs"
        >
          Entrer dans l&apos;Artbook
        </Link>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// Scène 3D (inchangée)
// ---------------------------------------------------------------------------

useGLTF.preload(HERO_LOGO_MODEL_PATH)
useGLTF.preload(KDB_CHARACTER_MODEL_PATH)

function KdbCharacter({
  hovered,
  onHoverChange,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
}): ReactElement {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF(KDB_CHARACTER_MODEL_PATH)
  const model = useMemo(() => scene.clone(), [scene])
  const scaleRef = useRef(1)

  const onPointerOver = useCallback(() => {
    onHoverChange(true)
  }, [onHoverChange])

  const onPointerOut = useCallback(() => {
    onHoverChange(false)
  }, [onHoverChange])

  useFrame((state, delta) => {
    const g = groupRef.current
    if (!g) return

    g.rotation.y += AUTO_ROTATION_SPEED * delta
    g.position.y =
      ARTBOOK_FLOAT_Y +
      Math.sin(state.clock.elapsedTime * 0.75) * ARTBOOK_FLOAT_AMPLITUDE

    const target = hovered ? HOVER_SCALE : ARTBOOK_BASE_SCALE
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      target,
      Math.min(1, SCALE_LERP * delta),
    )
    g.scale.setScalar(scaleRef.current)
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <primitive object={model} />
    </group>
  )
}

function ModelLoadingFallback(): ReactElement {
  return (
    <Html center className="pointer-events-none select-none">
      <div
        className="flex flex-col items-center gap-3 rounded-xl border border-[#00ff9d]/25 bg-black/85 px-6 py-5 shadow-[0_0_40px_rgba(0,255,157,0.12)] backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#00ff9d]/30 border-t-[#00ff9d]"
          aria-hidden
        />
        <p className="max-w-[16rem] text-center font-mono text-xs text-[#00ff9d] sm:text-sm">
          Chargement du personnage...
        </p>
      </div>
    </Html>
  )
}

function ArtbookSceneAsync({
  hovered,
  onHoverChange,
  compact,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  compact: boolean
}): ReactElement {
  return (
    <>
      <Environment preset="city" resolution={compact ? 128 : 256} />
      <KdbCharacter hovered={hovered} onHoverChange={onHoverChange} />
    </>
  )
}

function ArtbookScene({
  hovered,
  onHoverChange,
  compact,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  compact: boolean
}): ReactElement {
  return (
    <>
      {/* Studio lighting (cinématique + rim/edge glow) */}
      <ambientLight intensity={0.25} />
      <hemisphereLight
        color="#ffffff"
        groundColor="#1a1a1a"
        intensity={0.55}
      />

      {/* Key (haut / légèrement latéral) */}
      <directionalLight position={[7, 10, 7]} intensity={1.35} color="#ffffff" />

      {/* Fill (plus doux, teinté) */}
      <directionalLight position={[-7, 3, 2]} intensity={0.55} color="#c7fff3" />

      {/* Rim light (derrière, accent vert) */}
      <directionalLight position={[-2, 4, -9]} intensity={0.9} color="#00ff9d" />

      {/* Glow doux */}
      <pointLight
        position={[0, 2.6, 6.5]}
        intensity={compact ? 0.35 : 0.55}
        color="#00ff9d"
        distance={16}
        decay={2}
      />

      <Suspense fallback={<ModelLoadingFallback />}>
        <ArtbookSceneAsync
          hovered={hovered}
          onHoverChange={onHoverChange}
          compact={compact}
        />
      </Suspense>

      <OrbitControls
        makeDefault
        enablePan
        enableZoom
        enableRotate
        target={[0, 1.15, 0]}
        minDistance={compact ? 2.4 : 2}
        maxDistance={compact ? 15 : 20}
        dampingFactor={compact ? 0.1 : 0.08}
        enableDamping
        rotateSpeed={compact ? 0.85 : 1}
      />
    </>
  )
}

function Artbook3DView({
  hovered,
  onHoverChange,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
}): ReactElement {
  const compact = useCompactViewport()

  return (
    <div className="h-[min(52svh,calc(100svh-6rem))] min-h-[260px] w-full sm:min-h-[300px] sm:h-[min(58svh,calc(100svh-5.5rem))] md:min-h-[320px] md:h-[calc(100vh-80px)]">
      <Canvas
        className="h-full w-full touch-none"
        frameloop="always"
        gl={{
          antialias: !compact,
          alpha: true,
          powerPreference: compact ? 'default' : 'high-performance',
          stencil: false,
        }}
        dpr={compact ? 1 : [1, 2]}
        camera={{
          position: [0, 0.98, compact ? 5.55 : 4.7],
          fov: compact ? 48 : 44,
        }}
      >
        <ArtbookScene
          hovered={hovered}
          onHoverChange={onHoverChange}
          compact={compact}
        />
      </Canvas>
    </div>
  )
}

function ArtbookPage(): ReactElement {
  const [hovered, setHovered] = useState(false)

  return (
    <main className="min-h-screen bg-[#050505] pb-8 pt-24 text-neutral-200 sm:pb-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <GlitchHeading>ARTBOOK</GlitchHeading>

        <p className="mx-auto mt-3 max-w-xl px-1 text-center text-xs text-neutral-500 sm:mt-4 sm:text-sm">
          Modèle 3D — rotation automatique, navigation libre.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:mt-8 sm:rounded-xl">
          <Artbook3DView hovered={hovered} onHoverChange={setHovered} />
        </div>

        <p className="mt-4 px-2 text-center font-mono text-[10px] leading-relaxed text-neutral-500 sm:mt-6 sm:text-xs md:text-sm">
          <span className="text-[#00ff9d]/80">●</span> Glisser pour orbiter
          &nbsp;·&nbsp; Molette pour zoomer &nbsp;·&nbsp; Clic droit ou
          Shift+glisser pour panoramiquer
        </p>
      </div>
    </main>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App(): ReactElement {
  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <div className="min-h-screen min-w-0 bg-[#060606] antialiased selection:bg-[#00ff9d]/30 selection:text-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/artbook" element={<ArtbookPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
