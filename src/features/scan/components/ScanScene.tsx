import { ScanLine } from 'lucide-react'

import { ViewportAlert } from '@/features/alerts'
import { ViewAngleButtons } from '@/features/equipment-detail'
import { SceneControls, SceneSlot } from '@/features/scene'

import { scanCalloutRef } from '../lib/scanCalloutRef'
import ScanCalloutOverlay from './ScanCalloutOverlay'
import ScanCameraInset from './ScanCameraInset'

/** 스캔 검사 3D 확대 뷰 + 오버레이 */
export default function ScanScene() {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-primary-on-dark/40 bg-bg-base">
      <SceneSlot />

      <div className="pointer-events-none absolute inset-0 z-10">
        <ScanCalloutOverlay ref={scanCalloutRef} />
      </div>

      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="absolute top-4 left-4 flex flex-col items-start gap-2">
          <span className="flex h-9 items-center gap-1.5 rounded border border-border-default bg-bg-surface/90 px-3 text-caption text-text-primary">
            <ScanLine size={14} />
            3D 확대 뷰 · 스캐너로 카메라 이동
          </span>

          <ViewAngleButtons />
        </div>

        <ViewportAlert />

        <div className="absolute bottom-4 left-4">
          <ScanCameraInset />
        </div>

        <div className="absolute right-4 bottom-4">
          <SceneControls />
        </div>
      </div>
    </div>
  )
}
