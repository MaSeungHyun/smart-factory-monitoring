import Select from '@/shared/components/Select'
import StatusBadge from '@/shared/components/StatusBadge'
import { monitorView } from '@/shared/stores/monitorView'
import type { EquipmentStatus } from '@/shared/types'

import { useRobotOptions } from '../hooks/useRobotDetail'

interface EquipmentSelectorProps {
  robotId: string
  status: EquipmentStatus
  statusLabel: string
}

/** 장비 선택: 바꾸면 카메라가 그 로봇으로 이동 */
export default function EquipmentSelector({ robotId, status, statusLabel }: EquipmentSelectorProps) {
  const options = useRobotOptions()

  return (
    <Select
      ariaLabel="장비 선택"
      value={robotId}
      onValueChange={(id) => monitorView.selectRobot(id)}
      leading={
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full border border-primary-on-dark text-caption text-primary-on-dark">
          {robotId.replace(/\D/g, '').slice(-1)}
        </span>
      }
      trailing={<StatusBadge tone={status} label={statusLabel} />}
      options={options.map((option) => ({ value: option.id, label: `팔레트 적재 로봇 · ${option.name}` }))}
    />
  )
}
