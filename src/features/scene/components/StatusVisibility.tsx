import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'

import { dashboardAt, playbackStore } from '@/features/playback'
import type { DashboardView } from '@/features/playback/lib/dashboardView'
import { monitorView, type MonitorView } from '@/shared/stores/useMonitorViewStore'
import { uiStore, type UiState } from '@/shared/stores/useUiStore'

import { equipmentById } from '../lib/boundsRaycast'

interface Seen {
  view: DashboardView | null
  screen: MonitorView
  ui: UiState
}

/**
 * 범례(hiddenStatuses)로 끈 상태만 3D 에서 숨김.
 * LIVE 옆 상태 칩 필터는 목록·알람만 걸러 씬 오브젝트는 가리지 않는다.
 */
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

    const filtering = (screen === 'main' || screen === 'warehouse') && ui.hiddenStatuses.size > 0

    for (const item of view.equipment) {
      const object = equipmentById(item.id)

      if (object) object.visible = !filtering || !ui.hiddenStatuses.has(item.status)
    }
  })

  return null
}
