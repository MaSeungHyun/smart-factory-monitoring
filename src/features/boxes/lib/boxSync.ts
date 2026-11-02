import { Matrix4, Quaternion, Vector3, type Object3D } from 'three'

import { findGripPoint } from '@/shared/lib/three/findGripPoint'
import type { PlaybackRun } from '@/shared/types/playback'

import { createArmReach } from './armReach'
import { createDriftResync, keyPoseAt } from './boxKeyframes'
import { buildParentSpans, insertSpan, spanAt, type ParentSpan, type SpanKind, type SpanLookup } from './boxParenting'
import { boxPoseAt } from './boxPoseAt'
import type { DecodedBox } from './decodeBoxes'
import { palletNodeName } from './palletTracks'
import { readStreams } from './runStreams'

/** 레거시 접촉 판정: 그리퍼 끝과 박스(윗면 중심) 거리 (y=0 팔 기준 34/34 검증) */
const CONTACT_REACH = 0.15

/** boxId 없는 grip on: 이 거리 안의 가장 가까운 박스 */
const NEAREST_REACH = 0.5

const SCAN_STEP = 0.1

/** 놓은 뒤 팔 기준 월드 -> 기록 월드로 넘어가는 시간 */
const RELEASE_BLEND = 0.35

/** 가상(synthetic) 그립은 시작 직전부터 팔레트 재구성에서 뺀다 */
const SYNTHETIC_LEAD = 0.5

const UP = new Vector3(0, 1, 0)

const ONE = new Vector3(1, 1, 1)

export type BoxMode = SpanKind | 'synthetic'

export interface BoxSync {
  /** time 의 박스 월드 행렬을 out 에 채우고 현재 부모 종류를 돌려준다 (같은 time 은 캐시) */
  world(box: DecodedBox, time: number, out: Matrix4): BoxMode
}

/**
 * 박스 부모 해석.
 * - 붙는 순간(grip on) 월드를 유지한 채 부모 로컬로 바꾼다 (robot_IK SuctionRobotController attach 와 같음)
 * - 떼는 순간(grip off) 아래 부모로 넘긴다: 다음 구간이 강체면 그 순간 팔 기준 월드를 유지, 아니면 기록 월드로 블렌드
 * - 강체 구간은 키프레임 경계마다 5 cm 넘는 드리프트를 보정
 */
