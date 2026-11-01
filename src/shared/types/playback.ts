import type { AlertSeverity, EquipmentKind } from './'

/** 재생 장비 상태 (robot_IK 상태를 단순화) */
export type PlaybackState = 'idle' | 'moving' | 'picking' | 'placing' | 'charging' | 'error'

export interface PlaybackEquipment {
  id: string
  kind: EquipmentKind
  name: string
}

/** 한 장비의 상태 샘플 (2Hz) */
export interface EquipmentStateSample {
  state: PlaybackState
  /** robot_IK 원문 상태 문구 */
  label: string
  hasBox?: boolean
  battery?: number
  count?: number
  utilization?: number
  running?: boolean
}

export interface RunCounts {
  /** 로봇 이송 완료 합계 (박스) */
  handled: number

  inbound: number
  placed: number
  passed: number
  palletsShipped: number
  outbound: number
  defects: number
  wip: number
}

export interface StatusFrame {
  t: number
  counts: RunCounts
  equipment: Record<string, EquipmentStateSample>
}

/** 포즈 트랙: 프레임마다 [x, y, z, yaw] (없으면 null) */
export type PoseSample = [number, number, number, number] | null

export interface PoseTracks {
  /** 포즈 샘플 시각 (s, 시뮬레이션 시간) */
  t: number[]
  /** 움직이는 장비만 (id -> 프레임별 포즈) */
  poses: Record<string, PoseSample[]>
  /** 로봇 관절 (id -> 프레임별 각도 deg, joints 순서) */
  joints: Record<string, number[][]>
}

export interface RunEvent {
  t: number
  equipmentId: string
  from: PlaybackState
  to: PlaybackState
}

export type AlarmSource = 'random' | 'condition'

export interface RunAlarm {
  id: string
  t: number
  /** 고장 상태가 풀리는 시각 (없으면 알람만) */
  until?: number
  equipmentId: string
  severity: AlertSeverity
  message: string
  source: AlarmSource
}

export interface RunMeta {
  source: string
  template: string
  capturedAt: string
  duration: number
  poseHz: number
  statusHz: number
  /** 로봇 관절 이름 (joints 배열 순서) */
  jointNames: string[]
  boxHz?: number
  boxUnits?: string
}

export interface PlaybackRun {
  meta: RunMeta
  equipment: PlaybackEquipment[]
  tracks: PoseTracks
  status: StatusFrame[]
  events: RunEvent[]
  alarms: RunAlarm[]
  /** 박스 트랙 (없는 예전 기록 호환) */
  boxes?: BoxTrack[]
}

/** 박스 담당 장비 종류 */
export type BoxOwnerKind = 'conveyor' | 'robot' | 'amr' | 'pallet' | 'none'

/** 담당 구간 시작: [시각 s, 종류, 장비/팔레트 id] */
export type BoxOwnerSegment = [number, BoxOwnerKind, string | null]

export interface BoxDefect {
  t: number
  /** 불량 판정 장비 (스캐너) */
  by: string | null
  /** sim = robot_IK 실제 스캔 결과, injected = 주입 고장 */
  src: 'sim' | 'injected'
  alarm?: string
}

/**
 * 박스 1개 트랙. 위치는 10Hz 포즈 프레임(tracks.t) 기준 키프레임만 저장:
 * k = 프레임 index 증분 (첫 값은 f0 기준 0), p = [x, y, z (cm), yaw (centirad)] 반복.
 * 키프레임 사이 선형 보간 (보간 오차 1cm 이하 샘플은 제거됨).
 */
export interface BoxTrack {
  id: string
  /** 입고 (등장) 시각 s */
  t0: number
  /** 퇴장 시각 s (기록 끝까지 남아 있으면 null) */
  t1: number | null
  /** 입고 컨베이어 */
  src: string | null
  reason: 'outbound' | 'defect' | null
  /** robot_IK 최종 상태 (passed = 미처리 통과, shipped = 출하) */
  final?: string
  state: 'normal' | 'defect'
  defect?: BoxDefect
  own: BoxOwnerSegment[]
  f0: number
  k: number[]
  p: number[]
}
