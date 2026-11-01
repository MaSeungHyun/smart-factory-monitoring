import { Check, Gauge, Thermometer, Zap } from 'lucide-react'

import { MOTOR_CURRENT, MOTOR_TEMP, SUCCESS_TARGET } from '../data/robotDetail.mock'
import type { RobotDetail } from '../lib/robotDetail'
import DetailKpiCard from './DetailKpiCard'

export default function DetailKpiGrid({ detail }: { detail: RobotDetail }) {
  const faster = detail.cycleDelta <= 0

  return (
    <div className="grid grid-cols-2 gap-2">
      <DetailKpiCard
        icon={<Gauge size={14} />}
        label="작업 속도"
        value={detail.cycle === null ? '—' : detail.cycle.toFixed(1)}
        unit="초/개"
        note={`${faster ? '▼' : '▲'} ${Math.abs(detail.cycleDelta).toFixed(1)}`}
        noteClassName={faster ? 'text-status-success' : 'text-status-error'}
      />

      <DetailKpiCard
        icon={<Check size={14} />}
        label="성공률"
        value={detail.success === null ? '—' : detail.success.toFixed(1)}
        unit="%"
        note={`목표 ${SUCCESS_TARGET}%`}
      />

      <DetailKpiCard
        icon={<Thermometer size={14} />}
        label="모터 온도"
        value={String(MOTOR_TEMP.value)}
        unit="°C"
        note={`한계 ${MOTOR_TEMP.limit}°C`}
        mock
      />

      <DetailKpiCard
        icon={<Zap size={14} />}
        label="전류"
        value={MOTOR_CURRENT.value.toFixed(1)}
        unit="A"
        note={MOTOR_CURRENT.label}
        noteClassName="text-status-success"
        mock
      />
    </div>
  )
}
