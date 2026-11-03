import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

const KEY = 'sfm.graphics'

export const RENDER_QUALITIES = ['performance', 'balanced', 'high'] as const

export const SHADOW_LEVELS = ['off', 'low', 'high'] as const

export const RENDERERS = ['webgl', 'webgpu'] as const

export type RenderQuality = (typeof RENDER_QUALITIES)[number]

export type ShadowLevel = (typeof SHADOW_LEVELS)[number]

export type RendererKind = (typeof RENDERERS)[number]

/** 렌더링 품질 → 픽셀 비율 상한. 고품질이 Canvas 기본값 [1, 2] 와 같다 */
export const QUALITY_DPR: Record<RenderQuality, [number, number]> = {
  performance: [1, 1],
  balanced: [1, 1.5],
  high: [1, 2],
}

export const SHADOW_MAP: Record<Exclude<ShadowLevel, 'off'>, number> = {
  low: 1024,
  high: 2048,
}

interface Persisted {
  quality: RenderQuality
  shadow: ShadowLevel
  /** AMR 실루엣만 번짐 */
  amrBloom: boolean
  /** MSAA. 캔버스를 다시 만들 때만 반영된다 */
  antialias: boolean
  renderer: RendererKind
  /** 패널 · 카드 등장 애니메이션 */
  panelMotion: boolean
}

export interface GraphicsState extends Persisted {
  /** 실제로 올라간 백엔드. WebGPU 초기화가 실패하면 webgl */
  active: RendererKind
  fallback: string | null
}

interface GraphicsActions {
  setQuality: (quality: RenderQuality) => void
  setShadow: (shadow: ShadowLevel) => void
  setAmrBloom: (amrBloom: boolean) => void
  setAntialias: (antialias: boolean) => void
  setRenderer: (renderer: RendererKind) => void
  setPanelMotion: (panelMotion: boolean) => void
  /** 캔버스가 실제로 쓴 백엔드. 선호값(renderer)은 바꾸지 않는다 */
  markActive: (active: RendererKind, fallback: string | null) => void
}

const DEFAULTS: Persisted = {
  quality: 'high',
  shadow: 'high',
  amrBloom: false,
  antialias: true,
  renderer: 'webgl',
  panelMotion: true,
}

function oneOf<T extends string>(value: unknown, list: readonly T[], fallback: T) {
  return list.includes(value as T) ? (value as T) : fallback
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY)

    if (!raw) return DEFAULTS

    const parsed = JSON.parse(raw) as Partial<Persisted> & { bloom?: unknown }

    const legacy = parsed.bloom

    return {
      quality: oneOf(parsed.quality, RENDER_QUALITIES, DEFAULTS.quality),
      shadow: oneOf(parsed.shadow, SHADOW_LEVELS, DEFAULTS.shadow),
      amrBloom: typeof parsed.amrBloom === 'boolean' ? parsed.amrBloom : legacy === 'soft' || legacy === 'strong' || legacy === true,
      antialias: typeof parsed.antialias === 'boolean' ? parsed.antialias : DEFAULTS.antialias,
      renderer: oneOf(parsed.renderer, RENDERERS, DEFAULTS.renderer),
      panelMotion: typeof parsed.panelMotion === 'boolean' ? parsed.panelMotion : DEFAULTS.panelMotion,
    }
  } catch {
    return DEFAULTS
  }
}

function write() {
  const { quality, shadow, amrBloom, antialias, renderer, panelMotion } = graphicsStore.getState()

  localStorage.setItem(KEY, JSON.stringify({ quality, shadow, amrBloom, antialias, renderer, panelMotion }))
}

export const graphicsStore = createStore<GraphicsState & GraphicsActions>((set, get) => ({
  ...load(),
  active: 'webgl',
  fallback: null,

  setQuality(quality) {
    if (quality === get().quality) return

    set({ quality })

    write()
  },

  setShadow(shadow) {
    if (shadow === get().shadow) return

    set({ shadow })

    write()
  },

  setAmrBloom(amrBloom) {
    if (amrBloom === get().amrBloom) return

    set({ amrBloom })

    write()
  },

  setAntialias(antialias) {
    if (antialias === get().antialias) return

    set({ antialias })

    write()
  },

  setRenderer(renderer) {
    if (renderer === get().renderer) return

    set({ renderer, fallback: null })

    write()
  },

  setPanelMotion(panelMotion) {
    if (panelMotion === get().panelMotion) return

    set({ panelMotion })

    write()
  },

  markActive(active, fallback) {
    if (active === get().active && fallback === get().fallback) return

    set({ active, fallback })
  },
}))

/** 그래픽 설정 (품질 · 그림자 · Bloom · 렌더러) */
export function useGraphics() {
  return useStore(graphicsStore)
}
