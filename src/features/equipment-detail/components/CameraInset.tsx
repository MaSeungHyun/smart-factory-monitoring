import { cn } from '@/shared/lib/cn'

import { CAMERA_INSET } from '../data/robotDetail.mock'

export interface InsetBox {
  label: string
  left: number
  top: number
  width: number
  height: number
  warn?: boolean
  tone?: 'success' | 'info' | 'error'
}

interface CameraInsetProps {
  title?: string
  meta?: string
  boxes?: InsetBox[]
}

const TONE_CLASS = {
  success: ['border-status-success bg-status-success/10', 'text-status-success'],
  info: ['border-primary-on-dark bg-primary-on-dark/10', 'text-primary-on-dark'],
  error: ['border-status-error bg-status-error/16', 'text-status-error'],
  warning: ['border-status-warning bg-status-warning/16', 'text-status-warning'],
}

/** 비전 카메라 인셋 372x212 — 기본값은 영상 소스 연결 전 자리표시 (목업 인식 박스) */
export default function CameraInset({ title = CAMERA_INSET.title, meta = CAMERA_INSET.meta, boxes = CAMERA_INSET.boxes }: CameraInsetProps) {
  return (
    <div className="pointer-events-auto h-[212px] w-[372px] rounded border border-border-default bg-bg-surface/90 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-caption">
        <span className="size-2 animate-pulse rounded-full bg-status-error" />

        <span className="text-text-primary">{title}</span>

        <span className="ml-auto text-text-tertiary">{meta}</span>
      </div>

      <div className="relative mt-2 h-[160px] overflow-hidden rounded bg-bg-base">
        {boxes.map((box: InsetBox) => (
          <div
            key={`${box.left}-${box.top}`}
            style={{ left: box.left + 40, top: box.top, width: box.width, height: box.height }}
            className={cn('absolute rounded-sm border', TONE_CLASS[box.tone ?? (box.warn ? 'warning' : 'success')][0])}
          >
            <span className={cn('absolute -top-3.5 left-0 text-[9px] font-semibold whitespace-nowrap', TONE_CLASS[box.tone ?? (box.warn ? 'warning' : 'success')][1])}>
              {box.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
