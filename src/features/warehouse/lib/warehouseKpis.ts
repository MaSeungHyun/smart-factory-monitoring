import type { RunCounts, StatusFrame } from '@/shared/types/playback'

import { INBOUND_TARGET, MOCK_ORDERS, OUTBOUND_WAIT_LIMIT } from '../config/warehouse.config'

export interface WarehouseKpi {
  id: string
  label: string
  value: number
  unit: string
  side: string
  percent: number
  tone: 'info' | 'success' | 'warning'
  badge?: string
  mock?: boolean
}

const pct = (value: number, total: number) => (total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0)

/** 입고 · 출고 (재생 counts) + 출고 대기 (완성 팔레트 대기 장비) + 주문 (목업) */
export function warehouseKpis(counts: RunCounts | undefined, frame: StatusFrame | null): WarehouseKpi[] {
  const inbound = counts?.inbound ?? 0

  const outbound = counts?.outbound ?? 0

  const waiting = Object.values(frame?.equipment ?? {}).filter((sample) => sample.label.includes('완성 팔레트')).length

  const { waiting: orderWait, progress, done, total, target } = MOCK_ORDERS

  return [
    { id: 'in', label: '입고', value: inbound, unit: '박스', side: `목표 ${INBOUND_TARGET}`, percent: pct(inbound, INBOUND_TARGET), tone: 'info' },
    { id: 'out', label: '출고', value: outbound, unit: '박스', side: `바로 ${counts?.palletsShipped ?? 0} · 랙 ${counts?.placed ?? 0}`, percent: pct(outbound, inbound), tone: 'success' },
    {
      id: 'wait',
      label: '출고 대기',
      value: waiting,
      unit: '팔레트',
      side: `한도 ${OUTBOUND_WAIT_LIMIT}`,
      percent: pct(waiting, OUTBOUND_WAIT_LIMIT),
      tone: 'success',
      badge: waiting >= OUTBOUND_WAIT_LIMIT * 0.8 ? '주의' : '정상',
    },
    { id: 'order-wait', label: '주문 대기', value: orderWait, unit: '건', side: `전체 ${total}건`, percent: pct(orderWait, total), tone: 'warning', mock: true },
    { id: 'order-progress', label: '주문 진행', value: progress, unit: '건', side: `전체 ${total}건`, percent: pct(progress, total), tone: 'info', mock: true },
    { id: 'order-done', label: '주문 완료', value: done, unit: '건', side: `목표 ${target}`, percent: pct(done, target), tone: 'success', mock: true },
  ]
}
