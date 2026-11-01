import type { ProcessStage } from '@/shared/types'
import type { RunCounts, StatusFrame } from '@/shared/types/playback'

import { INBOUND_TARGET, MOCK_ORDERS, OUTBOUND_WAIT_LIMIT } from '../config/warehouse.config'

const pct = (value: number, total: number) => (total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0)

const activity = (value: number): Pick<ProcessStage, 'status' | 'statusLabel'> =>
  value > 0 ? { status: 'running', statusLabel: '작동' } : { status: 'idle', statusLabel: '대기' }

/** 입고 · 출고 (재생 counts) + 출고 대기 (완성 팔레트 대기 장비) + 주문 (목업). 카드는 공정 흐름과 같다 */
export function warehouseKpis(counts: RunCounts | undefined, frame: StatusFrame | null): ProcessStage[] {
  const inbound = counts?.inbound ?? 0

  const outbound = counts?.outbound ?? 0

  const waiting = Object.values(frame?.equipment ?? {}).filter((sample) => sample.label.includes('완성 팔레트')).length

  const caution = waiting >= OUTBOUND_WAIT_LIMIT * 0.8

  const { waiting: orderWait, progress, done, total, target } = MOCK_ORDERS

  return [
    { id: 'in', name: '입고', icon: 'inbound', value: inbound, unit: '박스', percent: pct(inbound, INBOUND_TARGET), ...activity(inbound) },
    { id: 'out', name: '출고', icon: 'outbound', value: outbound, unit: '박스', percent: pct(outbound, inbound), ...activity(outbound) },
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
