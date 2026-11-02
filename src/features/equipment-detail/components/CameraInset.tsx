import { useLayoutEffect, useRef } from 'react'

import { visionPort, type VisionKind } from '@/features/scene/lib/visionPort'

interface CameraInsetProps {
  meta: string
  kind: VisionKind
  id: string
  title?: string
}

/** 비전 인셋. 영상은 작업 구역 카메라가 캔버스에 그리고, 인식 박스는 그 화면 위에 올린다 */
export default function CameraInset({ title = '비전 인식', meta, kind, id }: CameraInsetProps) {
  const hole = useRef<HTMLDivElement>(null)

  const overlay = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const holeElement = hole.current

    const overlayElement = overlay.current

    visionPort.hole = holeElement

    visionPort.overlay = overlayElement

    visionPort.kind = kind

    visionPort.id = id

    return () => {
      if (visionPort.hole !== holeElement) return

      visionPort.hole = null

      visionPort.overlay = null

      visionPort.kind = null

      visionPort.id = null

      overlayElement?.replaceChildren()
    }
  }, [kind, id])

  return (
    <div className="pointer-events-auto w-[372px] overflow-hidden rounded border border-border-default">
      <div className="flex items-center gap-1.5 bg-bg-surface/90 px-3 py-2 text-caption backdrop-blur">
        <span className="size-2 animate-pulse rounded-full bg-status-error" />

        <span className="text-text-primary">{title}</span>

        <span className="ml-auto text-text-tertiary">{meta}</span>
      </div>

      <div ref={hole} className="relative h-[160px]">
        <div ref={overlay} className="pointer-events-none absolute inset-0 overflow-hidden" />
      </div>
    </div>
  )
}
