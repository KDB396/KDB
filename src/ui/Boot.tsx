/** Séquence de boot "KDB_OS" — remplace le loader. */
import { useEffect, useState, type ReactElement } from 'react'
import { useProgress } from '@react-three/drei'
import { useKdb } from '../state/store'

const LINES = [
  'KDB_OS v2.6 — booting…',
  'mounting /void …………… OK',
  'loading figure[kdb] ……… OK',
  'spawning particles ………… OK',
  'calibrating cursor.light … OK',
  'audio.engine: standby',
  'décryptage : « SEUL »',
] as const

export function Boot(): ReactElement | null {
  const { progress } = useProgress()
  const setBooted = useKdb((s) => s.setBooted)
  const [shown, setShown] = useState(0)
  const [fading, setFading] = useState(false)
  const [hidden, setHidden] = useState(false)

  // Révèle les lignes une par une
  useEffect(() => {
    if (shown >= LINES.length) return
    const id = window.setTimeout(() => setShown((n) => n + 1), 260)
    return () => window.clearTimeout(id)
  }, [shown])

  // Sortie quand assets chargés + lignes affichées
  useEffect(() => {
    if (progress < 100 || shown < LINES.length) return
    const fadeId = window.setTimeout(() => setFading(true), 350)
    const doneId = window.setTimeout(() => {
      setHidden(true)
      setBooted(true)
    }, 1250)
    return () => {
      window.clearTimeout(fadeId)
      window.clearTimeout(doneId)
    }
  }, [progress, shown, setBooted])

  if (hidden) return null

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col justify-center bg-[#040605] px-6 font-mono transition-opacity duration-700 ease-out sm:px-16 ${
        fading ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      aria-hidden={fading}
    >
      {/* cadre HUD */}
      <div className="pointer-events-none absolute inset-4 border border-[#00ff9d]/15 sm:inset-8" />
      <span className="pointer-events-none absolute left-4 top-4 text-[10px] tracking-[0.3em] text-[#00ff9d]/50 sm:left-8 sm:top-8">
        ◢ KDB_OS
      </span>

      <div className="mx-auto w-full max-w-xl">
        <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-[#00ff9d]/80 sm:text-sm">
          {LINES.slice(0, shown).map((l, i) => (
            <span key={l} className="block">
              <span className="text-[#00ff9d]/40">{'>'} </span>
              {l}
              {i === shown - 1 ? <span className="animate-pulse">█</span> : null}
            </span>
          ))}
        </pre>

        <div className="mt-8 h-px w-full bg-white/10">
          <div
            className="h-full bg-[#00ff9d] shadow-[0_0_12px_rgba(0,255,157,0.6)] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between text-[10px] tracking-[0.3em] text-[#00ff9d]/50">
          <span>SYS.LOAD</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  )
}
