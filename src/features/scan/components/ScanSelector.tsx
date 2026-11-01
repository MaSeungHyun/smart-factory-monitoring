import Select from '@/shared/components/Select'
import StatusBadge from '@/shared/components/StatusBadge'
import { monitorView } from '@/shared/stores/monitorView'
import type { EquipmentStatus } from '@/shared/types'

import { useScannerOptions } from '../hooks/useScanDetail'

interface Props {
  scannerId: string
  status: EquipmentStatus
  statusLabel: string
}

/** 스캐너 선택: 바꾸면 카메라가 그 스캐너로 이동 */
export default function ScanSelector({ scannerId, status, statusLabel }: Props) {
  const options = useScannerOptions()

  return (
    <Select
      ariaLabel="스캐너 선택"
      value={scannerId}
      onValueChange={(id) => monitorView.selectScanner(id)}
      leading={
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary-on-dark text-caption text-primary-on-dark">
          3
        </span>
      }
      trailing={<StatusBadge tone={status} label={statusLabel} />}
      options={options.map((option) => ({ value: option.id, label: `스캔 검사 · 불량 선별 · ${option.name}` }))}
    />
  )
}
