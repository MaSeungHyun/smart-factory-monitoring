import { Battery, Box, Gauge, Package, Thermometer, Zap } from 'lucide-react'

import { LOW_BATTERY } from '@/features/warehouse/config/warehouse.config'

import type { VehicleDetail } from '../lib/vehicleDetail'
import DetailKpiCard from './DetailKpiCard'

function speedNote(delta: number) {
  const sign = delta > 0 ? '▲' : '▼'

  return `${sign} ${Math.abs(delta).toFixed(1)}`
}

/** 종류별 4칸. AGV 는 주행 속도 · 모터 부하 · 온도 · 전류 */
export default function VehicleKpiGrid({ detail }: { detail: VehicleDetail }) {
  const speed = (
    <DetailKpiCard
      icon={<Gauge size={14} />}
      label="주행 속도"
      value={detail.speed.toFixed(1)}
      unit="m/s"
      note={speedNote(detail.speedDelta)}
    />
  )

  if (detail.kind === 'agv') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {speed}

        <DetailKpiCard
          icon={<Gauge size={14} />}
          label="모터 부하"
          value={String(detail.load)}
          unit="%"
          note="한도 100%"
          noteClassName={detail.overloaded ? 'text-status-error' : undefined}
          valueClassName={detail.overloaded ? 'text-status-error' : undefined}
          mock
        />

        <DetailKpiCard
          icon={<Thermometer size={14} />}
          label="모터 온도"
          value={String(detail.temp)}
          unit="°C"
          note={`/ ${detail.tempLimit}°C`}
          noteClassName={detail.temp > detail.tempLimit ? 'text-status-error' : undefined}
          valueClassName={detail.temp > detail.tempLimit ? 'text-status-error' : undefined}
          mock
        />

        <DetailKpiCard
          icon={<Zap size={14} />}
          label="전류"
          value={detail.current.toFixed(1)}
          unit="A"
          note={detail.currentLabel}
          noteClassName={detail.overloaded ? 'text-status-error' : 'text-status-success'}
          valueClassName={detail.overloaded ? 'text-status-error' : undefined}
          mock
        />
      </div>
    )
  }

  const battery = (
    <DetailKpiCard
      icon={<Battery size={14} />}
      label="배터리"
      value={String(detail.battery)}
      unit="%"
      note={detail.battery < LOW_BATTERY ? '부족' : '정상'}
      noteClassName={detail.battery < LOW_BATTERY ? 'text-status-error' : 'text-status-success'}
    />
  )

  if (detail.kind === 'forklift') {
    return (
      <div className="grid grid-cols-2 gap-2">
        {speed}

        {battery}

        <DetailKpiCard icon={<Package size={14} />} label="오늘 작업" value={String(detail.count)} unit="회" note={detail.task} />

        <DetailKpiCard icon={<Box size={14} />} label="적재" value={detail.task === '적재' ? '있음' : '없음'} unit="" note="현재" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {speed}

      {battery}

      <DetailKpiCard icon={<Package size={14} />} label="운반" value={String(detail.count)} unit="회" note="오늘" />

      <DetailKpiCard
        icon={<Thermometer size={14} />}
        label="모터 온도"
        value={String(detail.temp)}
        unit="°C"
        note={`/ ${detail.tempLimit}°C`}
        mock
      />
    </div>
  )
}
