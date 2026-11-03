import type { ProcessStage } from '@/shared/types'
import { KPI_KEYS, kpiKey } from '@/shared/constants/kpi'
import type { KpiSample } from '@/shared/types/kpi'
import type { RunCounts, StatusFrame } from '@/shared/types/playback'

import { kpiNumber } from '@/features/playback'

import { INBOUND_TARGET, MOCK_ORDERS, OUTBOUND_WAIT_LIMIT } from '../config/warehouse.config'

const pct = (value: number, total: number) => (total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0)

const activity = (value: number): Pick<ProcessStage, 'status' | 'statusLabel'> =>
  value > 0 ? { status: 'running', statusLabel: '작동' } : { status: 'idle', statusLabel: '대기' }

/** 입고 · 출고 (재생 counts) + 출고 대기 (완성 팔레트 대기 장비) + 주문 (목업). 카드는 공정 흐름과 같다 */
export function warehouseKpis(counts: RunCounts | undefined, frame: StatusFrame | null, kpi?: KpiSample | null): ProcessStage[] {
  // v4 KPI 가 있으면 공장 기록값 (입고 박스 · 출하 팔레트 · 적치 대기 완성 팔레트)
  const inbound = Math.round(kpiNumber(kpi, KPI_KEYS.inbound) ?? counts?.inbound ?? 0)

  const shipped = kpiNumber(kpi, KPI_KEYS.outbound)

  const outbound = Math.round(shipped ?? counts?.outbound ?? 0)

  const recordedWait = kpiNumber(kpi, kpiKey('stageWip', { stage: 'rackStore' }))

  const waiting = recordedWait !== undefined ? Math.round(recordedWait) : Object.values(frame?.equipment ?? {}).filter((sample) => sample.label.includes('완성 팔레트')).length

  const caution = waiting >= OUTBOUND_WAIT_LIMIT * 0.8

  const { waiting: orderWait, progress, done, total, target } = MOCK_ORDERS

  return [
    { id: 'in', name: '입고', icon: 'inbound', value: inbound, unit: '박스', percent: pct(inbound, INBOUND_TARGET), ...activity(inbound) },
    { id: 'out', name: '출고', icon: 'outbound', value: outbound, unit: shipped === undefined ? '박스' : '팔레트', percent: shipped === undefined ? pct(outbound, inbound) : Math.round(kpiNumber(kpi, kpiKey('stageProgress', { stage: 'ship' })) ?? 0), ...activity(outbound) },
    {
      id: 'wait',
      name: '출고 대기',
      icon: 'pallet',
      value: waiting,
      unit: '팔레트',
      percent: pct(waiting, OUTBOUND_WAIT_LIMIT),
      status: caution ? 'warning' : 'running',
      statusLabel: caution ? '주의' : '정상',
    },
    { id: 'order-wait', name: '주문 대기', icon: 'order', value: orderWait, unit: '건', percent: pct(orderWait, total), status: 'warning', statusLabel: '대기' },
    { id: 'order-progress', name: '주문 진행', icon: 'order', value: progress, unit: '건', percent: pct(progress, total), status: 'running', statusLabel: '진행' },
    { id: 'order-done', name: '주문 완료', icon: 'order', value: done, unit: '건', percent: pct(done, target), ...activity(done) },
  ]
}
