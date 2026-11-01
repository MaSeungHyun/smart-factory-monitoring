import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import { DetailTabs, EventList, HeroKpi, RunButtons, type DetailTabId } from '@/features/equipment-detail'
import { usePlayback } from '@/features/playback'
import Panel from '@/shared/components/Panel'
import { formatClock } from '@/shared/hooks/useTimelineRange'

import { useScanDetail } from '../hooks/useScanDetail'
import DefectRateChart from './DefectRateChart'
import ScanKpiGrid from './ScanKpiGrid'
import ScanSelector from './ScanSelector'

/** 스캔 검사 장비 정보 패널 */
export default function ScanInfoPanel() {
  const [tab, setTab] = useState<DetailTabId>('trend')

  const detail = useScanDetail()

  const { origins } = usePlayback()

  const origin = origins[origins.length - 1] ?? 0

  if (!detail) return <Panel className="h-full">{null}</Panel>

  const events = tab === 'alarm' ? detail.events.filter((event) => event.tone === 'error' || event.tone === 'warning') : detail.events

  return (
    <Panel className="flex h-full flex-col gap-3 overflow-y-auto p-3.5">
      <div className="flex items-center">
        <h2 className="text-body font-semibold text-text-primary">장비 정보</h2>

        <MoreHorizontal size={18} className="ml-auto text-text-secondary" />
      </div>

      <ScanSelector scannerId={detail.id} status={detail.status} statusLabel={detail.statusLabel} />

      <HeroKpi label="오늘 검사" unit="박스" count={detail.scans} target={detail.target} percent={detail.percent} />

      <ScanKpiGrid detail={detail} />

      <DetailTabs tab={tab} alarmCount={detail.alarms.length} onChange={setTab} logLabel="작동 기록" />

      {tab === 'trend' && (
        <DefectRateChart
          buckets={detail.buckets}
          average={detail.defectRate}
          bucketSeconds={detail.bucketSeconds}
          lastDefect={detail.lastDefect}
          label={(t) => formatClock(origin + t * 1000)}
        />
      )}

      <EventList events={events} />

      <div className="mt-auto">
        <RunButtons stopLabel="멈춤" />

        <p className="mt-1.5 text-[10px] text-text-tertiary">* 시연용 버튼 · 실제 장비 제어와 연동되지 않음</p>
      </div>
    </Panel>
  )
}
