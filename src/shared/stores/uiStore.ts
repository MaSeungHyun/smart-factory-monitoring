import type { EquipmentStatus } from '@/shared/types'

/** 상태 칩 필터 (작동 = running + warning, 대기 = idle, 고장 = error) */
export type StatusFilter = 'running' | 'idle' | 'error'

export interface UiState {
  /** 목록 · 3D 공통 선택 장비 id */
  selectedId: string | null
  /** 3D 에서 커서가 올라간 장비 id */
  hoverId: string | null
  /** 헤더 벨로 여닫는 알림 패널 */
  alarmPanelOpen: boolean
  /** View 버튼: 3D 라벨 · 콜아웃 표시 */
  labelsVisible: boolean
  /** 범례로 숨긴 상태 */
  hiddenStatuses: ReadonlySet<EquipmentStatus>
  /** 상태 칩 필터 (null = 전체) */
  statusFilter: StatusFilter | null
}

type Listener = () => void

let state: UiState = {
  selectedId: null,
  hoverId: null,
  alarmPanelOpen: true,
  labelsVisible: true,
  hiddenStatuses: new Set(),
  statusFilter: null,
}

const listeners = new Set<Listener>()

const update = (patch: Partial<UiState>) => {
  state = { ...state, ...patch }

  listeners.forEach((listener) => listener())
}

const FILTER_MATCH: Record<StatusFilter, EquipmentStatus[]> = {
  running: ['running', 'warning'],
  idle: ['idle'],
  error: ['error'],
}

/** 범례 · 상태 칩 둘 다 통과하는 상태인지 */
export function statusVisible(status: string, ui: UiState = state) {
  const tone = status as EquipmentStatus

  if (ui.hiddenStatuses.has(tone)) return false

  return !ui.statusFilter || FILTER_MATCH[ui.statusFilter].includes(tone)
}

export const uiStore = {
  get: () => state,

  subscribe(listener: Listener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },

  select(id: string | null) {
    if (id !== state.selectedId) update({ selectedId: id })
  },

  toggleSelect(id: string) {
    update({ selectedId: state.selectedId === id ? null : id })
  },

  hover(id: string | null) {
    if (id !== state.hoverId) update({ hoverId: id })
  },

  toggleAlarmPanel() {
    update({ alarmPanelOpen: !state.alarmPanelOpen })
  },

  toggleLabels() {
    update({ labelsVisible: !state.labelsVisible })
  },

  toggleStatus(status: EquipmentStatus) {
    const next = new Set(state.hiddenStatuses)

    if (next.has(status)) next.delete(status)
    else next.add(status)

    update({ hiddenStatuses: next })
  },

  toggleFilter(filter: StatusFilter) {
    update({ statusFilter: state.statusFilter === filter ? null : filter })
  },
}
