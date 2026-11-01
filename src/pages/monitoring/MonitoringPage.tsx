import DashboardLayout from '@/app/layouts/DashboardLayout'
import { Header, IconRail, MainMonitor, TodayPanel } from '@/features/dashboard'
import { usePlaybackLoader } from '@/features/playback'
import { ProcessFlow } from '@/features/process-flow'
import { SceneHost } from '@/features/scene'
import LoadingScreen from '@/shared/components/LoadingScreen'
import { useMonitorView } from '@/shared/hooks/useMonitorView'
import EquipmentDetailPage from '@/pages/equipment-detail/EquipmentDetailPage'
import ScanPage from '@/pages/scan/ScanPage'
import WarehousePage from '@/pages/warehouse/WarehousePage'

import ViewOverlays3D from './ViewOverlays3D'

function ViewPage() {
  const view = useMonitorView()

  if (view === 'robot') return <EquipmentDetailPage />

  if (view === 'scan') return <ScanPage />

  if (view === 'warehouse') return <WarehousePage />

  return (
    <DashboardLayout
      rail={<IconRail />}
      header={<Header />}
      sidebar={<TodayPanel />}
      main={<MainMonitor />}
      bottom={<ProcessFlow />}
    />
  )
}

/**
 * 레일 탭 상태로 메인 관제 / 장비 상세 / 스캔 검사 전환 (재생 데이터는 여기서 한 번 로드).
 * 3D Canvas 는 SceneHost 로 한 번만 마운트, 화면은 SceneSlot 자리만 제공.
 */
export default function MonitoringPage() {
  usePlaybackLoader()

  return (
    <>
      <SceneHost>
        <ViewOverlays3D />
      </SceneHost>

      <ViewPage />

      <LoadingScreen />
    </>
  )
}
