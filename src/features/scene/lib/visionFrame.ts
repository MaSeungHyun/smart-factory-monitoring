import { InstancedMesh, Matrix4, PerspectiveCamera, Quaternion, Scene, Vector2, Vector3, Vector4, type Object3D, type WebGLRenderer } from 'three'

import { decodeBoxes, type DecodedBox } from '@/features/boxes/lib/decodeBoxes'
import { getExactTime, playbackStore } from '@/features/playback'
import { scanRecords, type ScanRecord } from '@/features/scan/lib/scanDetail'
import { findGripPoint } from '@/shared/lib/three/findGripPoint'
import type { PlaybackRun } from '@/shared/types/playback'

import { SCAN_TUNNEL_LIFT } from '../constants/modelPlacement'
import { visionPort, type VisionKind } from './visionPort'

const PICK_RANGE = 1.15

const HELD_RANGE = 3.2

const SCAN_RANGE = 1.7

const MAX_BOXES = 6

const TONE = {
  success: ['#34c77b', 'rgba(52, 199, 123, 0.10)'],
  info: ['#4fa8d4', 'rgba(79, 168, 212, 0.10)'],
  warning: ['#d99718', 'rgba(217, 151, 24, 0.16)'],
  error: ['#d94845', 'rgba(217, 72, 69, 0.16)'],
} as const

type Tone = keyof typeof TONE

interface Hit {
  label: string
  tone: Tone
  left: number
  top: number
  width: number
  height: number
  dist: number
  held: boolean
  defect: boolean
}

const camera = new PerspectiveCamera(38, 1, 0.08, 80)

const size = new Vector2()

const savedView = new Vector4()

const savedScissor = new Vector4()

const eye = new Vector3()

const look = new Vector3()

const focus = new Vector3()

const world = new Vector3()

const handQuat = new Quaternion()

const tool = new Vector3()

const side = new Vector3()

const corner = new Vector3()

const instanceMatrix = new Matrix4()

const up = new Vector3(0, 1, 0)

const boundsMin = new Vector3()

const boundsMax = new Vector3()

let boundsReady = false

let decodedRun: PlaybackRun | null = null

let decoded: DecodedBox[] = []

let byId = new Map<string, DecodedBox>()

let recordedRun: PlaybackRun | null = null

let recordedId = ''

let recorded: ScanRecord[] = []

function tracks(run: PlaybackRun) {
  if (decodedRun === run) return

  decodedRun = run

  decoded = decodeBoxes(run)

  byId = new Map(decoded.map((box) => [box.id, box]))

  recordedRun = null
}

function recordsOf(run: PlaybackRun, id: string) {
  tracks(run)

  if (recordedRun === run && recordedId === id) return recorded

  recordedRun = run

  recordedId = id

  recorded = scanRecords(run, id)

  return recorded
}

function aim(nextEye: Vector3, nextLook: Vector3, nextUp: Vector3, aspect: number, fov: number) {
  camera.fov = fov

  camera.aspect = aspect

  camera.position.copy(nextEye)

  camera.up.copy(nextUp)

  camera.lookAt(nextLook)

  camera.updateProjectionMatrix()

  camera.updateMatrixWorld()
}

/** hand04 위에서 흡착점 방향을 내려다본다. 관절보다 위·뒤에 두어 둥근 면이 보이게 한다. */
function aimRobot(robot: Object3D, aspect: number) {
  robot.updateWorldMatrix(true, true)

  const hand = robot.getObjectByName('hand04')

  const point = findGripPoint(robot)

  if (!hand || !point || point === hand) {
    robot.getWorldPosition(world)

    eye.set(world.x + 1.4, world.y + 1.2, world.z + 1.4)

    look.set(world.x, world.y + 0.6, world.z)

    focus.copy(look)

    camera.near = 0.08

    aim(eye, look, up, aspect, 42)

    return
  }

  hand.getWorldPosition(world)

  hand.getWorldQuaternion(handQuat)

  point.getWorldPosition(focus)

  tool.copy(focus).sub(world)

  if (tool.lengthSq() < 1e-6) tool.set(0.3435, -0.6383, 0)

  tool.normalize()

  side.set(0, 1, 0).addScaledVector(tool, -tool.y)

  if (side.lengthSq() < 0.04) side.set(0, 0, 1).applyQuaternion(handQuat).addScaledVector(tool, -side.dot(tool))

  side.normalize()

  eye.copy(world).addScaledVector(side, 0.9).addScaledVector(tool, -0.45)

  look.copy(world).addScaledVector(tool, 0.55)

  camera.near = 0.05

  aim(eye, look, side, aspect, 30)
}

function aimScan(scanner: Object3D, aspect: number) {
  scanner.updateWorldMatrix(true, false)

  eye.set(0.15, SCAN_TUNNEL_LIFT - 0.55, -1.7).applyMatrix4(scanner.matrixWorld)

  look.set(0, SCAN_TUNNEL_LIFT - 1.25, 0.25).applyMatrix4(scanner.matrixWorld)

  focus.copy(look)

  camera.near = 0.08

  aim(eye, look, up, aspect, 42)
}

