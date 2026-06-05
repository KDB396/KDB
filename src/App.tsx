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
import type { ComponentType, ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  AdaptiveDpr,
  AdaptiveEvents,
  Center,
  Html,
  OrbitControls,
  Sparkles,
  useGLTF,
} from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing'
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { Music2, Play, X } from 'lucide-react'
import { useKdb } from './state/store'
import { useDrivers } from './hooks/useDrivers'
import { KdbPointCloud } from './three/KdbPointCloud'
import { Experience } from './three/Experience'
import { Boot } from './ui/Boot'
import { Hud } from './ui/Hud'

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

const KDB_CHARACTER_MODEL_PATH = publicAsset('models/kdb.glb')

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
// Titre ARTBOOK (page 3D)
// ---------------------------------------------------------------------------

function GlitchHeading({ children }: { children: string }): ReactElement {
  return (
    <h1 className="relative text-center">
      <span className="relative text-4xl font-black tracking-[0.15em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.65)] drop-shadow-[0_0_24px_rgba(0,255,157,0.25)] sm:text-5xl sm:tracking-[0.28em] md:text-6xl lg:text-7xl">
        {children}
      </span>
    </h1>
  )
}

// ---------------------------------------------------------------------------
// Réseaux sociaux (footer)
// ---------------------------------------------------------------------------

/**
 * Liens réseaux. Remplace les `#` par tes vraies URLs (handle).
 * Ex : 'https://www.instagram.com/kdb...'
 */
type SocialLink = {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

function SpotifyIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }): ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

const SOCIAL_LINKS: readonly SocialLink[] = [
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/artist/1NC0W7a8PRhAkuQxU15Bt1',
    icon: SpotifyIcon,
  },
  // TODO: remplace les '#' par tes vraies URLs
  { label: 'Instagram', href: '#', icon: InstagramIcon },
  { label: 'TikTok', href: '#', icon: TikTokIcon },
  { label: 'YouTube', href: '#', icon: YouTubeIcon },
  { label: 'Apple Music', href: '#', icon: Music2 },
] as const

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Logo 3D du header (branding — kdb-logo.glb)
// ---------------------------------------------------------------------------

const NAV_LOGO_PATH = publicAsset('models/kdb-logo.glb')
useGLTF.preload(NAV_LOGO_PATH)

function NavLogoModel({ spin }: { spin: boolean }): ReactElement {
  const ref = useRef<Group>(null)
  const { scene } = useGLTF(NAV_LOGO_PATH)
  const model = useMemo(() => scene.clone(), [scene])

  useFrame((_, delta) => {
    if (spin && ref.current) ref.current.rotation.y += delta * 0.5
  })

  return (
    <group ref={ref}>
      <Center>
        <primitive object={model} scale={3.4} />
      </Center>
    </group>
  )
}

/** Rendu 3D du logo de marque (header + footer). */
function NavLogo3D({
  className = '!h-12 !w-12 sm:!h-14 sm:!w-14',
}: {
  className?: string
}): ReactElement {
  const reducedMotion = useKdb((s) => s.reducedMotion)

  return (
    <Canvas
      className={`pointer-events-none drop-shadow-[0_0_14px_rgba(0,255,157,0.45)] ${className}`}
      frameloop={reducedMotion ? 'demand' : 'always'}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 4.45], fov: 38 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#ffffff" />
      <directionalLight position={[-3, 1, -4]} intensity={1.8} color="#00ff9d" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#9dffe0" />
      <Suspense fallback={null}>
        <NavLogoModel spin={!reducedMotion} />
      </Suspense>
    </Canvas>
  )
}

function Navbar(): ReactElement {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-20 border-b border-white/[0.06] bg-[#0a0a0a]/90 shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-2xl">
      <nav
        className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Navigation principale"
      >
        <Link
          to="/"
          className="flex items-center transition-opacity hover:opacity-90"
          aria-label="KDB — Accueil"
        >
          <NavLogo3D />
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

// ---------------------------------------------------------------------------
// Galerie de clips (accueil)
// ---------------------------------------------------------------------------

const CLIPS = [
  { src: publicAsset('clips/clip1.mp4'), title: 'Clip I' },
  { src: publicAsset('clips/clip2.mp4'), title: 'Clip II' },
  { src: publicAsset('clips/clip3.mp4'), title: 'Clip III' },
  { src: publicAsset('clips/clip4.mp4'), title: 'Clip IV' },
] as const

function ClipCard({
  src,
  title,
  onOpen,
}: {
  src: string
  title: string
  onOpen: (src: string) => void
}): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null)

  const onEnter = useCallback(() => {
    const v = videoRef.current
    if (v) void v.play().catch(() => {})
  }, [])

  const onLeave = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }, [])

  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-white/[0.07] bg-black shadow-[0_24px_64px_-24px_rgba(0,0,0,0.8)] outline-none transition duration-500 hover:border-[#00ff9d]/40 hover:shadow-[0_0_48px_-8px_rgba(0,255,157,0.28)] focus-visible:border-[#00ff9d]/60"
      aria-label={`Lire ${title}`}
    >
      <video
        ref={videoRef}
        src={src}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[#00ff9d]/50 bg-black/50 text-[#00ff9d] shadow-[0_0_24px_rgba(0,255,157,0.25)] backdrop-blur-sm transition duration-500 group-hover:scale-110 group-hover:bg-[#00ff9d]/15">
          <Play className="ml-0.5 h-5 w-5 fill-current" />
        </span>
      </div>
      <span className="pointer-events-none absolute bottom-3 left-4 font-mono text-[10px] uppercase tracking-[0.32em] text-neutral-300 sm:text-xs">
        {title}
      </span>
    </button>
  )
}

