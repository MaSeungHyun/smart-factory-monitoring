import DetailLayout from '@/app/layouts/DetailLayout'
import { DetailHeader } from '@/features/equipment-detail'
import { Header, IconRail } from '@/features/dashboard'
import { ScanInfoPanel, ScanScene, useScanDetail } from '@/features/scan'
import { useUi } from '@/shared/stores/useUiStore'

/** 03_스캔 검사: 레일 Scan 탭 */
export default function ScanPage() {
  const detail = useScanDetail()

  const { sceneExpanded } = useUi()

  return (
    <DetailLayout
      rail={<IconRail />}
      header={<Header />}
      main={
        <>
          {!sceneExpanded && (
            <DetailHeader title="스캔 검사" trail="메인 관제 / 스캔 검사 · 분류" name={detail?.name ?? '스캐너'} />
          )}

          <ScanScene />
        </>
      }
      aside={<ScanInfoPanel />}
    />
  )
}
