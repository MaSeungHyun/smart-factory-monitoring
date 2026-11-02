import { Box } from 'lucide-react'

import { ViewportAlert } from '@/features/alerts'
import { SceneControls, SceneSlot } from '@/features/scene'
import { usePlaybackPick } from '@/features/playback'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'

import { detailKind } from '../lib/detailKind'
import { robotCalloutRef } from '../lib/robotCalloutRef'
import { useVehicleDetail } from '../hooks/useVehicleDetail'
import CameraInset from './CameraInset'
import RobotCalloutOverlay from './RobotCalloutOverlay'
import ViewAngleButtons from './ViewAngleButtons'

/** 3D 확대 뷰 (상주 Canvas 슬롯) + 오버레이 (칩, 시점 버튼, 카메라 인셋, 하단 컨트롤) */
export default function DetailScene() {
  const { robotId } = useMonitorState()

  const vehicle = useVehicleDetail()

  const robotVision = detailKind(robotId) === 'robot'

  const robotName = usePlaybackPick((state) => state.run?.equipment.find((entry) => entry.id === robotId)?.name ?? '로봇')

  const chip = robotVision || !vehicle ? '3D 확대 뷰 · 로봇 별로 카메라 이동' : `3D 확대 뷰 · ${vehicle.code}로 카메라 이동`

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-primary-on-dark/40 bg-bg-base">
      <SceneSlot />

      <div className="pointer-events-none absolute inset-0 z-10">
        <RobotCalloutOverlay ref={robotCalloutRef} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
          <span className="flex h-9 items-center gap-1.5 rounded border border-border-default bg-bg-surface/90 px-3 text-caption text-text-primary">
            <Box size={14} />
            {chip}
          </span>

          <ViewAngleButtons />
        </div>

        <ViewportAlert />

        {robotVision && (
          <div className="absolute bottom-4 left-4">
            <CameraInset meta={robotName} kind="robot" id={robotId} />
          </div>
        )}

        <div className="absolute right-4 bottom-4">
          <SceneControls />
        </div>
      </div>
    </div>
  )
}
