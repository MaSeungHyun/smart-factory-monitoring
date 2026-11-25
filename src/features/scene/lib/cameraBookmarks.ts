import { FACTORY_TEMPLATE } from '@/features/template'
import { cameraBus } from '@/shared/stores/cameraBus'
import { monitorView } from '@/shared/stores/useMonitorViewStore'
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

/** 1~9번 시점 북마크. 없거나 빈 칸이면 null */
export function cameraBookmark(slot: number) {
  if (!Number.isInteger(slot) || slot < 1) return null

  return cameraBookmarks()[slot - 1] ?? null
}

/** 숫자 키 1~9 를 누른 것과 같게 해당 시점으로 비행. 빈 칸이면 무시. 다른 탭이면 메인 관제로 바꾼 뒤 비행한다 */
export function flyToCameraBookmark(slot: number) {
  const bookmark = cameraBookmark(slot)

  if (!bookmark) return false

  const view = monitorView.getState()

  // 장비 상세 · 스캔 · 창고 탭에서도 공장 메인 화면으로 전환한 뒤 북마크로 비행한다
  if (view.view !== 'main') view.set('main')

  view.release()

  cameraBus.request({
    kind: 'look',
    position: [bookmark.position[0], bookmark.position[1], bookmark.position[2]],
    target: [bookmark.target[0], bookmark.target[1], bookmark.target[2]]
  })

  return true
}
