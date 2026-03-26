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
import type { ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  AdaptiveDpr,
  AdaptiveEvents,
  ContactShadows,
  Center,
  Environment,
  Html,
  OrbitControls,
  Sparkles,
  useGLTF,
  useProgress,
} from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import type { Location } from 'react-router-dom'

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
      className="relative inline-block select-none font-bold tracking-[-0.05em] text-2xl sm:text-3xl md:text-[2.65rem]"
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
      <span className="pointer-events-none absolute inset-0 translate-x-[2px] text-[#00ff9d]/25 blur-[1px] sm:translate-x-[3px]">
        {children}
      </span>
      <span className="pointer-events-none absolute inset-0 -translate-x-[2px] text-[#ff2ea6]/20 blur-[0.5px] sm:-translate-x-[3px]">
        {children}
      </span>
      <span className="relative bg-gradient-to-b from-white via-neutral-200 to-neutral-500 bg-clip-text text-4xl font-black tracking-[0.15em] text-transparent drop-shadow-[0_0_20px_rgba(0,255,157,0.35)] sm:text-5xl sm:tracking-[0.28em] md:text-6xl lg:text-7xl">
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
  compact,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  logoScale: number
  compact: boolean
}): ReactElement {
  const outerRef = useRef<Group>(null)
  const { scene } = useGLTF(HERO_LOGO_MODEL_PATH)
  const model = useMemo(() => scene.clone(), [scene])
  const scaleRef = useRef(1)
  // Décale l'orientation initiale pour afficher "la belle face" immédiatement
  // (flip 180° si le modèle démarre sur son dos)
  const baseYawRef = useRef(Math.PI + 0.95)

  const rngRef = useRef(0x2f6e2b1d)
  const rand01 = useCallback((): number => {
    rngRef.current = (rngRef.current * 1664525 + 1013904223) >>> 0
    return rngRef.current / 0xffffffff
  }, [])

  const strike = useMemo(() => {
    const points = 7
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(points * 3), 3),
    )
    const material = new THREE.LineBasicMaterial({
      color: new THREE.Color('#e8f7ff'),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    })
    const line = new THREE.Line(geometry, material)
    line.visible = false
    return { line, geometry, material, points }
  }, [])

  const strikeTTL = useRef(0)
  const nextStrikeAt = useRef(0)
  const strikeLightRef = useRef<THREE.PointLight>(null)

  const onPointerOver = useCallback(() => {
    onHoverChange(true)
  }, [onHoverChange])

  const onPointerOut = useCallback(() => {
    onHoverChange(false)
  }, [onHoverChange])

  useFrame((state, delta) => {
    const g = outerRef.current
    if (!g) return

    const lerpAlpha = 0.08

    // Rotation de base + tilt parallax souris (haut de gamme / smooth)
    baseYawRef.current += HERO_LOGO_ROTATION_SPEED * delta
    const px = state.pointer.x
    const py = state.pointer.y

    const tiltX = (compact ? 0.16 : 0.2) * -py
    const tiltZ = (compact ? 0.14 : 0.18) * px
    const yawOffset = (compact ? 0.18 : 0.24) * px

    const targetX = tiltX
    const targetZ = tiltZ
    const targetY = baseYawRef.current + yawOffset

    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, targetX, lerpAlpha)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, targetY, lerpAlpha)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, targetZ, lerpAlpha)
    const t = state.clock.elapsedTime
    // Reframe: évite de couper le haut des lettres, tout en restant haut dans le hero
    g.position.y =
      (compact ? 0.37 : 0.41) +
      Math.sin(t * 0.85) * (compact ? 0.03 : 0.04)

    const target = hovered ? HERO_LOGO_HOVER_SCALE : 1
    scaleRef.current = THREE.MathUtils.lerp(
      scaleRef.current,
      target,
      Math.min(1, HERO_LOGO_SCALE_LERP * delta),
    )
    g.scale.setScalar(scaleRef.current)

    // Lightning strike: occasional vertical hit from above (local space)
    const light = strikeLightRef.current
    if (t >= nextStrikeAt.current && strikeTTL.current <= 0) {
      const every = compact ? 5.8 : 4.8
      const jitter = compact ? 4.2 : 3.2
      nextStrikeAt.current = t + every + rand01() * jitter

      const attr = strike.geometry.getAttribute('position') as THREE.BufferAttribute
      const topY = compact ? 2.45 : 2.65
      const bottomY = compact ? 0.55 : 0.62
      const x0 = (rand01() - 0.5) * (compact ? 0.18 : 0.22)
      const z0 = (rand01() - 0.5) * (compact ? 0.18 : 0.22)

      for (let i = 0; i < strike.points; i += 1) {
        const a = i / (strike.points - 1)
        const y = THREE.MathUtils.lerp(topY, bottomY, a)
        const j = (1 - a) * (compact ? 0.22 : 0.28)
        const x = x0 + (rand01() - 0.5) * j
        const z = z0 + (rand01() - 0.5) * j
        attr.setXYZ(i, x, y, z)
      }
      attr.needsUpdate = true

      strikeTTL.current = compact ? 0.22 : 0.26
      strike.material.opacity = 1
      strike.line.visible = true
      if (light) light.intensity = compact ? 1.2 : 1.6
    }

    if (strikeTTL.current > 0) {
      strikeTTL.current = Math.max(0, strikeTTL.current - delta)
      const a = Math.min(1, strikeTTL.current / 0.12)
      strike.material.opacity = (compact ? 1.1 : 1.25) * a
      if (light) light.intensity = (compact ? 1.7 : 2.2) * a
      if (strikeTTL.current === 0) {
        strike.line.visible = false
        strike.material.opacity = 0
        if (light) light.intensity = 0
      }
    }
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
      <primitive object={strike.line} />
      <pointLight
        ref={strikeLightRef}
        position={[0, compact ? 1.25 : 1.35, compact ? 0.4 : 0.5]}
        intensity={0}
        color="#e8f7ff"
        distance={compact ? 6 : 8}
        decay={2}
      />
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
    if (key) key.intensity = (compact ? 0.45 : 0.78) * pulse

    const rim = rimRef.current
    if (rim) rim.intensity = (compact ? 0.5 : 0.72) * (0.85 + 0.15 * pulse)
  })

  return (
    <>
      <pointLight
        ref={keyRef}
        position={[0, 2.4, 5.8]}
        intensity={compact ? 0.45 : 0.78}
        color="#00ff9d"
        distance={compact ? 12 : 16}
        decay={2}
      />
      <directionalLight
        ref={rimRef}
        position={[-2.4, 2.2, -6.8]}
        intensity={compact ? 0.5 : 0.72}
        color="#00ff9d"
      />
    </>
  )
}
function HeroLogoWorld({
  hovered,
  onHoverChange,
  logoScale,
  compact,
}: {
  hovered: boolean
  onHoverChange: (v: boolean) => void
  logoScale: number
  compact: boolean
}): ReactElement {
  return (
    <>
      {/* Base très neutre */}
      <ambientLight intensity={0.18} />
      <hemisphereLight color="#ffffff" groundColor="#060606" intensity={0.34} />

      {/* Un key light discret pour garder du relief (pas de teinte autre que le glow) */}
      <directionalLight position={[4, 7, 9]} intensity={0.5} color="#ffffff" />
      {/* Fill léger derrière pour éviter un dos trop noir/plat */}
      <directionalLight position={[-3.5, 2.5, -7]} intensity={0.22} color="#ffffff" />
      {/* Neon back glow: colle au thème (accent vert) */}
      <directionalLight position={[0, 2.2, -9]} intensity={0.82} color="#00ff9d" />
      <pointLight
        position={[0, 1.2, -4.8]}
        intensity={compact ? 0.55 : 0.78}
        color="#00ff9d"
        distance={compact ? 10 : 14}
        decay={2}
      />
      {/* Fill côté caméra pour garder du détail même quand la face "moins jolie" passe */}
      <pointLight
        position={[0, 1.35, 4.9]}
        intensity={compact ? 0.2 : 0.3}
        color="#ffffff"
        distance={compact ? 10 : 12}
        decay={2}
      />

      {/* Glow neon vert (pulse) + éclairs gérés dans HeroLogoModel */}
      <NeonPulse compact={compact} />

      <HeroLogoModel
        hovered={hovered}
        onHoverChange={onHoverChange}
        logoScale={logoScale}
        compact={compact}
      />
    </>
  )
}

