import { CircleAlert, Gauge, ScanLine, Thermometer } from 'lucide-react'

import { DetailKpiCard } from '@/features/equipment-detail'

import { SCANNER_TEMP } from '../config/scan.config'
import type { ScanDetail } from '../lib/scanDetail'

export default function ScanKpiGrid({ detail }: { detail: ScanDetail }) {
  const delta = detail.speedDelta

  const faster = (delta ?? 0) <= 0

  const passOk = detail.passRate === null || detail.passRate >= detail.passTarget

  return (
    <div className="grid grid-cols-2 gap-2">
      <DetailKpiCard
        icon={<Gauge size={14} />}
        label="처리 속도"
        value={detail.speed === null ? '—' : detail.speed.toFixed(1)}
        unit="초/박스"
        note={delta === null ? '—' : `${faster ? '▼' : '▲'} ${Math.abs(delta).toFixed(1)}`}
        noteClassName={delta === null ? undefined : faster ? 'text-status-success' : 'text-status-error'}
      />

      <DetailKpiCard
        icon={<ScanLine size={14} />}
        label="정상 판독률"
        value={detail.passRate === null ? '—' : detail.passRate.toFixed(1)}
        unit="%"
        note={`목표 ${detail.passTarget}%`}
        noteClassName={passOk ? undefined : 'text-status-error'}
      />

      <DetailKpiCard
        icon={<Thermometer size={14} />}
        label="스캐너 온도"
        value={String(SCANNER_TEMP.value)}
        unit="°C"
        note={`목업 · 한계 ${SCANNER_TEMP.limit}°C`}
        mock
      />

      <DetailKpiCard
        icon={<CircleAlert size={14} />}
        label="불량"
        value={String(detail.defects)}
        unit="건"
        note={`불량률 ${detail.defectRate.toFixed(1)}%`}
        noteClassName={detail.defects ? 'text-status-error' : undefined}
      />
    </div>
  )
}
