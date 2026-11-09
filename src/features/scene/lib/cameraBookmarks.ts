import { FACTORY_TEMPLATE } from '@/features/template'
import type { CameraView } from '@/shared/types'

function isView(value: unknown): value is CameraView {
  if (!value || typeof value !== 'object') return false

  const entry = value as CameraView

  return (
    Array.isArray(entry.position) &&
    entry.position.length === 3 &&
    Array.isArray(entry.target) &&
    entry.target.length === 3
  )
}

/** 템플릿 camera.bookmarks (2~9번 시점). 1번은 기존 홈(main_cam) */
export function cameraBookmarks(): CameraView[] {
  const raw = FACTORY_TEMPLATE.camera?.bookmarks ?? []

  return raw.filter(isView)
}
