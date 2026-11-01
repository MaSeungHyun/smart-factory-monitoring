/** 왼쪽 레일 탭이 고르는 화면 상태: 메인 관제 / 장비(로봇) 상세 */
export type MonitorView = 'main' | 'robot'

/** 장비 상세 3D 시점 */
export type ViewAngle = 'front' | 'side' | 'top'

export interface MonitorViewState {
  view: MonitorView
  robotId: string
  angle: ViewAngle
}

/** robot_cam 이 원본에서 비추는 로봇 */
export const DEFAULT_ROBOT_ID = 'robot-1'

type Listener = () => void

let state: MonitorViewState = { view: 'main', robotId: DEFAULT_ROBOT_ID, angle: 'front' }

const listeners = new Set<Listener>()

const update = (patch: Partial<MonitorViewState>) => {
  state = { ...state, ...patch }

  listeners.forEach((listener) => listener())
}

export const monitorView = {
  get: () => state,

  set(view: MonitorView) {
    if (view !== state.view) update({ view, angle: 'front' })
  },

  selectRobot(robotId: string) {
    if (robotId !== state.robotId) update({ robotId, angle: 'front' })
  },

  setAngle(angle: ViewAngle) {
    if (angle !== state.angle) update({ angle })
  },

  subscribe(listener: Listener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },
}
