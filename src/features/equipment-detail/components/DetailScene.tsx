import { Box } from 'lucide-react'
import { SceneControls, SceneSlot } from '@/features/scene'

import CameraInset from './CameraInset'
import { robotCalloutRef } from '../lib/robotCalloutRef'
import RobotCalloutOverlay from './RobotCalloutOverlay'
import ViewAngleButtons from './ViewAngleButtons'

/** 3D 확대 뷰 (상주 Canvas 슬롯) + 오버레이 (칩, 시점 버튼, 카메라 인셋, 하단 컨트롤) */
export default function DetailScene() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-primary-on-dark/40 bg-bg-base">
      <SceneSlot />

      <div className="pointer-events-none absolute inset-0">
        <RobotCalloutOverlay ref={robotCalloutRef} />

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