export function createBoxSync(scene: Object3D, run: PlaybackRun, boxes: DecodedBox[], armTemplate: Object3D): BoxSync {
  const streams = readStreams(run)

  const grounded = !streams.armElevated

  const parenting = buildParentSpans(boxes, streams)

  const tipAt = createArmReach(armTemplate, run)

  const resync = createDriftResync()

  const objects = new Map<string, Object3D>()

  const cache = new Map<string, { time: number; mode: BoxMode; matrix: Matrix4 }>()

  const lookup: SpanLookup = { current: null, previous: null }

  const pose = [0, 0, 0, 0]

  const position = new Vector3()

  const rotation = new Quaternion()

  const scale = new Vector3()

  const target = new Vector3()

  const targetRotation = new Quaternion()

  const parent = new Matrix4()

  const source = new Matrix4()

  const released = new Matrix4()

  let resolved = false

  const find = (name: string) => {
    let object = objects.get(name)

    if (!object) {
      object = scene.getObjectByName(name)

      if (object) objects.set(name, object)
    }

    return object ?? null
  }

  // ---- 기록 월드 / 부모 월드

  function trackWorld(box: DecodedBox, time: number, out: Matrix4) {
    const keys = streams.boxKeys?.[box.id]

    if (box.times.length) boxPoseAt(box, time, pose)
    else if (keys?.length) keyPoseAt(keys, time, pose)

    position.set(pose[0], pose[1], pose[2])

    rotation.setFromAxisAngle(UP, pose[3])

    return out.compose(position, rotation, ONE)
  }

  function parentWorld(span: ParentSpan, time: number, out: Matrix4) {
    if (!span.parentId) return false

    if (span.kind === 'arm') {
      const robot = find(span.parentId)

      if (!robot) return false

      if (tipAt(robot, span.parentId, time, out, grounded)) return true

      const point = findGripPoint(robot)

      if (!point) return false

      point.updateWorldMatrix(true, false)

      out.copy(point.matrixWorld)

      return true
    }

    const object = find(span.kind === 'pallet' ? palletNodeName(span.parentId) : span.parentId)

    if (!object) return false

    object.updateWorldMatrix(true, false)

    out.copy(object.matrixWorld)

    return true
  }

  // ---- 월드 유지 부착

  function armBefore(box: DecodedBox, span: ParentSpan) {
    const list = parenting.spans.get(box.id) ?? []

    const previous = list[list.indexOf(span) - 1]

    return previous?.kind === 'arm' && Math.abs(previous.end - span.start) < 0.05 ? previous : null
  }

  function ensureLocal(box: DecodedBox, span: ParentSpan, time: number) {
    if (span.local) return span.local

    // 팔: grip on 순간. AMR·팔레트: 과거 부모 위치를 모르므로 처음 보는 순간
    const at = span.kind === 'arm' ? span.start : time

    const arm = span.kind !== 'arm' && time - span.start < 1 ? armBefore(box, span) : null

    if (!(arm && rigidWorld(box, arm, arm.end, source))) trackWorld(box, at, source)

    if (!parentWorld(span, at, parent)) return null

    span.local = new Matrix4().copy(parent).invert().multiply(source)

    return span.local
  }

  function rigidWorld(box: DecodedBox, span: ParentSpan, time: number, out: Matrix4): boolean {
    const local = ensureLocal(box, span, time)

    if (!local || !parentWorld(span, time, parent)) return false

    out.multiplyMatrices(parent, local)

    return true
  }

  // ---- 접촉 시각 / boxId 없는 grip 해석 (로봇이 씬에 올라온 뒤 한 번)

  function contactTime(box: DecodedBox, robot: Object3D, span: ParentSpan, window: { from: number; fallback: number }) {
    for (let t = window.from; t < span.end; t += SCAN_STEP) {
      if (!tipAt(robot, span.parentId!, t, parent, grounded)) break

      trackWorld(box, t, source)

      target.setFromMatrixPosition(parent)

      if (target.distanceTo(position.setFromMatrixPosition(source)) < CONTACT_REACH) return t
    }

    return window.fallback
  }

  function nearestBox(robot: Object3D, grip: { robot: string; start: number }) {
    if (!tipAt(robot, grip.robot, grip.start, parent, grounded)) return null

    target.setFromMatrixPosition(parent)

    let best: DecodedBox | null = null

    let bestD = NEAREST_REACH

    for (const box of boxes) {
      if (grip.start < box.start || grip.start >= box.end) continue

      const distance = target.distanceTo(position.setFromMatrixPosition(trackWorld(box, grip.start, source)))

      if (distance < bestD) {
        best = box

        bestD = distance
      }
    }

    return best
  }

  function resolve() {
    if (resolved) return

    let waiting = false

    const byId = new Map(boxes.map((box) => [box.id, box]))

    for (const [id, spans] of parenting.spans) {
      const box = byId.get(id)

      for (const span of spans) {
        const window = span.window

        if (!window || !box || !span.parentId) continue

        const robot = find(span.parentId)

        if (!robot) {
          waiting = true

          continue
        }

        span.start = contactTime(box, robot, span, window)

        span.window = null
      }
    }

    parenting.pending = parenting.pending.filter((grip) => {
      const robot = find(grip.robot)

      if (!robot) return (waiting = true)

      const box = nearestBox(robot, grip)

      if (box) insertSpan(parenting.spans, box.id, { start: grip.start, end: grip.end, kind: 'arm', parentId: grip.robot, local: null, window: null })

      return false
    })

    resolved = !waiting
  }

  // ---- 프레임 계산

  function blend(out: Matrix4, from: Matrix4, k: number) {
    from.decompose(position, rotation, scale)

    out.decompose(target, targetRotation, scale)

    position.lerp(target, k)

    rotation.slerp(targetRotation, k)

    out.compose(position, rotation, ONE)
  }

  function compute(box: DecodedBox, time: number, out: Matrix4): BoxMode {
    if (box.grips.some((grip) => grip.synthetic && time >= grip.start - SYNTHETIC_LEAD && time < grip.end)) {
      trackWorld(box, time, out)

      return 'synthetic'
    }

    const { current, previous } = spanAt(parenting.spans.get(box.id), time, lookup)

    if (current && current.kind !== 'track' && rigidWorld(box, current, time, out)) {
      resync(box.id, streams.boxKeys?.[box.id], time, current, out)

      return current.kind
    }

    trackWorld(box, time, out)

    if (previous?.kind === 'arm' && time - previous.end < RELEASE_BLEND && rigidWorld(box, previous, previous.end, released)) {
      blend(out, released, (time - previous.end) / RELEASE_BLEND)
    }

    return 'track'
  }

  return {
    world(box, time, out) {
      resolve()

      const hit = cache.get(box.id)

      if (hit && hit.time === time) {
        out.copy(hit.matrix)

        return hit.mode
      }

      const mode = compute(box, time, out)

      if (hit) {
        hit.time = time

        hit.mode = mode

        hit.matrix.copy(out)
      } else {
        cache.set(box.id, { time, mode, matrix: out.clone() })
      }

      return mode
    },
  }
}
