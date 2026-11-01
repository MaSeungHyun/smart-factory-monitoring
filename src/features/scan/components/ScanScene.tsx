import { ScanLine } from 'lucide-react'
import { useRef } from 'react'

import { ViewAngleButtons, type CalloutLayout } from '@/features/equipment-detail'
import { FactoryScene, SceneControls } from '@/features/scene'

import ScanCalloutOverlay from './ScanCalloutOverlay'
import ScanCameraInset from './ScanCameraInset'
import ScanMarker3D from './ScanMarker3D'

/** 스캔 검사 3D 확대 뷰 + 오버레이 */
export default function ScanScene() {
  const layout = useRef<CalloutLayout | null>(null)

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded border border-primary-on-dark/40 bg-bg-base">
      <FactoryScene>
        <ScanMarker3D layout={layout} />
      </FactoryScene>

      <div className="pointer-events-none absolute inset-0">
        <ScanCalloutOverlay ref={layout} />

        <span className="absolute top-4 left-4 flex h-9 items-center gap-1.5 rounded border border-border-default bg-bg-surface/90 px-3 text-caption text-text-primary">
          <ScanLine size={14} />
          3D 확대 뷰 · 스캐너로 카메라 이동
        </span>

        <div className="absolute top-4 right-4">
          <ViewAngleButtons />
        </div>

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
