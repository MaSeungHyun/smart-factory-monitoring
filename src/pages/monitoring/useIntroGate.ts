import { useEffect } from 'react'
import { useStore } from 'zustand'

import { playbackStore } from '@/features/playback'
import { useSceneWarm } from '@/features/scene/lib/sceneWarm'
import { INTRO_START_DELAY_S, INTRO_STABLE_FRAMES } from '@/shared/constants/animation'
import { revealAppWindow, useAppWindowShown } from '@/shared/lib/appWindow'
import { introClock } from '@/shared/stores/introClock'
import { useSceneReady } from '@/shared/stores/sceneReady'

/** 로딩 화면(data-factory-loader)이 DOM 에서 완전히 빠졌는지 */
const loaderGone = () => !document.querySelector('[data-factory-loader]')

/**
 * 인트로 T=0 을 여는 조건: 셰이더 준비(warm) · 씬 첫 렌더(ready) · 재생 데이터 로드 · 로딩 화면 언마운트.
 * 모두 맞으면 안정 프레임 몇 장 + 짧은 틈 뒤에 시작한다. 그 전에는 어두운 막 · 패널 모두 대기
 * 일렉트론은 이 시점에 준비 신호를 보내 숨겨 둔 메인 창을 띄우고, 창이 보인 뒤에 다시 세어 시작한다
 */
export function useIntroGate() {
  const warm = useSceneWarm()

  const ready = useSceneReady()

  const data = useStore(playbackStore, (state) => state.status !== 'loading')

  const shown = useAppWindowShown()

  useEffect(() => {
    if (!warm || !ready || !data || introClock.getState().startedAt !== null) return

    let frames = 0

    let raf = 0

    let timer = 0

    const tick = () => {
      frames = loaderGone() ? frames + 1 : 0

      if (frames < INTRO_STABLE_FRAMES) {
        raf = requestAnimationFrame(tick)

        return
      }

      // 숨은 창에서 인트로가 지나가지 않게, 창을 띄운 뒤 shown 이 바뀌면 다시 센다
      if (!shown) {
        revealAppWindow()

        return
      }

      timer = window.setTimeout(() => introClock.getState().start(), INTRO_START_DELAY_S * 1000)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)

      clearTimeout(timer)
    }
  }, [warm, ready, data, shown])
}