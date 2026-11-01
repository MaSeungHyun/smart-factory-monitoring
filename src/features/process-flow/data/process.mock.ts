import type { ProcessStage } from '@/shared/types'

export const PROCESS_STAGES: ProcessStage[] = [
  { id: 'inbound', name: '입고', icon: 'inbound', value: 1240, unit: '박스', percent: 82, status: 'running', statusLabel: '작동' },
  { id: 'conveyor', name: '컨베이어 투입', icon: 'conveyor', value: 1198, unit: '박스', percent: 92, status: 'running', statusLabel: '작동' },
  { id: 'scan', name: '스캔 검사 · 분류', icon: 'scan', value: 1080, unit: '박스', percent: 64, status: 'error', statusLabel: '불량' },
  { id: 'pallet', name: '팔레트 적재', icon: 'pallet', value: 1040, unit: '박스', percent: 46, status: 'warning', statusLabel: '대기' },
  { id: 'amr', name: 'AMR 이송', icon: 'amr', value: 1102, unit: '박스', percent: 88, status: 'running', statusLabel: '작동' },
  { id: 'outbound', name: '출고', icon: 'outbound', value: 1015, unit: '박스', percent: 80, status: 'running', statusLabel: '작동' },
]
