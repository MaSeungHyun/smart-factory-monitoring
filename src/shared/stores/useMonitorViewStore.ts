import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

/** 왼쪽 레일 탭이 고르는 화면 상태: 메인 관제 / 장비 상세 / 스캔 검사 / 창고 · AMR */
export type MonitorView = 'main' | 'robot' | 'scan' | 'warehouse'

/** 장비 상세 3D 시점 */
export type ViewAngle = 'front' | 'side' | 'top'

export interface MonitorViewState {
  view: MonitorView
  robotId: string
  scannerId: string
  angle: ViewAngle
  /** 사용자가 카메라를 직접 움직여 시점 버튼이 풀린 상태 (카메라는 그대로) */
  free: boolean
  /** 시점 버튼을 누를 때마다 증가: 같은 버튼을 다시 눌러도 다시 비행한다 */
  angleNonce: number
}

interface MonitorViewActions {
  set: (view: MonitorView) => void
  selectRobot: (robotId: string) => void
  selectScanner: (scannerId: string) => void
  setAngle: (angle: ViewAngle) => void
  release: () => void
}

/** robot_cam 이 원본에서 비추는 로봇 */
export const DEFAULT_ROBOT_ID = 'robot-1'

/** 스캔 검사 화면 기본 스캐너 */
export const DEFAULT_SCANNER_ID = 'scanner-16'

export const monitorView = createStore<MonitorViewState & MonitorViewActions>((set, get) => ({
  view: 'main',
  robotId: DEFAULT_ROBOT_ID,
  scannerId: DEFAULT_SCANNER_ID,
  angle: 'front',
  free: false,
  angleNonce: 0,

  set(view) {
    if (view !== get().view) set({ view, angle: 'front', free: false })
  },

  selectRobot(robotId) {
    if (robotId !== get().robotId) set({ robotId, angle: 'front', free: false })
  },

  selectScanner(scannerId) {
    if (scannerId !== get().scannerId) set({ scannerId, angle: 'front', free: false })
  },

  setAngle(angle) {
    set({ angle, free: false, angleNonce: get().angleNonce + 1 })
  },

  release() {
    if (!get().free) set({ free: true })
  },
}))

/** 화면 상태 전체 (view / robotId / scannerId / angle) */
export function useMonitorState() {
  return useStore(monitorView)
}

/** 레일 탭. 장비 선택이 바뀌어도 이 훅은 다시 그리지 않는다 */
export function useMonitorView() {
  return useStore(monitorView, (state) => state.view)
}
