import { Box3, Matrix4, Ray, Vector3, type BufferGeometry, type Intersection, type Object3D, type Raycaster } from 'three'

import { ROBOT_LABEL_HEIGHT, ROBOT_LABEL_NODE } from '../constants/robotLabel'

/** 외곽선과 픽 볼륨이 같은 여유. 선 위에 커서가 있어도 호버가 유지된다 */
export const OUTLINE_PAD = 0.15

interface Cached {
  box: Box3
}

const boxes = new WeakMap<Object3D, Cached>()

const inverse = new Matrix4()

const childMatrix = new Matrix4()

const childBox = new Box3()

const localRay = new Ray()

const hit = new Vector3()

const worldBox = new Box3()

const padded = new Box3()

const byId = new Map<string, Object3D>()

/** 로봇별 팔 base 메쉬 캐시. 모델 로드 전(못 찾음)은 캐시하지 않고 다음 프레임에 다시 찾는다 */
const robotBases = new WeakMap<Object3D, Object3D>()

const baseBox = new Box3()

function robotBase(object: Object3D) {
  const cached = robotBases.get(object)

  if (cached) return cached

  let found: Object3D | undefined

  object.traverse((child) => {
    if (!found && ROBOT_LABEL_NODE.test(child.name) && geometryOf(child)) found = child
  })

  if (found) robotBases.set(object, found)

  return found ?? null
}

function geometryOf(object: Object3D) {
  return (object as Object3D & { geometry?: BufferGeometry }).geometry
}

/** 호스트 로컬 축에 맞춘 박스. 월드 AABB 를 돌리면 yaw 만큼 부풀어 옆 장비까지 집힌다 */
function captureLocal(host: Object3D, target: Box3) {
  target.makeEmpty()

  host.updateWorldMatrix(true, true)

  inverse.copy(host.matrixWorld).invert()

  host.traverse((child) => {
    const geometry = geometryOf(child)

    if (!geometry) return

    if (!geometry.boundingBox) geometry.computeBoundingBox()

    const bounds = geometry.boundingBox

    if (!bounds || bounds.isEmpty()) return

    childMatrix.copy(child.matrixWorld).premultiply(inverse)

    target.union(childBox.copy(bounds).applyMatrix4(childMatrix))
  })
}

/** 마운트된 장비 그룹. useFrame 에서 이름으로 씬을 다시 찾지 않는다 */
export function registerEquipment(id: string, object: Object3D) {
  byId.set(id, object)

  return () => {
    if (byId.get(id) === object) byId.delete(id)
  }
}

export function equipmentById(id: string | null) {
  return id ? (byId.get(id) ?? null) : null
}

/** 로컬 박스를 한 번 잡아 둔다. 포인터 이벤트 안에서는 호출하지 않는다 */
export function capturePickBox(host: Object3D) {
  const cached = boxes.get(host) ?? { box: new Box3() }

  captureLocal(host, cached.box)

  boxes.set(host, cached)

  return cached.box
}

/** 팔이 움직이는 로봇은 외곽을 그리는 프레임마다 박스를 다시 잡는다 */
export function refreshRobotBox(object: Object3D) {
  if (object.userData.kind !== 'robot') return

  capturePickBox(object)
}

/** 마운트 때 잡아 둔 로컬 박스. 외곽선이 픽과 같은 박스를 쓰게 한다 */
export function equipmentLocalBox(object: Object3D, target: Box3) {
  const local = boxes.get(object)?.box

  if (!local || local.isEmpty()) return false

  target.copy(local)

  return true
}

/** 캐시된 로컬 박스에 현재 행렬만 곱한다 */
export function equipmentWorldBox(object: Object3D, target: Box3) {
  const local = boxes.get(object)?.box

  if (!local || local.isEmpty()) return false

  object.updateWorldMatrix(true, false)

  target.copy(local).applyMatrix4(object.matrixWorld)

  return true
}

/**
 * 로봇 base 지점: 팔 base 메쉬 월드 bbox 중심 XZ + 아랫면 높이(받침대 위면).
 * 로봇 원점 XZ 는 모델마다 base 와 어긋날 수 있어 메쉬 기준으로 잡는다. base 메쉬를 못 찾으면 false
 */
export function robotBaseSpot(object: Object3D, out: Vector3) {
  const base = object.userData.kind === 'robot' ? robotBase(object) : null

  const geometry = base ? geometryOf(base) : undefined

  if (!base || !geometry) return false

  if (!geometry.boundingBox) geometry.computeBoundingBox()

  object.updateWorldMatrix(true, true)

  baseBox.copy(geometry.boundingBox!).applyMatrix4(base.matrixWorld)

  baseBox.getCenter(out)

  out.y = baseBox.min.y

  return true
}

/** 로봇 라벨 기준점: base 지점(robotBaseSpot) + ROBOT_LABEL_HEIGHT. 링·라벨·리더선이 같은 XZ 를 쓴다 */
export function robotAnchor(object: Object3D, out: Vector3, lift = 0) {
  if (!robotBaseSpot(object, out)) return false

  out.y += ROBOT_LABEL_HEIGHT + lift

  return true
}

/** 장비 윗면 중앙. 로봇은 base 노드 위 고정 높이. 메시를 다시 훑지 않는다 */
export function equipmentTop(object: Object3D, out: Vector3, lift: number) {
  if (robotAnchor(object, out, lift)) return true

  if (!equipmentWorldBox(object, worldBox)) return false

  worldBox.getCenter(out)

  out.y = worldBox.max.y + lift

  return true
}

function localBox(host: Object3D) {
  const box = boxes.get(host)?.box

  if (!box || box.isEmpty()) return null

  return padded.copy(box).expandByScalar(OUTLINE_PAD)
}

/**
 * 장비 그룹의 자식에 붙인다. 마운트 때 잡아 둔 부모 박스만 검사한다.
 */
export function boundsRaycast(this: Object3D, raycaster: Raycaster, intersects: Intersection[]) {
  const host = this.parent

  if (!host) return

  const box = localBox(host)

  if (!box) return

  inverse.copy(host.matrixWorld).invert()

  localRay.copy(raycaster.ray).applyMatrix4(inverse)

  if (!localRay.intersectBox(box, hit)) return

  hit.applyMatrix4(host.matrixWorld)

  const distance = raycaster.ray.origin.distanceTo(hit)

  if (distance < raycaster.near || distance > raycaster.far) return

  intersects.push({ distance, point: hit.clone(), object: this })
}
