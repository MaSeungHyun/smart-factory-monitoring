import { Settings } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/Popover'
import Select from '@/shared/components/ui/Select'
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

/** 왼쪽 레일 톱니: 렌더링 품질 · 그림자 · Bloom · WebGL/WebGPU */
export default function GraphicsSettings() {
  const graphics = useGraphics()

  const [open, setOpen] = useState(false)

  return (
    <div className="mt-auto">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          aria-label="설정"
          className={cn(
            'flex size-10 items-center justify-center rounded',
            open ? 'bg-primary-fill/16 text-primary-on-dark' : 'text-text-tertiary hover:text-text-secondary',
          )}
        >
          <Settings size={24} />
        </PopoverTrigger>

        <PopoverContent
          side="right"
          align="end"
          data-graphics-settings
          aria-label="그래픽 설정"
          className="flex max-h-[calc(100vh-32px)] w-[280px] flex-col gap-3 overflow-y-auto"
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
        </PopoverContent>
      </Popover>
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
    <div className="flex flex-col gap-1.5">
      <span className="text-caption text-text-tertiary">{label}</span>

      {children}
    </div>
  )
}