function ClipsGallery(): ReactElement {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setActive(null)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [active])

  return (
    <section
      className="mx-auto mt-24 max-w-6xl px-4 sm:px-6 lg:px-8"
      aria-labelledby="clips-heading"
    >
      <h3
        id="clips-heading"
        className="mb-8 text-center font-mono text-[10px] uppercase tracking-[0.48em] text-[#00ff9d]/60 sm:text-[11px]"
      >
        Clips &amp; Visuels
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {CLIPS.map((clip) => (
          <ClipCard
            key={clip.src}
            src={clip.src}
            title={clip.title}
            onOpen={setActive}
          />
        ))}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Lecteur vidéo"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/60 text-neutral-200 transition hover:border-[#00ff9d]/60 hover:text-[#00ff9d]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <video
            src={active}
            autoPlay
            controls
            loop
            playsInline
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-4xl rounded-xl border border-white/10 shadow-[0_0_80px_rgba(0,255,157,0.18)]"
          />
        </div>
      ) : null}
    </section>
  )
}

function HomePage(): ReactElement {
  return (
    <main className="relative z-10 overflow-x-hidden pb-32 text-neutral-200">
      {/* Hero — la figure vit dans le canvas immersif derrière ; ici le titre */}
      <section
        className="relative flex min-h-[100svh] w-full flex-col items-center justify-center px-4 text-center"
        aria-labelledby="hero-heading"
      >
        <h2 id="hero-heading" className="sr-only">
          KDB — Seul
        </h2>

        {/* Scrim radial DERRIÈRE le texte uniquement — garantit le contraste
            sans masquer le décor (s'éteint vers les bords). */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[55vh] w-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.55),transparent_70%)] blur-2xl"
        />

        <div className="pointer-events-none relative z-10 flex flex-col items-center gap-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.55em] text-[#00ff9d]/80 sm:text-xs">
            Rappeur · Sound architect · Valais
          </span>
          <GlitchHeading>SEUL</GlitchHeading>
          <p className="max-w-md text-balance text-sm font-light leading-relaxed text-neutral-200/90 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] sm:text-base">
            Une descente dans le vide. Bouge — ta lumière révèle ce qui s'y
            cache.
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[#00ff9d]/50">
          <span className="font-mono text-[9px] uppercase tracking-[0.4em]">
            Descendre
          </span>
          <span className="h-10 w-px bg-gradient-to-b from-[#00ff9d]/60 to-transparent" />
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

      {/* Spotify — Nouvel album */}
      <ScrollReveal delay={320}>
        <section
          className="mx-auto mt-20 max-w-3xl px-4 sm:px-6"
          aria-labelledby="spotify-album-heading"
        >
          <h3
            id="spotify-album-heading"
            className="mb-6 text-center font-mono text-[10px] uppercase tracking-[0.48em] text-[#00ff9d]/60 sm:text-[11px]"
          >
            Album — Seul
          </h3>
          <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.06] bg-[#0a0a0a] p-[10px] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(0,255,157,0.06),inset_0_1px_0_rgba(255,255,255,0.04)]">
            <iframe
              data-testid="embed-iframe"
              style={{ borderRadius: '12px' }}
              src="https://open.spotify.com/embed/album/6toCtQdMxTzSMyrhLlLHOf?utm_source=generator"
              width="100%"
              height="352"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify — Album Seul de KDB"
            />
          </div>
        </section>
      </ScrollReveal>

      {/* Spotify — EP EXIT */}
      <ScrollReveal delay={360}>
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
            data-testid="embed-iframe"
              style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/album/4Zv5t3g79jwsY6xERBppNo?utm_source=generator"
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

      {/* Clips & Visuels */}
      <ScrollReveal delay={380}>
        <ClipsGallery />
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

useGLTF.preload(KDB_CHARACTER_MODEL_PATH)

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

function ArtbookSceneAsync({ compact }: { compact: boolean }): ReactElement {
  return (
    <>
      <KdbPointCloud compact={compact} />
      {/* Poussière ambiante discrète */}
      <Sparkles
        count={compact ? 40 : 80}
        scale={8}
        size={compact ? 1.2 : 1.8}
        speed={0.25}
        opacity={0.15}
        color="#00ff9d"
      />
    </>
  )
}

/** Post-processing artbook : bloom + aberration chromatique + vignette (look clip) */
function ArtbookEffects({ compact }: { compact: boolean }): ReactElement {
  const caOffset = useMemo(() => new THREE.Vector2(0.0006, 0.0009), [])
  return (
    <EffectComposer enableNormalPass={false} multisampling={compact ? 0 : 4}>
      <Bloom
        intensity={compact ? 0.6 : 0.9}
        luminanceThreshold={0.3}
        luminanceSmoothing={0.9}
        mipmapBlur
        radius={0.82}
      />
      <ChromaticAberration
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette offset={0.26} darkness={0.82} eskil={false} />
    </EffectComposer>
  )
}

function ArtbookScene({ compact }: { compact: boolean }): ReactElement {
  return (
    <>
      {/* Pas de lumières : l'entité de points est auto-éclairée (additive). */}
      <Suspense fallback={<ModelLoadingFallback />}>
        <ArtbookSceneAsync compact={compact} />
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

      <ArtbookEffects compact={compact} />
    </>
  )
}

function Artbook3DView(): ReactElement {
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
        <ArtbookScene compact={compact} />
      </Canvas>
    </div>
  )
}

