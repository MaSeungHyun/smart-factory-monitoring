import { AlertPanel } from '@/features/alerts'
import { PlaybackControls } from '@/features/playback'
import { FactoryScene, SceneControls, SceneLegend } from '@/features/scene'

import MonitorToolbar from './MonitorToolbar'
import Timeline from './Timeline'

export default function MainMonitor() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col">
      <MonitorToolbar />

      <Timeline />

      <div className="relative mt-2.5 min-h-0 flex-1 overflow-hidden rounded bg-bg-base">
        <FactoryScene />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-[18px] right-3.5">
            <AlertPanel />
          </div>

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
