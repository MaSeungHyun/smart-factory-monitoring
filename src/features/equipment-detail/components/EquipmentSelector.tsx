import Select from '@/shared/components/Select'
import StatusBadge from '@/shared/components/StatusBadge'
import { monitorView } from '@/shared/stores/useMonitorViewStore'
import type { EquipmentStatus } from '@/shared/types'

import { useDetailOptions } from '../hooks/useVehicleDetail'

interface EquipmentSelectorProps {
  robotId: string
  status: EquipmentStatus
  statusLabel: string
}

/** 장비 선택: 바꾸면 카메라가 그 장비로 이동 */
export default function EquipmentSelector({ robotId, status, statusLabel }: EquipmentSelectorProps) {
  const options = useDetailOptions()

  const current = options.find((option) => option.id === robotId)

  return (
    <Select
      ariaLabel="장비 선택"
      value={robotId}
      onValueChange={(id) => monitorView.getState().selectRobot(id)}
      leading={
        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border border-primary-on-dark px-1 text-caption text-primary-on-dark">
          {current?.badge ?? robotId.replace(/\D/g, '').slice(-1)}
        </span>
      }
      trailing={<StatusBadge tone={status} label={statusLabel} />}
      options={options.map((option) => ({ value: option.id, label: option.label }))}
    />
  )
}
