/**
 * Store global KDB_OS — pont entre la 3D (R3F) et l'UI (DOM/HUD).
 * Volontairement minimal : valeurs hautes fréquence (pointer, scroll, audio)
 * lues dans useFrame, mutées hors React pour éviter les re-renders.
 */
import { create } from 'zustand'

export type Section = {
  id: string
  label: string
}

/** Stations de la descente (ordre = ordre de scroll). */
export const SECTIONS: readonly Section[] = [
  { id: 'intro', label: 'SEUL' },
  { id: 'bio', label: 'ORIGINE' },
  { id: 'album', label: 'ALBUM // SEUL' },
  { id: 'exit', label: 'EP // EXIT' },
  { id: 'clips', label: 'VISUELS' },
  { id: 'exitpoint', label: 'EXIT' },
] as const

type KdbState = {
  /** Boot KDB_OS terminé → l'expérience est interactive. */
  booted: boolean
  setBooted: (v: boolean) => void

  /** L'utilisateur préfère réduire les animations (a11y / perf). */
  reducedMotion: boolean
  setReducedMotion: (v: boolean) => void

  /** Appareil compact (téléphone) — budget perf réduit. */
  compact: boolean
  setCompact: (v: boolean) => void

  /** Index de section active (pour le HUD). */
  activeSection: number
  setActiveSection: (i: number) => void

  /** Audio prêt (un .mp3 a été chargé et joue). */
  audioReady: boolean
  setAudioReady: (v: boolean) => void
}

export const useKdb = create<KdbState>((set) => ({
  booted: false,
  setBooted: (v) => set({ booted: v }),

  reducedMotion: false,
  setReducedMotion: (v) => set({ reducedMotion: v }),

  compact: false,
  setCompact: (v) => set({ compact: v }),

  activeSection: 0,
  setActiveSection: (i) => set({ activeSection: i }),

  audioReady: false,
  setAudioReady: (v) => set({ audioReady: v }),
}))

/**
 * Bus de valeurs haute fréquence — PAS dans React (mutation directe).
 * Lu dans useFrame, écrit par les listeners pointer/scroll/audio.
 */
export const bus = {
  /** Pointer normalisé [-1, 1], lissé. */
  pointer: { x: 0, y: 0, tx: 0, ty: 0 },
  /** Progression de scroll globale [0, 1]. */
  scroll: 0,
  /** Niveau audio global [0, 1] (procédural tant qu'aucun mp3). */
  audio: 0,
  /** Bandes audio : graves / médiums / aigus [0, 1]. */
  bands: { low: 0, mid: 0, high: 0 },
  /** Contrôle du son des clips de fond (fourni par VideoVoid). */
  clipAudio: null as {
    enable: () => Promise<boolean>
    disable: () => void
  } | null,
}
