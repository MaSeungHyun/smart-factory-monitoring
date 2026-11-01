import type { AlertItem } from '@/shared/types'

export const ALERTS: AlertItem[] = [
  { id: 'A1', severity: 'error', message: '스캔 터널 — 불량 감지 (라벨 훼손)', time: '14:31' },
  { id: 'A2', severity: 'warning', message: 'AMR-03 배터리 18% · 충전 필요', time: '14:26' },
  { id: 'A3', severity: 'warning', message: '로봇-05 대기 (박스 없음)', time: '14:20' },
  { id: 'A4', severity: 'success', message: '입고 트럭 3대 도착', time: '13:58' },
]
