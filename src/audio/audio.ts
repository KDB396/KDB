/**
 * Audio-réactif KDB_OS.
 * - attachAudio(el) : branche un <audio> sur un AnalyserNode Web Audio.
 * - sampleAudio(t)  : remplit `bus.audio` / `bus.bands`.
 *     → si un analyseur est branché : vraies données FFT.
 *     → sinon : signal procédural (le monde pulse déjà sans mp3).
 */
import { bus } from '../state/store'

type AudioRig = {
  ctx: AudioContext
  analyser: AnalyserNode
  data: Uint8Array<ArrayBuffer>
}

let rig: AudioRig | null = null

export function isAudioLive(): boolean {
  return rig !== null
}

/** Branche un analyseur déjà construit (ex. le graphe audio des clips de fond). */
export function setAnalyser(ctx: AudioContext, analyser: AnalyserNode): void {
  rig = {
    ctx,
    analyser,
    data: new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)),
  }
}

/** Détache l'analyseur → sampleAudio repasse en procédural. */
export function clearAnalyser(): void {
  rig = null
}

/** Branche un élément <audio> (appelé après un geste utilisateur). */
export async function attachAudio(el: HTMLAudioElement): Promise<boolean> {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    const ctx = new Ctx()
    if (ctx.state === 'suspended') await ctx.resume()

    const src = ctx.createMediaElementSource(el)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.82
    src.connect(analyser)
    analyser.connect(ctx.destination)

    rig = {
      ctx,
      analyser,
      data: new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount)),
    }
    return true
  } catch {
    return false
  }
}

function smooth(prev: number, next: number, a: number): number {
  return prev + (next - prev) * a
}

/** À appeler chaque frame avec le temps écoulé (s). */
export function sampleAudio(t: number): void {
  if (rig) {
    rig.analyser.getByteFrequencyData(rig.data)
    const n = rig.data.length
    const lowEnd = Math.floor(n * 0.12)
    const midEnd = Math.floor(n * 0.45)

    let low = 0
    let mid = 0
    let high = 0
    for (let i = 0; i < n; i += 1) {
      const v = rig.data[i]! / 255
      if (i < lowEnd) low += v
      else if (i < midEnd) mid += v
      else high += v
    }
    low /= lowEnd || 1
    mid /= midEnd - lowEnd || 1
    high /= n - midEnd || 1

    bus.bands.low = smooth(bus.bands.low, low, 0.4)
    bus.bands.mid = smooth(bus.bands.mid, mid, 0.4)
    bus.bands.high = smooth(bus.bands.high, high, 0.4)
    bus.audio = smooth(bus.audio, low * 0.6 + mid * 0.3 + high * 0.1, 0.4)
    return
  }

  // Repli procédural : un "faux beat" organique à ~92 BPM.
  const beat = Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 2 * (92 / 60)), 6)
  const low = 0.25 + 0.55 * beat
  const mid = 0.2 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.7 + 1.2))
  const high = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(t * 4.3 + 0.4))

  bus.bands.low = smooth(bus.bands.low, low, 0.18)
  bus.bands.mid = smooth(bus.bands.mid, mid, 0.18)
  bus.bands.high = smooth(bus.bands.high, high, 0.18)
  bus.audio = smooth(bus.audio, low * 0.6 + mid * 0.3 + high * 0.1, 0.18)
}
