import { cameraBus } from '@/shared/stores/cameraBus'
import { monitorView } from '@/shared/stores/monitorView'
import { uiStore } from '@/shared/stores/uiStore'

/** 목록 더블클릭: 로봇 · 스캐너는 상세 탭으로, 나머지는 카메라를 그 장비로 */
export function openEquipment(id: string) {
  uiStore.select(id)

  if (id.startsWith('robot-')) {
    monitorView.selectRobot(id)

    monitorView.set('robot')

    return
  }

  if (id.startsWith('scanner-')) {
    monitorView.selectScanner(id)

    monitorView.set('scan')

    return
  }

  cameraBus.request({ kind: 'focus', id })
}

/** 선택 + 카메라 비행 (검색 · 알림 · 3D 더블클릭) */
export function flyToEquipment(id: string) {
  uiStore.select(id)

  cameraBus.request({ kind: 'focus', id })
}
