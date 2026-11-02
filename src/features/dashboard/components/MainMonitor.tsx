import { ViewportAlert } from '@/features/alerts'
import { PlaybackControls } from '@/features/playback'
import { SceneControls, SceneLegend, SceneSlot } from '@/features/scene'
import { useUi } from '@/shared/stores/useUiStore'
import { cn } from '@/shared/lib/cn'

import MonitorToolbar from './MonitorToolbar'
import Timeline from './Timeline'

export default function MainMonitor() {
  const { sceneExpanded } = useUi()

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      {!sceneExpanded && <MonitorToolbar />}

      {!sceneExpanded && <Timeline />}

      <div className={cn('relative min-h-0 flex-1 overflow-hidden rounded bg-bg-base', !sceneExpanded && 'mt-2.5')}>
        <SceneSlot />

        <div className="pointer-events-none absolute inset-0 z-30">
          <ViewportAlert />

          <div className="absolute bottom-3.5 left-3.5">
            <SceneLegend />
          </div>

          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2">
            <PlaybackControls />
          </div>

          <div className="absolute right-3.5 bottom-3.5">
            <SceneControls />
          </div>
        </div>
      </div>
    </div>
  )
}
