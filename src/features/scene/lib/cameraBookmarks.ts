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

/** 템플릿 camera.bookmarks. 인덱스 0 = 1번 키 … 8 = 9번 키, 빈 칸(null·잘못된 값)은 자리를 지켜 null */
export function cameraBookmarks(): (CameraView | null)[] {
  const raw = FACTORY_TEMPLATE.camera?.bookmarks ?? []

  return raw.map((entry) => (isView(entry) ? entry : null))
}