function ArtbookPage(): ReactElement {
  return (
    <main className="relative z-10 min-h-screen overflow-x-hidden pb-8 pt-24 text-neutral-200 sm:pb-10">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <GlitchHeading>ARTBOOK</GlitchHeading>

        <p className="mx-auto mt-3 max-w-xl px-1 text-center text-xs text-neutral-500 sm:mt-4 sm:text-sm">
          Entité sonore — orbite, écoute, disperse la matière.
        </p>

        <div className="mt-6 overflow-hidden rounded-lg border border-white/10 bg-black/30 shadow-[0_0_60px_rgba(0,0,0,0.5)] sm:mt-8 sm:rounded-xl">
          <Artbook3DView />
        </div>

        <p className="mt-4 px-2 text-center font-mono text-[10px] leading-relaxed text-neutral-500 sm:mt-6 sm:text-xs md:text-sm">
          <span className="text-[#00ff9d]/80">●</span> Glisser pour orbiter
          &nbsp;·&nbsp; Molette pour zoomer &nbsp;·&nbsp; bouge le curseur pour
          disperser &nbsp;·&nbsp; monte le son pour le faire vibrer
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

function SiteFooter(): ReactElement {
  const year = 2026

  return (
    <footer className="relative border-t border-white/[0.06] bg-black/40 px-4 py-16 backdrop-blur-md sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00ff9d]/40 to-transparent"
        aria-hidden
      />
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8 text-center">
        <Link to="/" className="flex items-center" aria-label="KDB — Accueil">
          <NavLogo3D className="!h-20 !w-20 sm:!h-24 sm:!w-24" />
        </Link>

        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6">
          {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
            <li key={label}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-neutral-400 transition duration-300 hover:border-[#00ff9d]/50 hover:bg-[#00ff9d]/[0.06] hover:text-[#00ff9d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00ff9d]"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </a>
            </li>
          ))}
        </ul>

        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-neutral-600">
          © {year} KDB — Valais · Tous droits réservés
        </p>
      </div>
    </footer>
  )
}

function AppContent(): ReactElement {
  useDrivers()

  return (
    <>
      {/* Canvas immersif persistant — vit derrière toute l'UI */}
      <Experience />
      <Hud />
      <CustomCursor />

      <div className="relative z-10 min-h-screen min-w-0 overflow-x-hidden antialiased selection:bg-[#00ff9d]/30 selection:text-white md:cursor-none">
        <Navbar />
        <PageTransition>
          {(displayLocation) => (
            <Routes location={displayLocation}>
              <Route path="/" element={<HomePage />} />
              <Route path="/artbook" element={<ArtbookPage />} />
            </Routes>
          )}
        </PageTransition>
        <SiteFooter />
      </div>
    </>
  )
}

export default function App(): ReactElement {
  return (
    <>
      <Boot />
      <BrowserRouter basename={ROUTER_BASENAME}>
        <AppContent />
      </BrowserRouter>
    </>
  )
}