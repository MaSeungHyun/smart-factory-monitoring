import DetailLayout from '@/app/layouts/DetailLayout'
import { Header, IconRail } from '@/features/dashboard'
import { DetailHeader, DetailScene, RightInfoPanel, useRobotDetail } from '@/features/equipment-detail'
import { detailKind } from '@/features/equipment-detail/lib/detailKind'
import { useVehicleDetail } from '@/features/equipment-detail/hooks/useVehicleDetail'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'
import { useUi } from '@/shared/stores/useUiStore'

/** 02_장비상세: 레일 2번째 탭 */
export default function EquipmentDetailPage() {
  const detail = useRobotDetail()

  const vehicle = useVehicleDetail()

  const { robotId } = useMonitorState()

  const { sceneExpanded } = useUi()

  const kind = detailKind(robotId)

  const name = kind === 'robot' ? (detail?.name ?? '로봇') : (vehicle?.code ?? '장비')

  const trail = kind === 'robot' || !vehicle ? undefined : `메인 관제 / ${vehicle.title}`

  return (
    <DetailLayout
      rail={<IconRail />}
      header={<Header />}
      main={
        <>
          {!sceneExpanded && <DetailHeader name={name} trail={trail} />}

          <DetailScene />
        </>
      }
      aside={<RightInfoPanel />}
    />
  )
}
