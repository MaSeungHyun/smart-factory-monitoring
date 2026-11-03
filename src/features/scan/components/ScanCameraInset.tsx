import { CameraInset } from '@/features/equipment-detail'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'

import { useScanDetail } from '../hooks/useScanDetail'

/** 스캐너 비전: 터널을 보는 고정 카메라 + 판정 박스 */
export default function ScanCameraInset() {
  const detail = useScanDetail()

  const { scannerId } = useMonitorState()

  return <CameraInset title="스캔 카메라 · 판독 결과" meta={detail?.name ?? '스캐너'} kind="scan" id={scannerId} />
}