function HeroLogo3DBlock(): ReactElement {
  const [hovered, setHovered] = useState(false)
  const compact = useCompactViewport()

  return (
    <Canvas
      className="relative mx-auto w-full max-w-[min(100%,560px)] cursor-none touch-none active:cursor-none sm:max-w-[min(100%,760px)] md:max-w-6xl h-[min(62svh,560px)] min-h-[340px] md:h-[min(70vh,820px)] md:min-h-[520px]"
      frameloop="always"
      gl={{
        antialias: !compact,
        alpha: true,
        powerPreference: compact ? 'default' : 'high-performance',
        stencil: false,
      }}
      dpr={compact ? [1, 1.5] : [1, 2]}
      camera={{
        // Caméra un poil plus reculée/large pour éviter le crop du haut
        position: [0, compact ? 0.6 : 0.68, compact ? 5.15 : 4.45],
        fov: compact ? 36 : 38,
      }}
    >
      <Suspense fallback={null}>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <HeroLogoWorld
          hovered={hovered}
          onHoverChange={setHovered}
          logoScale={compact ? 2.35 : 3.4}
          compact={compact}
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

function ScrollReveal({
  children,
  delay = 0,
}: {
  children: ReactNode
  delay?: number
}): ReactElement {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 will-change-transform ${
        visible
          ? 'opacity-100 blur-0 translate-y-0'
          : 'opacity-0 blur-[2px] translate-y-12'
      }`}
    >
      {children}
    </div>
  )
}

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
    <main className="min-h-screen overflow-x-hidden bg-[#060606] pb-24 pt-20 text-neutral-200 sm:pb-28">
      {/* Hero */}
      <section
        className="relative flex min-h-[calc(100svh-5rem)] w-full flex-col items-center justify-start overflow-hidden px-3 pt-4 sm:px-6 sm:pt-6 md:px-8 md:pt-8"
        aria-labelledby="hero-heading"
      >
        {/* Base mood */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-[#070707] to-black" aria-hidden />

        {/* Crossfade: 2 vidéos empilées */}
        <video
          className={`pointer-events-none absolute inset-0 h-full w-full max-w-[100vw] object-cover object-center opacity-[0.5] transition-opacity ease-out ${
            showA ? 'opacity-[0.42]' : 'opacity-0'
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
          className={`pointer-events-none absolute inset-0 h-full w-full max-w-[100vw] object-cover object-center opacity-[0.5] transition-opacity ease-out ${
            showA ? 'opacity-0' : 'opacity-[0.42]'
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
        {/* Spotlight sombre au centre pour lisibilité du logo (sans “carré” derrière) */}
        <div
          className="absolute inset-0 [background:radial-gradient(70%_55%_at_50%_35%,rgba(0,0,0,0.42)_0%,rgba(0,0,0,0.14)_48%,rgba(0,0,0,0.62)_100%)]"
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
          <h2 id="hero-heading" className="sr-only">
            KDB
          </h2>
          <HeroLogo3DBlock />
        </div>
      </section>

      {/* Bio */}
      <ScrollReveal delay={220}>
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
            <p className="max-w-xl break-words hyphens-auto text-pretty text-base font-light leading-[1.75] tracking-wide text-neutral-400 sm:text-lg">
              KDB est un rappeur et sound architect du Valais. Il mélange rap
              sombre, flows tranchants et textures électroniques pour créer une
              atmosphère unique.
            </p>
          </div>
        </section>
      </ScrollReveal>

      {/* Spotify — Artiste */}
      <ScrollReveal delay={280}>
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
      </ScrollReveal>

      {/* Spotify — EP EXIT */}
      <ScrollReveal delay={340}>
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
      </ScrollReveal>

      {/* CTA */}
      <ScrollReveal delay={420}>
        <div className="mx-auto mt-24 flex justify-center px-4">
          <Link
            to="/artbook"
            className="inline-flex items-center justify-center rounded-full border border-[#00ff9d]/40 bg-[#00ff9d]/[0.06] px-11 py-4 text-[11px] font-semibold uppercase tracking-[0.38em] text-[#00ff9d] shadow-[0_0_32px_rgba(0,255,157,0.12)] transition duration-300 hover:border-[#00ff9d]/70 hover:bg-[#00ff9d]/10 hover:shadow-[0_0_48px_rgba(0,255,157,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff9d] sm:text-xs"
          >
            Entrer dans l&apos;Artbook
          </Link>
        </div>
      </ScrollReveal>
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
      <primitive object={model} dispose={null} />
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
      <ContactShadows
        position={[0, -0.6, 0]}
        opacity={0.75}
        scale={8}
        blur={2.5}
        far={4}
        color="#001a0f"
      />
      <Sparkles
        count={compact ? 60 : 120}
        scale={8}
        size={compact ? 1.5 : 2.5}
        speed={0.3}
        opacity={0.25}
        color="#00ff9d"
      />
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
        intensity={0.35}
      />

      {/* Key (haut / légèrement latéral) */}
      <directionalLight position={[7, 10, 7]} intensity={1.35} color="#ffffff" />

      {/* Fill (plus doux, teinté) */}
      <directionalLight position={[-7, 3, 2]} intensity={0.55} color="#c7fff3" />

      {/* Rim light (derrière, accent vert) */}
      <directionalLight position={[-2, 4, -9]} intensity={2.5} color="#00ff9d" />

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
        className="h-full w-full touch-none cursor-none active:cursor-none"
        frameloop="always"
        gl={{
          antialias: !compact,
          alpha: true,
          powerPreference: compact ? 'default' : 'high-performance',
          stencil: false,
        }}
        dpr={compact ? [1, 1.5] : [1, 2]}
        camera={{
          position: [0, 0.98, compact ? 5.55 : 4.7],
          fov: compact ? 48 : 44,
        }}
      >
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
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
    <main className="min-h-screen overflow-x-hidden bg-[#050505] pb-8 pt-24 text-neutral-200 sm:pb-10">
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

function CustomCursor(): ReactElement {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      setPos({ x: e.clientX, y: e.clientY })
    }
    const onDown = (): void => setIsClicking(true)
    const onUp = (): void => setIsClicking(false)

    window.addEventListener('mousemove', onMove, { passive: true })
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 pointer-events-none z-[9999] w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00ff9d] shadow-[0_0_12px_2px_rgba(0,255,157,0.8)] transition-transform duration-100 ease-out hidden md:block ${
        isClicking ? 'scale-75' : ''
      }`}
      style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
      aria-hidden
    />
  )
}

function PageTransition({
  children,
}: {
  children: (displayLocation: Location) => ReactNode
}): ReactElement {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionClass, setTransitionClass] = useState(
    'opacity-100 blur-0 scale-100',
  )

  useEffect(() => {
    const hasRouteChanged =
      location.pathname !== displayLocation.pathname ||
      location.search !== displayLocation.search ||
      location.hash !== displayLocation.hash

    if (!hasRouteChanged) return

    setTransitionClass('opacity-0 blur-[4px] scale-[0.98]')
    const timeoutId = window.setTimeout(() => {
      setDisplayLocation(location)
      setTransitionClass('opacity-100 blur-0 scale-100')
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [location, displayLocation])

  return (
    <div
      className={`transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${transitionClass}`}
    >
      {children(displayLocation)}
    </div>
  )
}

function AppContent(): ReactElement {
  return (
    <>
      <CustomCursor />
      <div className="min-h-screen min-w-0 overflow-x-hidden bg-[#060606] antialiased selection:bg-[#00ff9d]/30 selection:text-white md:cursor-none">
        <Navbar />
        <PageTransition>
          {(displayLocation) => (
            <Routes location={displayLocation}>
              <Route path="/" element={<HomePage />} />
              <Route path="/artbook" element={<ArtbookPage />} />
            </Routes>
          )}
        </PageTransition>
      </div>
    </>
  )
}

function GlobalLoader(): ReactElement | null {
  const { progress } = useProgress()
  const [isVisible, setIsVisible] = useState(true)
  const [isFading, setIsFading] = useState(false)

  useEffect(() => {
    if (progress !== 100) return

    setIsFading(true)
    const timeoutId = window.setTimeout(() => {
      setIsVisible(false)
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [progress])

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#060606] transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <GlitchNavLogo />
      <div className="mt-8 h-px w-48 bg-white/10 sm:w-64">
        <div
          className="h-full bg-[#00ff9d] transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,255,157,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-[0.3em] text-[#00ff9d]/70">
        {Math.round(progress)}%
      </p>
    </div>
  )
}

export default function App(): ReactElement {
  return (
    <>
      <GlobalLoader />
      <BrowserRouter basename={ROUTER_BASENAME}>
        <AppContent />
      </BrowserRouter>
    </>
  )
}