import { Battery, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'

import { usePlaybackPick } from '@/features/playback'
import Panel from '@/shared/components/Panel'
import { useMonitorState } from '@/shared/stores/useMonitorViewStore'
import { formatClock } from '@/shared/hooks/useTimelineRange'

import { detailKind } from '../lib/detailKind'
import { useRobotDetail } from '../hooks/useRobotDetail'
import { useVehicleDetail } from '../hooks/useVehicleDetail'
import CycleBarChart from './CycleBarChart'
import DetailKpiGrid from './DetailKpiGrid'
import DetailTabs, { type DetailTabId } from './DetailTabs'
import EquipmentSelector from './EquipmentSelector'
import EventList from './EventList'
import HeroKpi from './HeroKpi'
import RunButtons from './RunButtons'
import VehicleKpiGrid from './VehicleKpiGrid'
import VehicleTrend from './VehicleTrend'

/** 장비 정보 패널 (오른쪽 412px) */
export default function RightInfoPanel() {
  const [tab, setTab] = useState<DetailTabId>('trend')

  const detail = useRobotDetail()

  const vehicle = useVehicleDetail()

  const { robotId } = useMonitorState()

  const origins = usePlaybackPick((snap) => snap.origins)

  const origin = origins[origins.length - 1] ?? 0

  const kind = detailKind(robotId)

  if (kind !== 'robot') {
    if (!vehicle) return <Panel className="h-full">{null}</Panel>

    const vehicleEvents = tab === 'alarm' ? vehicle.events.filter((event) => event.tone === 'error' || event.tone === 'warning') : vehicle.events

    return (
      <Panel className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3.5">
        <div className="flex shrink-0 items-center">
          <h2 className="text-body font-semibold text-text-primary">장비 정보</h2>

          <MoreHorizontal size={18} className="ml-auto text-text-secondary" />
        </div>

        <div className="shrink-0">
          <EquipmentSelector robotId={vehicle.id} status={vehicle.status} statusLabel={vehicle.statusLabel} />
        </div>

        <div className="shrink-0">
          {kind === 'amr' ? (
            <HeroKpi icon={<Battery size={14} />} label="배터리" count={vehicle.battery} unit="%" bar={vehicle.battery} />
          ) : (
            <HeroKpi
              label={kind === 'forklift' ? '오늘 작업 횟수' : '오늘 운반 횟수'}
              count={vehicle.count}
              target={vehicle.target}
              percent={vehicle.percent}
              unit="회"
            />
          )}
        </div>

        <div className="shrink-0">
          <VehicleKpiGrid detail={vehicle} />
        </div>

        <div className="shrink-0">
          <DetailTabs tab={tab} alarmCount={vehicle.alarms.length} onChange={setTab} logLabel="작동 기록" />
        </div>

        {/* 그래프는 고정, 아래 동작 리스트만 스크롤 */}
        {tab === 'trend' && <div className="shrink-0"><VehicleTrend chart={vehicle.chart} label={(t) => formatClock(origin + t * 1000)} /></div>}

        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          <EventList events={vehicleEvents} />
        </div>

        <div className="shrink-0">
          <RunButtons stopLabel="멈춤" />
        </div>
      </Panel>
    )
  }

  if (!detail) return <Panel className="h-full">{null}</Panel>

  const events =
    tab === 'alarm'
      ? detail.events.filter((event) => event.tone === 'error' || event.tone === 'warning')
      : detail.events

  return (
    <Panel className="flex h-full min-h-0 flex-col gap-3 overflow-hidden p-3.5">
      <div className="flex shrink-0 items-center">
        <h2 className="text-body font-semibold text-text-primary">장비 정보</h2>

        <MoreHorizontal size={18} className="ml-auto text-text-secondary" />
      </div>

      <div className="shrink-0">
        <EquipmentSelector robotId={detail.id} status={detail.status} statusLabel={detail.statusLabel} />
      </div>

      <div className="shrink-0">
        <HeroKpi count={detail.count} target={detail.target} percent={detail.percent} />
      </div>

      <div className="shrink-0">
        <DetailKpiGrid detail={detail} />
      </div>

      <div className="shrink-0">
        <DetailTabs tab={tab} alarmCount={detail.alarms.length} onChange={setTab} />
      </div>

      {/* 그래프는 고정, 아래 동작 리스트만 스크롤 */}
      {tab === 'trend' && <div className="shrink-0"><CycleBarChart bars={detail.bars} average={detail.average} label={(t) => formatClock(origin + t * 1000)} /></div>}

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <EventList events={events} />
      </div>

      <div className="shrink-0">
        <RunButtons />
      </div>
    </Panel>
  )
}
