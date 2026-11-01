import { Box } from 'lucide-react'
import { useRef } from 'react'

import { FactoryScene, SceneControls } from '@/features/scene'

import CameraInset from './CameraInset'
import RobotCalloutOverlay, { type CalloutLayout } from './RobotCalloutOverlay'
import RobotMarker3D from './RobotMarker3D'
import ViewAngleButtons from './ViewAngleButtons'

/** 3D 확대 뷰 + 오버레이 (칩, 시점 버튼, 카메라 인셋, 하단 컨트롤) */
export default function DetailScene() {
  const layout = useRef<CalloutLayout | null>(null)

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-primary-on-dark/40 bg-bg-base">
      <FactoryScene>
        <RobotMarker3D layout={layout} />
      </FactoryScene>

      <div className="pointer-events-none absolute inset-0">
        <RobotCalloutOverlay ref={layout} />

        <span className="absolute top-4 left-4 flex h-9 items-center gap-1.5 rounded border border-border-default bg-bg-surface/90 px-3 text-caption text-text-primary">
          <Box size={14} />
          3D 확대 뷰 · 로봇 별로 카메라 이동
        </span>

        <div className="absolute top-4 right-4">
          <ViewAngleButtons />
        </div>

        <div className="absolute bottom-4 left-4">
          <CameraInset />
        </div>

        <div className="absolute right-4 bottom-4">
          <SceneControls />
        </div>
      </div>
    </div>
  )
}
