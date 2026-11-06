import { MathUtils, Vector3, type PerspectiveCamera } from 'three'

export type VisionProcess = 'palletizing' | 'depalletizing' | 'scan' | null

/** 패널이 고정한 구도. rollDeg 는 시선축 기준 추가 회전 */
export interface VisionPose {
  eye: [number, number, number]
  look: [number, number, number]
  up: [number, number, number]
  rollDeg: number
  fov: number
}

/** 지금 렌더에 쓰인 실제 카메라 값 */
export interface VisionReadout extends VisionPose {
  id: string
  process: VisionProcess
  rotationDeg: [number, number, number]
  overridden: boolean
}

const overrides = new Map<string, VisionPose>()

let readout: VisionReadout | null = null

const target = new Vector3()

const forward = new Vector3()

const round = (value: number, digits = 3) => Number(value.toFixed(digits))

const triple = (vector: Vector3, digits = 3): [number, number, number] => [round(vector.x, digits), round(vector.y, digits), round(vector.z, digits)]

/** 고정한 구도를 실제 비전 카메라에 적용 (없으면 그대로) */
export function applyVisionOverride(camera: PerspectiveCamera, id: string) {
  const pose = overrides.get(id)

  if (!pose) return

  camera.position.set(...pose.eye)

  camera.up.set(...pose.up)

  camera.lookAt(target.set(...pose.look))

  camera.rotateZ(MathUtils.degToRad(pose.rollDeg))

  camera.fov = pose.fov

  camera.updateProjectionMatrix()

  camera.updateMatrixWorld()
}

/** 렌더 직전 카메라 값을 기록. 시선 끝점은 eye 에서 시선 방향으로 eye-look 거리만큼 */
export function recordVisionCamera(camera: PerspectiveCamera, id: string, process: VisionProcess) {
  const pose = overrides.get(id)

  camera.getWorldDirection(forward)

  const distance = pose ? target.set(...pose.look).distanceTo(camera.position) : 3

  target.copy(camera.position).addScaledVector(forward, distance)

  const rotation = camera.rotation

  readout = {
    id,
    process,
    eye: triple(camera.position),
    look: pose ? pose.look : triple(target),
    up: pose ? pose.up : triple(camera.up),
    rollDeg: pose?.rollDeg ?? 0,
    fov: round(camera.fov, 1),
    rotationDeg: [round(MathUtils.radToDeg(rotation.x), 1), round(MathUtils.radToDeg(rotation.y), 1), round(MathUtils.radToDeg(rotation.z), 1)],
    overridden: !!pose,
  }
}

export function visionReadout(id: string) {
  return readout?.id === id ? readout : null
}

export function setVisionOverride(id: string, pose: VisionPose | null) {
  if (pose) overrides.set(id, pose)
  else overrides.delete(id)
}
