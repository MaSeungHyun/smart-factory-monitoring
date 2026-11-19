import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Matrix4 } from 'three'

import { playbackStore } from '@/features/playback'
import { renderActivity } from '@/shared/lib/three/renderActivity'
import { cameraBus } from '@/shared/stores/cameraBus'
import { dashboardDialogStore } from '@/shared/stores/useDashboardDialogStore'
import { graphicsStore } from '@/shared/stores/useGraphicsStore'
import { monitorView } from '@/shared/stores/useMonitorViewStore'
import { uiStore } from '@/shared/stores/useUiStore'

/** 마지막 활동 뒤 이만큼 아무것도 안 바뀌면 그리기를 멈춘다 (ms) */
const IDLE_MS = 1500

const WAKE_EVENTS = ['pointerdown', 'pointermove', 'wheel', 'keydown', 'resize'] as const

type Loop = 'always' | 'demand'

/**
 * 렌더 온디맨드 게이트. 기본은 지금처럼 매 프레임(frameloop always) 그린다.
 * 아래일 때만 frameloop 을 demand 로 바꿔 GPU 를 쉬게 한다:
 *  - 재생이 시작된 뒤 일시정지 상태이고, 카메라 · 입력 · 스토어 · 연출(맥동 등)이 IDLE_MS 동안 그대로일 때
 *  - 대시보드 다이얼로그가 씬을 덮고 있을 때 (재생 중이어도. 재생 시계는 씬과 별개라 닫으면 현재 시각으로 이어진다)
 * 입력 · 스토어 변경 · 카메라 명령이 오면 바로 always 로 돌아간다. 재생 중에는 절대 멈추지 않는다.
 */
export default function FrameLoopGate() {
  const setFrameloop = useThree((state) => state.setFrameloop)

  const gate = useRef({ loop: 'always' as Loop, started: false, view: new Matrix4(), projection: new Matrix4() })

  useEffect(() => {
    const switchTo = (loop: Loop) => {
      if (gate.current.loop === loop) return

      gate.current.loop = loop

      setFrameloop(loop)
    }

    const wake = () => {
      renderActivity.keepAlive()

      switchTo('always')
    }

    // 다이얼로그가 덮고 있으면 마우스 · 재생 시계 틱으로는 깨우지 않는다
    const wakeUnlessCovered = () => {
      if (!dashboardDialogStore.getState().open) wake()
    }

    const offs = [
      renderActivity.on(wake),
      dashboardDialogStore.subscribe(wake),
      uiStore.subscribe(wakeUnlessCovered),
      monitorView.subscribe(wakeUnlessCovered),
      graphicsStore.subscribe(wakeUnlessCovered),
      playbackStore.subscribe(wakeUnlessCovered),
      cameraBus.on(wakeUnlessCovered),
    ]

    for (const type of WAKE_EVENTS) window.addEventListener(type, wakeUnlessCovered, { passive: true })

    return () => {
      offs.forEach((off) => off())

      for (const type of WAKE_EVENTS) window.removeEventListener(type, wakeUnlessCovered)

      switchTo('always')
    }
  }, [setFrameloop])

  useFrame(({ camera }) => {
    const current = gate.current

    const { playing } = playbackStore.getState()

    const covered = dashboardDialogStore.getState().open

    if (playing) current.started = true

    // 비행 · 따라가기 · 오프닝 등 카메라가 움직인 프레임은 활동으로 본다
    if (!camera.matrixWorld.equals(current.view) || !camera.projectionMatrix.equals(current.projection)) {
      current.view.copy(camera.matrixWorld)

      current.projection.copy(camera.projectionMatrix)

      if (!covered) renderActivity.keepAlive()
    }

    const busy = !covered && (!current.started || playing)

    const idle = !busy && performance.now() - renderActivity.lastActive() >= IDLE_MS

    const next: Loop = idle ? 'demand' : 'always'

    if (current.loop !== next) {
      current.loop = next

      setFrameloop(next)
    }
  })

  return null
}
