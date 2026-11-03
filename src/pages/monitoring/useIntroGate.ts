import { useEffect } from 'react'
import { useStore } from 'zustand'

import { playbackStore } from '@/features/playback'
import { useSceneWarm } from '@/features/scene/lib/sceneWarm'
import { INTRO_START_DELAY_S, INTRO_STABLE_FRAMES } from '@/shared/constants/animation'
import { introClock } from '@/shared/stores/introClock'
import { useSceneReady } from '@/shared/stores/sceneReady'

/** 로딩 화면(data-factory-loader)이 DOM 에서 완전히 빠졌는지 */
const loaderGone = () => !document.querySelector('[data-factory-loader]')

/**
 * 인트로 T=0 을 여는 조건: 셰이더 준비(warm) · 씬 첫 렌더(ready) · 재생 데이터 로드 · 로딩 화면 언마운트.
 * 모두 맞으면 안정 프레임 몇 장 + 짧은 틈 뒤에 시작한다. 그 전에는 어두운 막 · 패널 모두 대기
 */
export function useIntroGate() {
  const warm = useSceneWarm()

  const ready = useSceneReady()

  const data = useStore(playbackStore, (state) => state.status !== 'loading')

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

      timer = window.setTimeout(() => introClock.getState().start(), INTRO_START_DELAY_S * 1000)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)

      clearTimeout(timer)
    }
  }, [warm, ready, data])
}