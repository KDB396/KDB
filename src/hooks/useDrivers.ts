/**
 * Drivers d'entrée KDB_OS : pointer + scroll fluide (Lenis).
 * Monté une seule fois à la racine. Écrit dans `bus` (hors React) et
 * pousse les changements de section dans le store zustand.
 */
import { useEffect } from 'react'
import Lenis from 'lenis'
import { bus, SECTIONS, useKdb } from '../state/store'

export function useDrivers(): void {
  const setReducedMotion = useKdb((s) => s.setReducedMotion)
  const setCompact = useKdb((s) => s.setCompact)
  const setActiveSection = useKdb((s) => s.setActiveSection)

  // Media queries → store
  useEffect(() => {
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cp = window.matchMedia('(max-width: 767px)')
    const applyRm = (): void => setReducedMotion(rm.matches)
    const applyCp = (): void => setCompact(cp.matches)
    applyRm()
    applyCp()
    rm.addEventListener('change', applyRm)
    cp.addEventListener('change', applyCp)
    return () => {
      rm.removeEventListener('change', applyRm)
      cp.removeEventListener('change', applyCp)
    }
  }, [setReducedMotion, setCompact])

  // Pointer (cible ; le lissage se fait dans la boucle 3D)
  useEffect(() => {
    const onMove = (clientX: number, clientY: number): void => {
      bus.pointer.tx = (clientX / window.innerWidth) * 2 - 1
      bus.pointer.ty = -((clientY / window.innerHeight) * 2 - 1)
    }
    const onMouse = (e: MouseEvent): void => onMove(e.clientX, e.clientY)
    const onTouch = (e: TouchEvent): void => {
      const t = e.touches[0]
      if (t) onMove(t.clientX, t.clientY)
    }
    window.addEventListener('mousemove', onMouse, { passive: true })
    window.addEventListener('touchmove', onTouch, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
    }
  }, [])

  // Scroll fluide Lenis → bus.scroll + section active
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
    })

    let lastSection = -1
    lenis.on('scroll', ({ progress }: { progress: number }) => {
      const p = Number.isFinite(progress) ? progress : 0
      bus.scroll = p
      const idx = Math.min(
        SECTIONS.length - 1,
        Math.floor(p * SECTIONS.length + 0.001),
      )
      if (idx !== lastSection) {
        lastSection = idx
        setActiveSection(idx)
      }
    })

    let raf = 0
    const loop = (time: number): void => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      lenis.destroy()
    }
  }, [setActiveSection])
}
