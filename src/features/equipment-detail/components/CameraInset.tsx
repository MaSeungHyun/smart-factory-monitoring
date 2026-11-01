import { cn } from '@/shared/lib/cn'

import { CAMERA_INSET } from '../data/robotDetail.mock'

/** 비전 카메라 인셋 372x212 — 영상 소스 연결 전 자리표시 (목업 인식 박스) */
export default function CameraInset() {
  return (
    <div className="pointer-events-auto h-[212px] w-[372px] rounded border border-border-default bg-bg-surface/90 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-caption">
        <span className="size-2 animate-pulse rounded-full bg-status-error" />

        <span className="text-text-primary">{CAMERA_INSET.title}</span>

        <span className="ml-auto text-text-tertiary">{CAMERA_INSET.meta}</span>
      </div>

      <div className="relative mt-2 h-[160px] overflow-hidden rounded bg-bg-base">
        {CAMERA_INSET.boxes.map((box) => (
          <div
            key={`${box.left}-${box.top}`}
            style={{ left: box.left + 40, top: box.top, width: box.width, height: box.height }}
            className={cn(
              'absolute rounded-sm border',
              box.warn ? 'border-status-warning bg-status-warning/16' : 'border-status-success bg-status-success/10',
            )}
          >
            <span className={cn('absolute -top-3.5 left-0 text-[9px]', box.warn ? 'text-status-warning' : 'text-status-success')}>
              {box.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
