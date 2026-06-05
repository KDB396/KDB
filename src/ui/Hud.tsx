/** Overlay HUD "KDB_OS" — chrome d'interface au-dessus de la 3D. */
import { useEffect, useRef, useState, type ReactElement } from 'react'
import { bus, SECTIONS, useKdb } from '../state/store'

function AudioToggle(): ReactElement {
  const audioReady = useKdb((s) => s.audioReady)
  const setAudioReady = useKdb((s) => s.setAudioReady)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const enable = async (): Promise<void> => {
    // Coupe le son des clips de fond
    if (audioReady) {
      bus.clipAudio?.disable()
      setAudioReady(false)
      return
    }
    // Active le son des clips de fond (geste utilisateur requis)
    if (!bus.clipAudio) {
      setStatus('error')
      return
    }
    setStatus('loading')
    const ok = await bus.clipAudio.enable()
    if (ok) {
      setStatus('idle')
      setAudioReady(true)
    } else {
      setStatus('error')
    }
  }

  return (
    <button
      type="button"
      onClick={() => void enable()}
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-[#00ff9d]/25 bg-black/40 px-3 py-1.5 text-[9px] uppercase tracking-[0.28em] text-[#00ff9d]/80 backdrop-blur-sm transition hover:border-[#00ff9d]/60 hover:text-[#00ff9d] sm:text-[10px]"
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          audioReady
            ? 'animate-pulse bg-[#00ff9d] shadow-[0_0_8px_#00ff9d]'
            : status === 'error'
              ? 'bg-red-500'
              : 'bg-[#00ff9d]/40'
        }`}
      />
      {audioReady
        ? 'audio · live'
        : status === 'loading'
          ? 'link…'
          : status === 'error'
            ? 'no signal'
            : 'enable audio'}
    </button>
  )
}

function Readout(): ReactElement {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    let raf = 0
    const tick = (): void => {
      if (ref.current) {
        const y = (bus.scroll * 999).toFixed(0).padStart(3, '0')
        const a = (bus.audio * 100).toFixed(0).padStart(2, '0')
        ref.current.textContent = `Y:${y} · AMP:${a}`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return <span ref={ref} className="tabular-nums">Y:000 · AMP:00</span>
}

export function Hud(): ReactElement {
  const active = useKdb((s) => s.activeSection)
  const label = SECTIONS[active]?.label ?? ''

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none font-mono text-[#00ff9d]">
      {/* coins */}
      <span className="absolute left-3 top-3 h-5 w-5 border-l border-t border-[#00ff9d]/30 sm:left-5 sm:top-5" />
      <span className="absolute right-3 top-3 h-5 w-5 border-r border-t border-[#00ff9d]/30 sm:right-5 sm:top-5" />
      <span className="absolute bottom-3 left-3 h-5 w-5 border-b border-l border-[#00ff9d]/30 sm:bottom-5 sm:left-5" />
      <span className="absolute bottom-3 right-3 h-5 w-5 border-b border-r border-[#00ff9d]/30 sm:bottom-5 sm:right-5" />

      {/* haut gauche : OS + section */}
      <div className="absolute left-6 top-5 flex flex-col gap-1 text-[9px] tracking-[0.3em] sm:left-9 sm:top-8 sm:text-[10px]">
        <span className="text-[#00ff9d]/50">◢ KDB_OS</span>
        <span className="text-[#00ff9d]/80">{label}</span>
      </div>

      {/* bas gauche : audio + readout live */}
      <div className="absolute bottom-6 left-6 flex flex-col items-start gap-2 sm:bottom-9 sm:left-9">
        <AudioToggle />
        <span className="text-[9px] tracking-[0.3em] text-[#00ff9d]/50 sm:text-[10px]">
          <Readout />
        </span>
      </div>

      {/* bas droite : hint scroll */}
      <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[9px] tracking-[0.3em] text-[#00ff9d]/50 sm:bottom-9 sm:right-9 sm:text-[10px]">
        <span>SCROLL</span>
        <span className="inline-block h-3 w-px animate-pulse bg-[#00ff9d]/60" />
      </div>
    </div>
  )
}
