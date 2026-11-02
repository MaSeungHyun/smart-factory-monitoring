export type EquipmentKind =
  | 'robot'
  | 'amr'
  | 'conveyor'
  | 'scanner'
  | 'rack'
  | 'pallet'
  | 'rail'
  | 'transfer'
  | 'door'
  | 'dock'
  | 'floor'

export type Vec3 = [number, number, number]

/** 표시에 필요한 설정만 남긴 템플릿 장비 설정 (smart-factory EquipmentSettings 축약판) */
export interface EquipmentSettings {
  amrRole?: string
  rackType?: 'fixed' | 'mobile'
  robotPedestal?: 'none' | 'base' | 'place'
  robotPedestalYaw?: number
  mountedOn?: string
  dockRole?: string
  /** robot_IK 와 같게 === true 일 때만 열림 */
  doorOpen?: boolean
  /** m/s. robot_IK placementDefaults: 역할 없음 0.25, inbound/outbound/ship 1 */
  beltSpeed?: number
  conveyorRole?: string
  /** 로봇 속도 배율 / 집기 반경 (robot_IK 기본 1 / 2.5) */
  speed?: number
  reach?: number
  /** 미검수 박스도 집기 (robot_IK 기본 false) */
  pickUnscanned?: boolean
  pickFilter?: string
  robotRole?: string
  [key: string]: unknown
}

export interface TemplateEquipment {
  kind: EquipmentKind
  x: number
  z: number
  yaw: number
  elevation?: number
  conveyorTurn?: string
  conveyorPath?: 'rail_c' | 'rail_001'
  conveyorLength?: number
  settings?: EquipmentSettings
}

export interface TemplateProp {
  source: 'factory'
  node: string
  position?: Vec3
  yaw?: number
  excludeMaterials?: string[]
}

export interface CameraView {
  position: Vec3
  target: Vec3
}

export interface TemplateCamera {
  view?: CameraView
  bookmarks?: unknown[]
}

export interface SceneTemplate {
  id: string
  name?: string
  lighting?: string
  camera?: TemplateCamera
  equipment: TemplateEquipment[]
  props?: TemplateProp[]
  links?: unknown[]
}

/** 템플릿 장비 + 재생(JSON playback) 시 매칭할 id (`${kind}-${index + 1}`) */
export interface SceneEquipment extends TemplateEquipment {
  id: string
}
