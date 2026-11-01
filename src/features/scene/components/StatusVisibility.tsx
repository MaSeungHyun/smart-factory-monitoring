import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

import { useDashboardView } from '@/features/playback'
import { useMonitorView } from '@/shared/hooks/useMonitorView'
import { useUi } from '@/shared/hooks/useUi'
import { statusVisible } from '@/shared/stores/uiStore'

/** 범례 · 상태 칩으로 걸러진 상태의 장비를 3D 에서 숨김 (메인 · 창고 화면만) */
export default function StatusVisibility() {
  const view = useDashboardView()

  const screen = useMonitorView()

  const ui = useUi()

  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const filtering = screen === 'main' || screen === 'warehouse'

    for (const item of view?.equipment ?? []) {
      const object = scene.getObjectByName(item.id)

      if (object) object.visible = !filtering || statusVisible(item.status, ui)
    }
  }, [view, ui, screen, scene])

  return null
}
