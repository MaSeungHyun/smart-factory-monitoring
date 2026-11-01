import { RobotMarker3D, robotCalloutRef } from '@/features/equipment-detail'
import { ScanMarker3D, scanCalloutRef } from '@/features/scan'
import { VehicleTags3D } from '@/features/warehouse'
import { useMonitorView } from '@/shared/hooks/useMonitorView'

/** 화면별 3D 오버레이 (상주 Canvas 안, 화면이 바뀌면 이것만 교체) */
export default function ViewOverlays3D() {
  const view = useMonitorView()

  if (view === 'robot') return <RobotMarker3D layout={robotCalloutRef} />

  if (view === 'scan') return <ScanMarker3D layout={scanCalloutRef} />

  if (view === 'warehouse') return <VehicleTags3D />

  return null
}
