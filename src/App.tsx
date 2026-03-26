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
// Constantes
// ---------------------------------------------------------------------------

/** Fond vidéo du hero : un clip tiré au hasard à chaque chargement (fichiers dans public/clips/) */
const HERO_BG_VIDEO_CLIPS = [
  '/clips/clip1.mp4',
  '/clips/clip2.mp4',
  '/clips/clip3.mp4',
] as const

const AUTO_ROTATION_SPEED = 0.4
const HOVER_SCALE = 1.08
const SCALE_LERP = 12

/** Logo 3D hero (route /) */
const HERO_LOGO_ROTATION_SPEED = 0.3
const HERO_LOGO_HOVER_SCALE = 1.05
const HERO_LOGO_SCALE_LERP = 14
const HERO_LOGO_MODEL_PATH = '/models/kdb-logo.glb' as const

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

function HeroLogoWorld({
  hovered,
  onHoverChange,
  logoScale,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  logoScale: number
}): ReactElement {
  return (
    <>
      <ambientLight intensity={0.2} />
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
        position={[0, 3, 6]}
        intensity={0.65}
        color="#00ff9d"
        distance={14}
        decay={2}
      />
      <pointLight
        position={[-4, 2, 4]}
        intensity={0.25}
        color="#a8fff0"
        distance={12}
        decay={2}
      />
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
      className="relative mx-auto w-full max-w-[min(100%,280px)] cursor-grab touch-none active:cursor-grabbing sm:max-w-[min(100%,360px)] md:max-w-3xl h-[min(34svh,240px)] min-h-[188px] md:h-[min(44vh,440px)] md:min-h-[260px]"
      frameloop="always"
      gl={{
        antialias: !compact,
        alpha: true,
        powerPreference: compact ? 'default' : 'high-performance',
        stencil: false,
      }}
      dpr={compact ? 1 : [1, 2]}
      camera={{
        position: [0, compact ? 0.12 : 0.2, compact ? 6.1 : 5.2],
        fov: compact ? 38 : 42,
      }}
    >
      <Suspense fallback={null}>
        <HeroLogoWorld
          hovered={hovered}
          onHoverChange={setHovered}
          logoScale={compact ? 1.45 : 2.2}
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
          <li>
            <Link to="/#clips" className={NAV_LINK_CLASS}>
              Clips
            </Link>
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
  const [heroBgVideoSrc] = useState(
    () =>
      HERO_BG_VIDEO_CLIPS[
        Math.floor(Math.random() * HERO_BG_VIDEO_CLIPS.length)
      ]!,
  )

  return (
    <main className="min-h-screen bg-[#060606] pb-24 pt-20 text-neutral-200 sm:pb-28">
      {/* Hero */}
      <section
        className="relative flex min-h-[calc(100svh-5rem)] w-full flex-col items-center justify-center overflow-hidden px-3 sm:px-6 md:px-8"
        aria-labelledby="hero-heading"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070707] to-black" aria-hidden />
        <video
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.35] sm:object-center"
          src={heroBgVideoSrc}
          muted
          autoPlay
          playsInline
          loop
          preload={compact ? 'metadata' : 'auto'}
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
            src="/images/bio-photo.jpg"
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

      {/* Clips */}
      <section
        id="clips"
        className="mx-auto mt-24 max-w-6xl px-4 sm:px-6"
        aria-labelledby="clips-heading"
      >
        <h3
          id="clips-heading"
          className="mb-12 text-center font-mono text-[10px] uppercase tracking-[0.5em] text-[#00ff9d]/60 sm:text-[11px]"
        >
          Clips
        </h3>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          <video
            src="/clips/clip1.mp4"
            controls
            playsInline
            className="w-full rounded-2xl border border-white/[0.07] bg-black shadow-[0_24px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]"
          />
          <video
            src="/clips/clip2.mp4"
            controls
            playsInline
            className="w-full rounded-2xl border border-white/[0.07] bg-black shadow-[0_24px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]"
          />
          <video
            src="/clips/clip3.mp4"
            controls
            playsInline
            className="w-full rounded-2xl border border-white/[0.07] bg-black shadow-[0_24px_56px_-18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]"
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
useGLTF.preload('/models/kdb.glb')

function KdbCharacter({
  hovered,
  onHoverChange,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
}): ReactElement {
  const groupRef = useRef<Group>(null)
  const { scene } = useGLTF('/models/kdb.glb')
  const model = useMemo(() => scene.clone(), [scene])
  const scaleRef = useRef(1)

  const onPointerOver = useCallback(() => {
    onHoverChange(true)
  }, [onHoverChange])

  const onPointerOut = useCallback(() => {
    onHoverChange(false)
  }, [onHoverChange])

  useFrame((_, delta) => {
    const g = groupRef.current
    if (!g) return

    g.rotation.y += AUTO_ROTATION_SPEED * delta

    const target = hovered ? HOVER_SCALE : 1
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
      <ambientLight intensity={0.35} />
      <hemisphereLight
        color="#ffffff"
        groundColor="#1a1a1a"
        intensity={0.65}
      />
      <directionalLight
        position={[6, 8, 6]}
        intensity={1.15}
        color="#ffffff"
      />
      <directionalLight
        position={[-7, 4, -5]}
        intensity={0.45}
        color="#a8fff0"
      />
      <directionalLight position={[0, 10, -8]} intensity={0.35} color="#ffeeff" />

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
          position: [0, 1.15, compact ? 5.35 : 4.5],
          fov: compact ? 46 : 42,
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
    <BrowserRouter>
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
