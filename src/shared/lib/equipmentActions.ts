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

/** 스캔 검사 탭에서 3D 클릭: 오른쪽 정보를 그 스캐너로 바꾼다. 같은 스캐너를 다시 누르면 선택만 해제 (패널은 마지막 스캐너 유지) */
function pickScanner(id: string) {
  if (!id.startsWith('scanner-')) return false

  if (uiStore.getState().selectedId === id) {
    uiStore.getState().select(null)

    return true
  }

  uiStore.getState().select(id)

  monitorView.getState().selectScanner(id)

  return true
}

/** 패널 목록에서 스캐너를 고름: 3D 선택 · 외곽선도 같이 맞춘다 */
export function chooseScanner(id: string) {
  uiStore.getState().select(id)

  monitorView.getState().selectScanner(id)
}

/** 장비 상세 / 스캔 검사 탭에서 3D 클릭: 오른쪽 정보를 그 로봇·AMR 계열 / 스캐너로 바꾼다. 다른 화면 · 장비면 false */
export function pickDetailEquipment(id: string) {
  if (monitorView.getState().view === 'scan') return pickScanner(id)

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
