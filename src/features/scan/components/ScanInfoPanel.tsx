import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import { DetailTabs, EventList, HeroKpi, RunButtons, type DetailTabId } from '@/features/equipment-detail'
import { usePlaybackPick } from '@/features/playback'
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

  const origins = usePlaybackPick((snap) => snap.origins)

  const origin = origins[origins.length - 1] ?? 0

  if (!detail) return <Panel className="h-full">{null}</Panel>

  const events = tab === 'alarm' ? detail.events.filter((event) => event.tone === 'error' || event.tone === 'warning') : detail.events

  return (
    <Panel className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3.5">
      <div className="flex shrink-0 items-center">
        <h2 className="text-body font-semibold text-text-primary">장비 정보</h2>

        <MoreHorizontal size={18} className="ml-auto text-text-secondary" />
      </div>

      <div className="shrink-0">
        <ScanSelector scannerId={detail.id} status={detail.status} statusLabel={detail.statusLabel} />
      </div>

      <div className="shrink-0">
        <HeroKpi label="오늘 검사" unit="박스" count={detail.scans} target={detail.target} percent={detail.percent} />
      </div>

      <div className="shrink-0">
        <ScanKpiGrid detail={detail} />
      </div>

      <div className="shrink-0">
        <DetailTabs tab={tab} alarmCount={detail.alarms.length} onChange={setTab} logLabel="작동 기록" />
      </div>

      <div className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
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
      </div>

      <div className="shrink-0">
        <RunButtons stopLabel="멈춤" />

        <p className="mt-1.5 text-[10px] text-text-tertiary">* 시연용 버튼 · 실제 장비 제어와 연동되지 않음</p>
      </div>
    </Panel>
  )
}
