import type { EquipmentItem, KpiItem, SiteInfo, StatusCounts, Throughput } from '@/shared/types'

export const SITE: SiteInfo = { name: '물류센터 A동', floor: '1F' }

export const THROUGHPUT: Throughput = { value: 8420, target: 10800, unit: '박스' }

export const KPIS: KpiItem[] = [
  { id: 'oee', label: '장비 효율 (OEE)', value: '86.4', unit: '%', sparkline: [70, 74, 72, 78, 76, 82, 80, 86] },
  { id: 'defect', label: '불량', value: '12', unit: '개', sub: '0.2%', tone: 'error' },
  { id: 'inbound', label: '입고', value: '1,240', unit: '박스' },
  { id: 'outbound', label: '출고', value: '1,015', unit: '박스' },
]

export const EQUIPMENT: EquipmentItem[] = [
  {
    id: 'ROBOT_02',
    name: '로봇-02',
    process: '컨베이어 투입',
    type: 'robot',
    status: 'running',
    statusLabel: '작동',
    metricLeft: '사이클 6.2s',
    metricRight: '1,198 개',
    percent: 92,
  },
  {
    id: 'AMR_03',
    name: 'AMR-03',
    process: '랙 보관',
    type: 'amr',
    status: 'warning',
    statusLabel: '배터리 18%',
    metricLeft: '랙 B-3 이동',
    metricRight: '186 회',
    percent: 18,
  },
  {
    id: 'SCAN_01',
    name: '스캔 터널-01',
    process: '스캔 검사 · 분류',
    type: 'scanner',
    status: 'error',
    statusLabel: '불량 감지',
    metricLeft: '12건 / 8,432',
    metricRight: '99.86%',
    percent: 64,
  },
]

export const STATUS_COUNTS: StatusCounts = { running: 18, idle: 4, error: 1 }

export const TIMELINE_HOURS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00']

export const EQUIPMENT_TOTAL = 24

export const ALARM_TOTAL = 3
