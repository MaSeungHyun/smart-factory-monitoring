import DashboardLayout from '@/app/layouts/DashboardLayout'
import { Header, IconRail, MainMonitor, TodayPanel } from '@/features/dashboard'
import { usePlaybackLoader } from '@/features/playback'
import { ProcessFlow } from '@/features/process-flow'
import { useMonitorView } from '@/shared/hooks/useMonitorView'
import LoadingScreen from '@/shared/components/LoadingScreen'
import EquipmentDetailPage from '@/pages/equipment-detail/EquipmentDetailPage'

/** 레일 탭 상태로 메인 관제 / 장비 상세 전환 (재생 데이터는 여기서 한 번 로드) */
export default function MonitoringPage() {
  usePlaybackLoader()

  const view = useMonitorView()

  if (view === 'robot') return <EquipmentDetailPage />

  return (
    <DashboardLayout
      rail={<IconRail />}
      header={<Header />}
      sidebar={<TodayPanel />}
      main={<MainMonitor />}
      bottom={<ProcessFlow />}
      overlay={<LoadingScreen />}
    />
  )
}
