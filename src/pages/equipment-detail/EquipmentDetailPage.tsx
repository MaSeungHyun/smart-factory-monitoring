import DetailLayout from '@/app/layouts/DetailLayout'
import { Header, IconRail } from '@/features/dashboard'
import { DetailHeader, DetailScene, RightInfoPanel, useRobotDetail } from '@/features/equipment-detail'

/** 02_장비상세: 레일 2번째 탭 */
export default function EquipmentDetailPage() {
  const detail = useRobotDetail()

  return (
    <DetailLayout
      rail={<IconRail />}
      header={<Header />}
      main={
        <>
          <DetailHeader name={detail?.name ?? '로봇'} />

          <DetailScene />
        </>
      }
      aside={<RightInfoPanel />}
    />
  )
}
