import LoadingScreen from '@/shared/components/LoadingScreen'

import { useSceneWarm } from '../lib/sceneWarm'

/** 셰이더를 프레임으로 나누어 올리는 동안 로딩 화면을 유지한다 */
export default function WarmupScreen() {
  const ready = useSceneWarm()

  if (ready) return null

  return (
    <div className="fixed inset-0 z-[60]">
      <LoadingScreen />
    </div>
  )
}