function holeViewport(gl: WebGLRenderer, hole: HTMLElement) {
  const canvasRect = gl.domElement.getBoundingClientRect()

  const holeRect = hole.getBoundingClientRect()

  gl.getSize(size)

  if (canvasRect.width < 1 || canvasRect.height < 1 || holeRect.width < 2 || holeRect.height < 2) return null

  const scaleX = size.x / canvasRect.width

  const scaleY = size.y / canvasRect.height

  const x = (holeRect.left - canvasRect.left) * scaleX

  const y = (canvasRect.bottom - holeRect.bottom) * scaleY

  const width = holeRect.width * scaleX

  const height = holeRect.height * scaleY

  if (width < 2 || height < 2) return null

  return { x, y, width, height, cssWidth: holeRect.width, cssHeight: holeRect.height }
}

function rememberBounds(mesh: InstancedMesh) {
  if (boundsReady) return true

  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()

  const box = mesh.geometry.boundingBox

  if (!box || box.isEmpty()) return false

  boundsMin.copy(box.min)

  boundsMax.copy(box.max)

  boundsReady = true

  return true
}

function projectBox(matrix: Matrix4, cssWidth: number, cssHeight: number) {
  let minX = Infinity

  let minY = Infinity

  let maxX = -Infinity

  let maxY = -Infinity

  for (let cornerIndex = 0; cornerIndex < 8; cornerIndex += 1) {
    corner
      .set(cornerIndex & 1 ? boundsMax.x : boundsMin.x, cornerIndex & 2 ? boundsMax.y : boundsMin.y, cornerIndex & 4 ? boundsMax.z : boundsMin.z)
      .applyMatrix4(matrix)
      .project(camera)

    if (corner.z > 1) return null

    const x = ((corner.x + 1) / 2) * cssWidth

    const y = ((1 - corner.y) / 2) * cssHeight

    minX = Math.min(minX, x)

    minY = Math.min(minY, y)

    maxX = Math.max(maxX, x)

    maxY = Math.max(maxY, y)
  }

  const left = Math.max(0, minX)

  const top = Math.max(0, minY)

  const right = Math.min(cssWidth, maxX)

  const bottom = Math.min(cssHeight, maxY)

  const width = right - left

  const height = bottom - top

  if (width < 10 || height < 10) return null

  return { left, top, width, height }
}

function heldBy(box: DecodedBox, robotId: string, time: number) {
  return box.grips.some((grip) => grip.robot === robotId && time >= grip.start && time < grip.end)
}

function recordAt(records: ScanRecord[], id: string, time: number) {
  for (let index = records.length - 1; index >= 0; index -= 1) {
    const record = records[index]

    if (record.boxId === id && record.enter <= time && time < record.leave) return record
  }

  return null
}

function collect(scene: Scene, kind: VisionKind, id: string, cssWidth: number, cssHeight: number) {
  const mesh = scene.getObjectByName('factory-boxes')

  const hits: Hit[] = []

  if (!mesh || !(mesh instanceof InstancedMesh) || !rememberBounds(mesh)) return hits

  const run = playbackStore.getState().run

  if (!run) return hits

  tracks(run)

  const time = getExactTime()

  const records = kind === 'scan' ? recordsOf(run, id) : null

  const ids = mesh.userData.visionIds as string[] | undefined

  const lookX = focus.x

  const lookZ = focus.z

  for (let index = 0; index < mesh.count; index += 1) {
    const boxId = ids?.[index]

    const box = boxId ? byId.get(boxId) : undefined

    if (!boxId || !box) continue

    mesh.getMatrixAt(index, instanceMatrix)

    world.setFromMatrixPosition(instanceMatrix)

    const dist = Math.hypot(world.x - lookX, world.z - lookZ)

    const held = kind === 'robot' && heldBy(box, id, time)

    if (kind === 'robot' ? dist > (held ? HELD_RANGE : PICK_RANGE) : dist > SCAN_RANGE) continue

    const rect = projectBox(instanceMatrix, cssWidth, cssHeight)

    if (!rect) continue

    const defect = time >= box.defectAt

    const record = records ? recordAt(records, boxId, time) : null

    const hit: Hit = {
      label: boxId,
      tone: 'info',
      ...rect,
      dist,
      held,
      defect: defect || record?.defect === true,
    }

    if (kind === 'scan') {
      if (record && record.at > time) {
        hit.label = `판독 중 · ${boxId}`
      } else if (hit.defect) {
        hit.label = `제거 · ${boxId}`

        hit.tone = 'error'
      } else if (record) {
        hit.label = `정상 · ${boxId}`

        hit.tone = 'success'
      }
    }

    hits.push(hit)
  }

  if (kind === 'robot') {
    let pick: Hit | null = null

    for (const hit of hits) {
      if (hit.held || hit.defect) continue

      if (!pick || hit.dist < pick.dist) pick = hit
    }

    for (const hit of hits) {
      if (hit.defect) {
        hit.label = `제거 · ${hit.label}`

        hit.tone = 'error'
      } else if (hit.held) {
        hit.label = `적재 중 · ${hit.label}`

        hit.tone = 'warning'
      } else if (hit === pick) {
        hit.label = `집기 대상 · ${hit.label}`

        hit.tone = 'success'
      }
    }
  }

  hits.sort((a, b) => a.dist - b.dist)

  hits.length = Math.min(hits.length, MAX_BOXES)

  return hits
}

