import type { RobotDetail } from './robotDetail'

/** 로봇 상태별 마커/콜아웃 색 */
export const ROBOT_STATUS_COLOR: Record<RobotDetail['status'], string> = {
  running: '#34c77b',
  idle: '#8a8f98',
  warning: '#d99718',
  error: '#d94845',
}
