import { ChevronDown } from 'lucide-react'

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
    <label className="relative flex h-11 cursor-pointer items-center gap-2 rounded border border-border-default bg-bg-surface-2 px-3 transition-colors duration-150 focus-within:border-primary-on-dark hover:border-text-tertiary">
      <span className="flex size-5 items-center justify-center rounded-full border border-primary-on-dark text-caption text-primary-on-dark">
        {robotId.replace(/\D/g, '').slice(-1)}
      </span>

      <select
        value={robotId}
        onChange={(event) => monitorView.selectRobot(event.target.value)}
        className="min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-label font-semibold text-text-primary outline-none"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id} className="bg-bg-surface">
            팔레트 적재 로봇 · {option.name}
          </option>
        ))}
      </select>

      <StatusBadge tone={status} label={statusLabel} />

      <ChevronDown size={16} className="text-text-secondary" />
    </label>
  )
}