function paint(overlay: HTMLElement, hits: Hit[]) {
  while (overlay.childElementCount > hits.length) overlay.lastElementChild?.remove()

  for (let index = 0; index < hits.length; index += 1) {
    let node = overlay.children[index] as HTMLDivElement | undefined

    let label: HTMLSpanElement

    if (!node) {
      node = document.createElement('div')

      label = document.createElement('span')

      node.append(label)

      overlay.append(node)
    } else {
      label = node.firstElementChild as HTMLSpanElement
    }

    const hit = hits[index]

    const [color, fill] = TONE[hit.tone]

    node.style.cssText = `position:absolute;left:${hit.left}px;top:${hit.top}px;width:${hit.width}px;height:${hit.height}px;border:1px solid ${color};background:${fill};border-radius:2px;box-sizing:border-box;`

    label.textContent = hit.label

    label.style.cssText = `position:absolute;left:0;top:${hit.top < 16 ? 2 : -14}px;font-size:9px;line-height:12px;font-weight:600;white-space:nowrap;color:${color};`
  }
}

/** 센서 화면 위에 겹치면 안 되는 관제 그림 (호버 칩 · 선택 카드 · 고장 라벨) */
function concealAnnotations(hole: HTMLElement) {
  for (const node of document.querySelectorAll<HTMLElement>('[data-sensor-clipped]')) {
    if (node.dataset.viewportAnnotation === 'hide') node.style.visibility = ''
    else node.style.clipPath = ''

    delete node.dataset.sensorClipped
  }

  const holeRect = hole.getBoundingClientRect()

  for (const node of document.querySelectorAll<HTMLElement>('[data-viewport-annotation]')) {
    const rect = node.getBoundingClientRect()

    if (rect.width < 1 || rect.height < 1) continue

    const overlaps = rect.right > holeRect.left && rect.left < holeRect.right && rect.bottom > holeRect.top && rect.top < holeRect.bottom

    if (!overlaps) continue

    if (node.dataset.viewportAnnotation === 'cut') {
      const x = holeRect.left - rect.left

      const y = holeRect.top - rect.top

      node.style.clipPath = `path(evenodd, 'M0 0 H${rect.width} V${rect.height} H0 Z M${x} ${y} H${x + holeRect.width} V${y + holeRect.height} H${x} Z')`
    } else {
      node.style.visibility = 'hidden'
    }

    node.dataset.sensorClipped = ''
  }
}

function revealAnnotations() {
  for (const node of document.querySelectorAll<HTMLElement>('[data-sensor-clipped]')) {
    if (node.dataset.viewportAnnotation === 'hide') node.style.visibility = ''
    else node.style.clipPath = ''

    delete node.dataset.sensorClipped
  }
}

/** 호버·선택 외곽선은 관제 화면용이라 센서 카메라에는 그리지 않는다 */
function withoutSensorChrome(scene: Scene, draw: () => void) {
  const hidden: Object3D[] = []

  scene.traverse((object) => {
    if (object.userData.sensorHidden && object.visible) {
      object.visible = false

      hidden.push(object)
    }
  })

  try {
    draw()
  } finally {
    for (const object of hidden) object.visible = true
  }
}

/** 인셋 구멍에 작업 구역 카메라를 그리고, 그 화면 기준으로 인식 박스를 올린다 */
export function drawVision(gl: WebGLRenderer, scene: Scene) {
  const { hole, overlay, kind, id } = visionPort

  if (!hole || !overlay || !kind || !id) {
    revealAnnotations()

    return
  }

  const view = holeViewport(gl, hole)

  const subject = scene.getObjectByName(id)

  const run = playbackStore.getState().run

  if (!view || !subject || !run) {
    overlay.replaceChildren()

    revealAnnotations()

    return
  }

  concealAnnotations(hole)

  tracks(run)

  if (kind === 'robot') aimRobot(subject, view.width / view.height)
  else aimScan(subject, view.width / view.height)

  gl.getViewport(savedView)

  gl.getScissor(savedScissor)

  const scissorTest = gl.getScissorTest()

  gl.setScissorTest(true)

  gl.setViewport(view.x, view.y, view.width, view.height)

  gl.setScissor(view.x, view.y, view.width, view.height)

  try {
    withoutSensorChrome(scene, () => gl.render(scene, camera))
  } finally {
    gl.setViewport(savedView)

    gl.setScissor(savedScissor)

    gl.setScissorTest(scissorTest)
  }

  paint(overlay, collect(scene, kind, id, view.cssWidth, view.cssHeight))
}
