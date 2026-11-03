/**
 * robot_IK 애니메이션 파츠 (manifest.animatedParts + chunk tracks.parts).
 * 값은 GLB 노드 로컬 기준 (m, rad, quat [x, y, z, w]).
 */

export type AnimatedPartChannel = 'posX' | 'posY' | 'posZ' | 'rotX' | 'rotY' | 'rotZ' | 'quat' | 'fraction' | 'speed'

export type AnimatedPartQuat = [number, number, number, number]

export type AnimatedPartValue = number | AnimatedPartQuat

export interface AnimatedPart {
  i: number
  deviceId: string
  kind: string
  /** GLB 노드 이름 (원본). GLTFLoader 는 "." 을 지운다 */
  partName: string
  channel: AnimatedPartChannel
  unit?: string
  rest?: AnimatedPartValue
  threshold?: number
  /** 앱이 직접 만들거나 움직이는 파츠 (문 커튼, 벨트, 스토퍼) */
  procedural?: boolean
  /** procedural 파츠의 부모 노드 이름 (예: carriage) */
  parent?: string
  /** 부모 기준 로컬 위치 */
  restPos?: [number, number, number]
}

/** [t s, part index, value] */
export type AnimatedPartRow = [t: number, i: number, value: AnimatedPartValue]

/** 파츠 하나의 시간순 값 (재생 시간 기준, null = 아직 없음) */
export interface AnimatedPartTrack {
  part: AnimatedPart
  t: number[]
  values: (AnimatedPartValue | null)[]
}