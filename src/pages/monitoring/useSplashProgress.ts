import { useProgress } from '@react-three/drei'
import { useEffect } from 'react'

import { playbackStore } from '@/features/playback'
import { sceneWarm } from '@/features/scene/lib/sceneWarm'
import { isAppWindowShown, reportLoadingProgress } from '@/shared/lib/appWindow'

/** 3D 에셋(GLB · 텍스처, drei 로딩 매니저) 다운로드 비중 (%) */
const SPLASH_WEIGHT_ASSETS = 70

/** 재생 데이터(청크) 로드 비중 (%) */
const SPLASH_WEIGHT_DATA = 10

/** 셰이더 · 텍스처 GPU 업로드(warm) 비중 (%) */
const SPLASH_WEIGHT_WARM = 20

/** 스플래시로 진행률을 보내는 간격 (ms) */
const SPLASH_REPORT_MS = 100

/** 지금 단계까지의 실제 진행률 (0~100) */
function currentProgress() {
  const assets = useProgress.getState().progress / 100

  const data = playbackStore.getState().status !== 'loading' ? 1 : 0

  const warm = sceneWarm.getState().ready ? 1 : 0

  return assets * SPLASH_WEIGHT_ASSETS + data * SPLASH_WEIGHT_DATA + warm * SPLASH_WEIGHT_WARM
}

/** 일렉트론: 숨은 메인 창의 실제 로딩 진행률을 스플래시 창에 계속 알린다. 창이 보이면 멈춘다 */
export function useSplashProgress() {
  useEffect(() => {
    if (!window.electronApp?.progress || isAppWindowShown()) return

    // 항목이 늘어나면 drei 진행률이 잠시 내려간다. 이미 보낸 값보다 작으면 보내지 않는다
    let peak = 0

    const timer = window.setInterval(() => {
      if (isAppWindowShown()) {
        window.clearInterval(timer)

        return
      }

      const value = currentProgress()

      if (value <= peak) return

      peak = value

      reportLoadingProgress(value)
    }, SPLASH_REPORT_MS)

    return () => window.clearInterval(timer)
  }, [])
}