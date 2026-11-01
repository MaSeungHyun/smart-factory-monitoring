import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import { dashboardAt, playbackStore } from '@/features/playback'
import type { DashboardView } from '@/features/playback/lib/dashboardView'
import { monitorView, type MonitorView } from '@/shared/stores/useMonitorViewStore'
import { statusVisible, uiStore, type UiState } from '@/shared/stores/useUiStore'

import { equipmentById } from '../lib/boundsRaycast'

interface Seen {
  view: DashboardView | null
  screen: MonitorView
  ui: UiState
}

/** 범례 · 상태 칩으로 걸러진 상태의 장비를 3D 에서 숨김 (메인 · 창고 화면만). 시계에는 구독하지 않는다 */
export default function StatusVisibility() {
  const seen = useRef<Seen | null>(null)

  useFrame(() => {
    const view = dashboardAt(playbackStore.getState())

    const ui = uiStore.getState()

    const screen = monitorView.getState().view

    const prev = seen.current

    if (prev && prev.view === view && prev.ui === ui && prev.screen === screen) return

    seen.current = { view, screen, ui }

    if (!view) return

    const filtering = screen === 'main' || screen === 'warehouse'

    for (const item of view.equipment) {
      const object = equipmentById(item.id)

      if (object) object.visible = !filtering || statusVisible(item.status, ui)
    }
  })

  return null
}
