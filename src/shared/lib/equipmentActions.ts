import { cameraBus } from '@/shared/stores/cameraBus'
import { monitorView } from '@/shared/stores/useMonitorViewStore'
import { uiStore } from '@/shared/stores/useUiStore'

/** 목록 더블클릭: 로봇 · AMR 계열 · 스캐너는 상세 탭으로, 나머지는 카메라를 그 장비로 */
export function openEquipment(id: string) {
  uiStore.getState().select(id)

  if (id.startsWith('robot-') || id.startsWith('amr-')) {
    monitorView.getState().selectRobot(id)

    monitorView.getState().set('robot')

    return
  }

  if (id.startsWith('scanner-')) {
    monitorView.getState().selectScanner(id)

    monitorView.getState().set('scan')

    return
  }

  cameraBus.request({ kind: 'focus', id })
}

/** 장비 상세 탭에서 3D 클릭: 오른쪽 정보를 그 로봇·AMR 계열로 바꾼다. 다른 화면이면 false */
export function pickDetailEquipment(id: string) {
  if (monitorView.getState().view !== 'robot') return false

  if (!id.startsWith('robot-') && !id.startsWith('amr-')) return false

  uiStore.getState().select(id)

  monitorView.getState().selectRobot(id)

  return true
}

/** 선택 + 카메라 비행 (검색 · 알림 · 3D 더블클릭) */
export function flyToEquipment(id: string) {
  uiStore.getState().select(id)

  cameraBus.request({ kind: 'focus', id })
}

/** 선택 + 그 장비를 계속 추적 (팬 · Esc 로 해제) */
export function followEquipment(id: string) {
  uiStore.getState().select(id)

  cameraBus.request({ kind: 'follow', id })
}
