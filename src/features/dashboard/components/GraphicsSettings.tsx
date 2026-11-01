import { Settings } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import Select from '@/shared/components/Select'
import { cn } from '@/shared/lib/cn'
import { graphicsStore, useGraphics, type RenderQuality, type RendererKind, type ShadowLevel } from '@/shared/stores/useGraphicsStore'

const QUALITY = [
  { value: 'performance', label: '성능' },
  { value: 'balanced', label: '균형' },
  { value: 'high', label: '고품질' },
]

const SHADOW = [
  { value: 'off', label: '끄기' },
  { value: 'low', label: '낮음' },
  { value: 'high', label: '높음' },
]

const RENDERER = [
  { value: 'webgl', label: 'WebGL' },
  { value: 'webgpu', label: 'WebGPU' },
]

function insideSettings(target: EventTarget | null) {
  return target instanceof Element && !!target.closest('[data-graphics-settings], [data-radix-popper-content-wrapper]')
}

/** 왼쪽 레일 톱니: 렌더링 품질 · 그림자 · Bloom · WebGL/WebGPU */
export default function GraphicsSettings() {
  const graphics = useGraphics()

  const [open, setOpen] = useState(false)

  const root = useRef<HTMLDivElement>(null)

  const panelId = useId()

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    const onPointer = (event: PointerEvent) => {
      if (root.current?.contains(event.target as Node) || insideSettings(event.target)) return

      setOpen(false)
    }

    window.addEventListener('keydown', onKey)

    window.addEventListener('pointerdown', onPointer)

    return () => {
      window.removeEventListener('keydown', onKey)

      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  const rect = root.current?.getBoundingClientRect()

  return (
    <div ref={root} className="mt-auto">
      <button
        type="button"
        aria-label="설정"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex size-10 items-center justify-center rounded',
          open ? 'bg-primary-fill/16 text-primary-on-dark' : 'text-text-tertiary hover:text-text-secondary',
        )}
      >
        <Settings size={24} />
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            id={panelId}
            data-graphics-settings
            role="dialog"
            aria-label="그래픽 설정"
            className="fixed z-50 flex max-h-[calc(100vh-32px)] w-[280px] flex-col gap-3 overflow-y-auto rounded border border-border-default bg-bg-surface p-4 shadow-lg"
            style={{ left: rect.right + 12, bottom: 16 }}
          >
            <Field label="렌더링 품질">
              <Select
                ariaLabel="렌더링 품질"
                value={graphics.quality}
                options={QUALITY}
                onValueChange={(value) => graphicsStore.getState().setQuality(value as RenderQuality)}
              />
            </Field>

            <Field label="그림자 성능">
              <Select
                ariaLabel="그림자 성능"
                value={graphics.shadow}
                options={SHADOW}
                onValueChange={(value) => graphicsStore.getState().setShadow(value as ShadowLevel)}
              />
            </Field>

            <Toggle
              label="안티앨리어싱"
              checked={graphics.antialias}
              onClick={() => graphicsStore.getState().setAntialias(!graphics.antialias)}
            />

            <Toggle label="AMR Bloom" checked={graphics.amrBloom} onClick={() => graphicsStore.getState().setAmrBloom(!graphics.amrBloom)} />

            <Field label="렌더러">
              <Select
                ariaLabel="WebGL WebGPU"
                value={graphics.renderer}
                options={RENDERER}
                onValueChange={(value) => graphicsStore.getState().setRenderer(value as RendererKind)}
              />
            </Field>

            {graphics.fallback && <p className="text-caption text-text-tertiary">{graphics.fallback}</p>}

            {graphics.renderer === 'webgpu' && graphics.amrBloom && (
              <p className="text-caption text-text-tertiary">AMR Bloom은 WebGL에서 적용됩니다.</p>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}

function Toggle({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <div className="flex h-11 items-center justify-between rounded border border-border-default bg-bg-surface-2 px-3">
      <span className="text-label font-semibold text-text-primary">{label}</span>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onClick}
        className={cn('relative h-6 w-11 rounded-full', checked ? 'bg-primary-fill' : 'bg-bg-base')}
      >
        <span className={cn('absolute top-0.5 size-5 rounded-full bg-text-primary', checked ? 'left-5' : 'left-0.5')} />
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-caption text-text-tertiary">{label}</span>

      {children}
    </label>
  )
}
