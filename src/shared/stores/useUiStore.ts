import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import type { EquipmentStatus } from '@/shared/types'

/** 상태 칩 필터 (작동 = running + warning, 대기 = idle, 고장 = error) */
export type StatusFilter = 'running' | 'idle' | 'error'

export interface UiState {
  /** 목록 · 3D 공통 선택 장비 id */
  selectedId: string | null
  /** 헤더 벨로 여닫는 알림 패널 */
  alarmPanelOpen: boolean
  /** View 버튼: 3D 라벨 · 콜아웃 표시 */
  labelsVisible: boolean
  /** 전체 보기: 헤더 · 아이콘 레일을 남기고 씬을 키움 */
  sceneExpanded: boolean
  /** 범례로 숨긴 상태 */
  hiddenStatuses: ReadonlySet<EquipmentStatus>
  /** 상태 칩 필터 (null = 전체) */
  statusFilter: StatusFilter | null
}

interface UiActions {
  select: (id: string | null) => void
  toggleSelect: (id: string) => void
  toggleAlarmPanel: () => void
  toggleLabels: () => void
  toggleSceneExpanded: () => void
  toggleStatus: (status: EquipmentStatus) => void
  toggleFilter: (filter: StatusFilter) => void
}

const FILTER_MATCH: Record<StatusFilter, EquipmentStatus[]> = {
  running: ['running', 'warning'],
  idle: ['idle'],
  error: ['error'],
}

/** 호버는 스토어 밖. setState 하면 씬이 매 호버마다 다시 그려진다 */
let hoverId: string | null = null

export function getHover() {
  return hoverId
}

export function setHover(id: string | null) {
  hoverId = id
}

export const uiStore = createStore<UiState & UiActions>((set, get) => ({
  selectedId: null,
  alarmPanelOpen: true,
  labelsVisible: true,
  sceneExpanded: false,
  hiddenStatuses: new Set(),
  statusFilter: null,

  select(id) {
    if (id !== get().selectedId) set({ selectedId: id })
  },

  toggleSelect(id) {
    set({ selectedId: get().selectedId === id ? null : id })
  },

  toggleAlarmPanel() {
    set({ alarmPanelOpen: !get().alarmPanelOpen })
  },

  toggleLabels() {
    set({ labelsVisible: !get().labelsVisible })
  },

  toggleSceneExpanded() {
    set({ sceneExpanded: !get().sceneExpanded })
  },

  toggleStatus(status) {
    const next = new Set(get().hiddenStatuses)

    if (next.has(status)) next.delete(status)
    else next.add(status)

    set({ hiddenStatuses: next })
  },

  toggleFilter(filter) {
    set({ statusFilter: get().statusFilter === filter ? null : filter })
  },
}))

/** 범례 · 상태 칩 둘 다 통과하는 상태인지 */
export function statusVisible(status: string, ui: UiState = uiStore.getState()) {
  const tone = status as EquipmentStatus

  if (ui.hiddenStatuses.has(tone)) return false

  return !ui.statusFilter || FILTER_MATCH[ui.statusFilter].includes(tone)
}

/** 공용 UI (선택 · 알림 패널 · 라벨 · 필터). 호버는 구독하지 않는다 */
export function useUi() {
  return useStore(uiStore)
}
