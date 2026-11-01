import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import { usePlayback } from '@/features/playback'
import Panel from '@/shared/components/Panel'
import { formatClock } from '@/shared/hooks/useTimelineRange'

import { useRobotDetail } from '../hooks/useRobotDetail'
import CycleBarChart from './CycleBarChart'
import DetailKpiGrid from './DetailKpiGrid'
import DetailTabs, { type DetailTabId } from './DetailTabs'
import EquipmentSelector from './EquipmentSelector'
import EventList from './EventList'
import HeroKpi from './HeroKpi'
import RunButtons from './RunButtons'

/** 장비 정보 패널 (오른쪽 412px) */
export default function RightInfoPanel() {
  const [tab, setTab] = useState<DetailTabId>('trend')

  const detail = useRobotDetail()

  const { origins } = usePlayback()

  const origin = origins[origins.length - 1] ?? 0

  if (!detail) return <Panel className="h-full">{null}</Panel>

  const events =
    tab === 'alarm'
      ? detail.events.filter((event) => event.tone === 'error' || event.tone === 'warning')
      : detail.events

  return (
    <Panel className="flex h-full flex-col gap-3 overflow-y-auto p-3.5">
      <div className="flex items-center">
        <h2 className="text-body font-semibold text-text-primary">장비 정보</h2>

        <MoreHorizontal size={18} className="ml-auto text-text-secondary" />
      </div>

      <EquipmentSelector robotId={detail.id} status={detail.status} statusLabel={detail.statusLabel} />

      <HeroKpi count={detail.count} target={detail.target} percent={detail.percent} />

      <DetailKpiGrid detail={detail} />

      <DetailTabs tab={tab} alarmCount={detail.alarms.length} onChange={setTab} />

      {tab === 'trend' && <CycleBarChart bars={detail.bars} average={detail.cycle} label={(t) => formatClock(origin + t * 1000)} />}

      <EventList events={events} />

      <div className="mt-auto">
        <RunButtons />
      </div>
    </Panel>
  )
}
