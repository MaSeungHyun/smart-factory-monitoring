import { ViewportAlert } from '@/features/alerts'
import { SceneControls, SceneLegend, SceneSlot } from '@/features/scene'
import { AnimatedPanel } from '@/shared/components/motion/AnimatedPanel'
import { INTRO_FADE_DURATION_S } from '@/shared/constants/animation'
import { useIntroStarted } from '@/shared/stores/introClock'
import { useUi } from '@/shared/stores/useUiStore'
import { cn } from '@/shared/lib/cn'

import MonitorToolbar from './MonitorToolbar'
import Timeline from './Timeline'

export default function MainMonitor() {
  const { sceneExpanded } = useUi()

  const started = useIntroStarted()

  return (
    // 인트로: 메인 관제 묶음(툴바 · 타임라인 · 씬 · 떠 있는 컨트롤) 전체를 T=0 부터 투명 → 불투명.
    // opacity 만 쓰므로 Canvas 는 페이드 중에도 계속 그린다 (visibility · display 는 건드리지 않음)
    <div
      className="flex h-full min-h-0 min-w-0 flex-col"
      style={{ opacity: started ? 1 : 0, transition: `opacity ${INTRO_FADE_DURATION_S}s ease-out` }}
    >
      {!sceneExpanded && <MonitorToolbar />}

      {!sceneExpanded && <Timeline />}

      <div className={cn('relative min-h-0 flex-1 overflow-hidden rounded bg-bg-base', !sceneExpanded && 'mt-2.5')}>
        <SceneSlot />

        <AnimatedPanel from="right" className="pointer-events-none absolute inset-0 z-40">
          <ViewportAlert />
        </AnimatedPanel>

        <AnimatedPanel from="float" className="pointer-events-none absolute inset-0 z-30">
          <div className="absolute bottom-3.5 left-3.5">
            <SceneLegend />
          </div>

          <div className="absolute right-3.5 bottom-3.5">
            <SceneControls />
          </div>
        </AnimatedPanel>
      </div>
    </div>
  )
}
