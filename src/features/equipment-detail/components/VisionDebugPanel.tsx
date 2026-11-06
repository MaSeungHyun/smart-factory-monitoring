import { Bug, Copy, RotateCcw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { VISION_DEBUG_POLL_MS } from '@/features/scene/constants/visionCamera'
import { setVisionOverride, visionReadout, type VisionPose, type VisionReadout } from '@/features/scene/lib/visionDebug'

const PROCESS_LABEL = { palletizing: '팔레타이징', depalletizing: '디팔레타이징', scan: '스캔' } as const

type Field = 'eye' | 'look'

const AXES = ['x', 'y', 'z'] as const

const poseOf = (value: VisionReadout): VisionPose => ({ eye: value.eye, look: value.look, up: value.up, rollDeg: value.rollDeg, fov: value.fov })

const inputClass = 'w-[72px] rounded border border-border-default bg-bg-surface-2 px-1 py-0.5 text-right text-text-primary outline-none focus:border-primary-on-dark'

/** 3D 비전 구도 디버그: 실제 렌더 카메라 값을 보고, 고쳐서 바로 인셋에 반영 · 복사 */
export default function VisionDebugPanel({ id }: { id: string }) {
  const [open, setOpen] = useState(false)

  const [value, setValue] = useState<VisionReadout | null>(null)

  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return

    const read = () => setValue(visionReadout(id))

    read()

    const timer = window.setInterval(read, VISION_DEBUG_POLL_MS)

    return () => window.clearInterval(timer)
  }, [open, id])

  if (!open) {
    return (
      <button type="button" aria-label="비전 구도 디버그" onClick={() => setOpen(true)} className="pointer-events-auto absolute top-1 right-1 z-10 flex size-6 items-center justify-center rounded bg-bg-surface/80 text-text-tertiary hover:text-text-primary">
        <Bug size={13} />
      </button>
    )
  }

  const update = (patch: Partial<VisionPose>) => {
    if (!value) return

    const pose = { ...poseOf(value), ...patch }

    setVisionOverride(id, pose)

    setValue({ ...value, ...pose, overridden: true })
  }

  const setAxis = (field: Field, axis: number, next: number) => {
    if (!value || Number.isNaN(next)) return

    const vector = [...value[field]] as [number, number, number]

    vector[axis] = next

    update({ [field]: vector })
  }

  const text = value ? JSON.stringify({ id, process: value.process, ...poseOf(value), rotationDeg: value.rotationDeg }, null, 2) : ''

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)

      setCopied(true)

      window.setTimeout(() => setCopied(false), 1200)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="pointer-events-auto absolute inset-x-1 top-1 z-10 rounded border border-border-default bg-bg-surface/95 p-2 text-[11px] text-text-secondary">
      <div className="mb-1 flex items-center gap-2">
        <span className="font-semibold text-text-primary">구도 디버그</span>

        <span className="text-primary-on-dark">{value?.process ? PROCESS_LABEL[value.process] : '공정 없음'}</span>

        {value?.overridden && <span className="text-status-warning">고정됨</span>}

        <button type="button" aria-label="원래 구도" onClick={() => { setVisionOverride(id, null); setValue(null) }} className="ml-auto hover:text-text-primary"><RotateCcw size={12} /></button>

        <button type="button" aria-label="현재 구도 복사" onClick={copy} className="hover:text-text-primary"><Copy size={12} /></button>

        <button type="button" aria-label="디버그 닫기" onClick={() => setOpen(false)} className="hover:text-text-primary"><X size={12} /></button>
      </div>

      {value ? (
        <div className="flex flex-col gap-1">
          {(['eye', 'look'] as const).map((field) => (
            <label key={field} className="flex items-center gap-1">
              <span className="w-9">{field === 'eye' ? '위치' : '타깃'}</span>

              {AXES.map((axis, index) => (
                <input key={axis} aria-label={`${field} ${axis}`} type="number" step={0.05} value={value[field][index]} onChange={(event) => setAxis(field, index, event.target.valueAsNumber)} className={inputClass} />
              ))}
            </label>
          ))}

          <label className="flex items-center gap-1">
            <span className="w-9">롤°</span>

            <input aria-label="roll" type="number" step={1} value={value.rollDeg} onChange={(event) => update({ rollDeg: event.target.valueAsNumber || 0 })} className={inputClass} />

            <span className="ml-2">FOV</span>

            <input aria-label="fov" type="number" step={1} value={value.fov} onChange={(event) => update({ fov: event.target.valueAsNumber || value.fov })} className={inputClass} />
          </label>

          <div className="text-text-tertiary">회전(XYZ°) {value.rotationDeg.join(' / ')}{copied ? ' · 복사됨' : ''}</div>
        </div>
      ) : (
        <div className="text-text-tertiary">카메라 값 읽는 중…</div>
      )}
    </div>
  )
}
