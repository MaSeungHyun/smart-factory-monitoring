/**
 * ⚠ PROVISIONAL: robot_IK 헤드리스 녹화 스키마 v1 의 사본과 모니터링 내부 정규화 형식.
 * 원본: robot_IK src/domain/recording/simRecording.ts, docs/sim-recording.md
 * 스키마가 바뀌면 이 파일의 [1] 과 features/boxes/lib/runStreams.ts 만 맞춘다.
 * 녹화가 없으면 기존 run JSON(boxes[].grip / own / p) 경로로 동작한다.
 * 단위 m, s. 쿼터니언 [x, y, z, w].
 */

// [1] robot_IK SimRecording v1 (run.recording)

export type SimVec3 = [number, number, number]

export type SimQuat = [number, number, number, number]

/** [t, robotId, on (true = ATTACH, false = RELEASE), boxId] */
export type SimSuctionEvent = [t: number, robotId: string, on: boolean, boxId: string | null]

/** ATTACH 순간 그리퍼 점과 박스 윗면 중심 (월드) */
export interface SimSuctionContact {
  t: number
  robotId: string
  boxId: string | null
  tool: SimVec3
  boxTop: SimVec3
  distance: number
  dy: number
}

export type SimBoxParentKind = 'conveyor' | 'pallet' | 'arm' | 'amr' | 'rail' | 'rack' | 'dock' | 'world' | 'none'

/** [t, boxId, parentKind, parentId, local position, local quaternion] (three.js 부모 기준) */
export type SimBoxParentEvent = [t: number, boxId: string, kind: SimBoxParentKind, parentId: string | null, position: SimVec3, quaternion: SimQuat]

/** 1 Hz 박스 월드 위치 */
export interface SimBoxKeyframe {
  t: number
  boxes: ([boxId: string, x: number, y: number, z: number] | [boxId: string, x: number, y: number, z: number, qx: number, qy: number, qz: number, qw: number])[]
}

export type SimPalletEventKind = 'create' | 'move' | 'ship'

/** [t, palletId, kind, detail (station / state / holder), 팔레트 그룹 월드 위치 | null] */
/** 뒤 3개 (yaw, carrierKind, carrierId) 는 나중에 추가된 선택 필드 */
export type SimPalletCarrierKind = 'amr' | 'rail' | 'arm' | 'station' | 'rack' | 'dock' | 'conveyor' | 'world'

/** [t, palletId, kind, detail, 월드 위치 | null, 월드 yaw, carrierKind, carrierId] (뒤 3개는 나중에 추가된 선택 필드) */
export type SimPalletEvent = [
  t: number,
  palletId: string,
  kind: SimPalletEventKind,
  detail: string | null,
  position: SimVec3 | null,
  yaw?: number | null,
  carrierKind?: SimPalletCarrierKind | null,
  carrierId?: string | null,
]

/** [t, palletId, carrierKind, carrierId] 운반체가 바뀔 때마다 */
export type SimPalletParentEvent = [t: number, palletId: string, kind: SimPalletCarrierKind, carrierId: string | null]

export interface SimRecording {
  version: 1
  template: string
  seed: number
  seconds: number
  suction: SimSuctionEvent[]
  contacts: SimSuctionContact[]
  boxParents: SimBoxParentEvent[]
  boxKeyframes: SimBoxKeyframe[]
  pallets: SimPalletEvent[]
  palletParents?: SimPalletParentEvent[]
  /** v2 (robot_IK 864dbfe~): keyframe rows carry a world quaternion, pallet parent local is relative to the pallet stream pose */
  boxKeyframeEncoding?: string
}

// [2] 모니터링 내부 형식 (runStreams.ts 가 [1] 에서 만든다)

/** [t, robotId, on(1) / off(0), boxId | null (null 이면 그리퍼에 가장 가까운 박스)] */
export type GripEvent = [t: number, robotId: string, on: 0 | 1, boxId: string | null]

export type BoxParentKind = SimBoxParentKind

/** 부모 기준 [x, y, z, qx, qy, qz, qw] */
export type LocalTransform = [x: number, y: number, z: number, qx: number, qy: number, qz: number, qw: number]

/** [t, boxId, parentKind, parentId, local | null (null 이면 부착 순간 월드를 유지하도록 계산)] */
export type BoxParentEvent = [t: number, boxId: string, kind: BoxParentKind, parentId: string | null, local: LocalTransform | null]

/** 박스 월드 키프레임 [t, x, y, z, yaw] (녹화에 yaw 가 없으면 0) */
export type BoxKeyframe = [t: number, x: number, y: number, z: number, yaw: number] | [t: number, x: number, y: number, z: number, yaw: number, qx: number, qy: number, qz: number, qw: number]

export interface PalletEvent {
  t: number
  id: string
  kind: 'spawn' | 'move' | 'ship'
  /** 월드 [x, y, z, yaw]. 연속된 move 사이는 선형 보간 */
  pose?: [x: number, y: number, z: number, yaw: number]
  /** 싣고 가는 장비 id. local 과 함께 있으면 강체 부착 */
  parentId?: string | null
  local?: LocalTransform | null
}

export interface RunEventStreams {
  gripEvents?: GripEvent[]
  boxParents?: BoxParentEvent[]
  /** boxId -> 월드 키프레임 */
  boxKeys?: Record<string, BoxKeyframe[]>
  palletEvents?: PalletEvent[]
  /** true: 관절이 robotElevation 높이의 팔 기준으로 기록됨. 없으면 기존 캡처(팔 y=0) */
  armElevated?: boolean
  /** true: boxParents 'pallet' local is relative to the pallet stream pose (world = pos + rotY(yaw) * local) */
  palletLocal?: boolean
}
