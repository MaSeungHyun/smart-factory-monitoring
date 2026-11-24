import { Euler, Matrix4, Quaternion, Vector3, type Object3D } from 'three'

import { wrapAngle } from '@/shared/lib/angles'
import { findGripPoint } from '@/shared/lib/three/findGripPoint'
import type { PlaybackRun } from '@/shared/types/playback'

import { createArmReach } from './armReach'
import { nearestAmrYaw } from './carryYaw'
import { createDriftResync, keyPoseAt, keyQuatAt } from './boxKeyframes'
import { buildParentSpans, insertSpan, localMatrix, spanAt, type ParentSpan, type SpanKind, type SpanLookup } from './boxParenting'
import { boxPoseAt } from './boxPoseAt'
import type { DecodedBox } from './decodeBoxes'
import { createCarriedPallets } from './carriedPallet'
import { BOX_FLIP_SNAP, CONVEYOR_ALIGN_MAX_TURN, CONVEYOR_HANDOFF_WINDOW, CONVEYOR_SETTLE_PROBE } from '../constants/conveyorHandoff'
import { PRE_ALIGN_TARGET_PROBE } from '../constants/preAlign'
import { isRailCarrier, palletEventAt, palletNodeName, palletTracks } from './palletTracks'
import { applyPreAlign, planPreAlign, yawOf, type PreAlignTurn } from './preAlign'
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

/** 박스 자기 Y축 반 바퀴 (직사각형 박스의 대칭 짝) */
const HALF_TURN = new Matrix4().makeRotationY(Math.PI)

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

  const carriedPoseAt = createCarriedPallets(run)

  const resync = createDriftResync()

  // v2: 팔레트 부모 = 스트림 포즈 T(pos) * Ry(yaw) * Rx(pitch) (EventPallets 와 같은 YXZ). 씬 노드 대신 스트림에서 바로 계산
  const pallets = streams.palletLocal && streams.palletEvents ? palletTracks(streams.palletEvents) : null

  const palletPose = [0, 0, 0, 0, 0]

  const palletEuler = new Euler(0, 0, 0, 'YXZ')

  const carrierLocals = new WeakMap<object, Matrix4>()

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

  /**
   * robot_IK 은 놓을 때 Object3D.attach 로 월드 자세를 그대로 둔다. 기록은 위치(1 Hz)만 있어서
   * 마지막 그립이 끝난 순간의 회전을 그대로 들고 간다 (AMR 위에 있으면 그 AMR 이 돈 만큼만 더한다).
   */
  const releasedRotations = new Map<ParentSpan, { rotation: Quaternion; x: number; z: number; amrYaw: number | null } | null>()

  function lastArm(box: DecodedBox, time: number) {
    let found: ParentSpan | null = null

    for (const span of parenting.spans.get(box.id) ?? []) {
      if (span.start > time) break

      if (span.kind === 'arm' && span.end <= time + 1e-6) found = span
    }

    return found
  }

  function releasedRotation(box: DecodedBox, span: ParentSpan) {
    if (releasedRotations.has(span)) return releasedRotations.get(span) ?? null

    releasedRotations.set(span, null)

    const matrix = new Matrix4()

    if (!rigidWorld(box, span, span.end, matrix)) {
      releasedRotations.delete(span)

      return null
    }

    const at = new Vector3()

    const held = { rotation: new Quaternion(), x: 0, z: 0, amrYaw: null as number | null }

    matrix.decompose(at, held.rotation, new Vector3())

    held.x = at.x

    held.z = at.z

    held.amrYaw = nearestAmrYaw(at.x, at.z, span.end)

    releasedRotations.set(span, held)

    return held
  }

  const carried = new Quaternion()

  function heldRotation(box: DecodedBox, time: number, x: number, z: number, out: Quaternion) {
    const span = lastArm(box, time)

    const held = span ? releasedRotation(box, span) : null

    if (!held) return false

    out.copy(held.rotation)

    const now = held.amrYaw === null ? null : nearestAmrYaw(x, z, time)

    if (held.amrYaw !== null && now !== null) out.premultiply(carried.setFromAxisAngle(UP, now - held.amrYaw))

    return true
  }

  function trackWorld(box: DecodedBox, time: number, out: Matrix4) {
    const keys = streams.boxKeys?.[box.id]

    // 놓인 회전을 먼저 캐시한다 (재귀 계산이 아래 pose/position 스크래치를 덮지 않게)
    const recorded = !!keys?.length && keyQuatAt(keys, time, targetRotation)

    const arm = recorded ? null : lastArm(box, time)

    const holding = !!arm && !!releasedRotation(box, arm)

    if (box.times.length) boxPoseAt(box, time, pose)
    else if (keys?.length) keyPoseAt(keys, time, pose)

    position.set(pose[0], pose[1], pose[2])

    if (recorded) rotation.copy(targetRotation)
    else if (holding) heldRotation(box, time, pose[0], pose[2], rotation)
    else rotation.setFromAxisAngle(UP, pose[3])

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

    if (span.kind === 'pallet' && pallets) {
      const list = pallets.get(span.parentId)

      if (list) {
        // AMR · 지게차에 실린 팔레트는 EventPallets 와 똑같이 차량 matrixWorld x local 로 강체 추종한다.
        // (2 Hz 팔레트 스트림 보간을 쓰면 차량 위치와 어긋나 박스가 뒤처진다)
        const event = list[palletEventAt(list, time)]

        const carrier = event?.parentId && event.local ? find(event.parentId) : null

        if (carrier && event?.local) {
          let local = carrierLocals.get(event)

          if (!local) carrierLocals.set(event, (local = localMatrix(event.local)))

          carrier.updateWorldMatrix(true, false)

          out.multiplyMatrices(carrier.matrixWorld, local)

          return true
        }

        // EventPallets 와 같은 함수 -> 팔레트와 적재 박스가 같은 시각 · 같은 차량 포즈로 한 덩어리로 움직인다
        if (!carriedPoseAt(list, time, palletPose)) return false

        position.set(palletPose[0], palletPose[1], palletPose[2])

        palletEuler.set(palletPose[4] ?? 0, palletPose[3], 0)

        rotation.setFromEuler(palletEuler)

        out.compose(position, rotation, ONE)

        return true
      }

      // 녹화에 없는 템플릿 불량 팔레트(pallet-70~72)는 아래 장비 노드로 붙인다
    }

    const object = find(
      span.kind !== 'pallet'
        ? span.parentId
        : pallets?.has(span.parentId ?? '')
          ? palletNodeName(span.parentId!)
          : span.parentId,
    )

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

  // ---- 컨베이어 투입 (팔 -> 입고 팔레트 -> 컨베이어)

  /** 팔 구간이 끝난 뒤 CONVEYOR_HANDOFF_WINDOW 안에 시작하는 기록 월드(컨베이어) 구간 */
  function landingOf(box: DecodedBox, arm: ParentSpan) {
    const list = parenting.spans.get(box.id) ?? []

    return list.find((next) => next.kind === 'track' && next.start >= arm.end - 1e-6 && next.start - arm.end <= CONVEYOR_HANDOFF_WINDOW) ?? null
  }

  const settled = new Quaternion()

  /** 컨베이어 투입이면 robot_IK 이 컨베이어에서 스냅한 뒤의 안착 각 (rad). 아니면 null */
  function conveyorYaw(box: DecodedBox, arm: ParentSpan) {
    const keys = streams.boxKeys?.[box.id]

    const landing = landingOf(box, arm)

    if (!landing || !keys?.length) return null

    return keyQuatAt(keys, Math.min(arm.end + CONVEYOR_SETTLE_PROBE, landing.end), settled) ? yawOf(settled) : null
  }

  const handoffChecked = new WeakSet<ParentSpan>()

  const handoffArm = new Matrix4()

  const handoffParent = new Matrix4()

  const handoffRotation = new Quaternion()

  /**
   * 놓자마자 기록 local 로 붙는 입고 팔레트 구간: 팔 끝 각과 반 바퀴 어긋나면 local 을 대칭 짝으로 바꾼다.
   * (컨베이어 각으로 미리 맞춰 놓은 박스가 팔레트 기록 local 로 잠깐 반 바퀴 튀지 않게)
   */
  function alignHandoff(box: DecodedBox, span: ParentSpan) {
    if (handoffChecked.has(span) || !span.local || span.kind === 'arm') return

    handoffChecked.add(span)

    const arm = armBefore(box, span)

    if (!arm || !landingOf(box, arm)) return

    const local = span.local

    // 로봇이 아직 씬에 없으면 다음 프레임에 다시 본다
    if (!rigidWorld(box, arm, arm.end, handoffArm) || !parentWorld(span, span.start, handoffParent)) {
      handoffChecked.delete(span)

      return
    }

    handoffArm.decompose(position, handoffRotation, scale)

    const armYaw = yawOf(handoffRotation)

    handoffParent.multiply(local).decompose(position, handoffRotation, scale)

    if (Math.abs(wrapAngle(yawOf(handoffRotation) - armYaw)) > BOX_FLIP_SNAP) local.multiply(HALF_TURN)
  }

  function ensureLocal(box: DecodedBox, span: ParentSpan, time: number) {
    alignHandoff(box, span)

    if (span.local) return span.local

    // 팔: grip on 순간. AMR·팔레트: 과거 부모 위치를 모르므로 처음 보는 순간
    const at = span.kind === 'arm' ? span.start : time

    const arm = span.kind !== 'arm' && time - span.start < 1 ? armBefore(box, span) : null

    if (!(arm && rigidWorld(box, arm, arm.end, source))) trackWorld(box, at, source)

    if (!parentWorld(span, at, parent)) return null

    span.local = new Matrix4().copy(parent).invert().multiply(source)

    return span.local
  }

  // ---- 팔레타이징 미리 맞춤 (robot_IK startBoxTurn 재현)

  const preAligns = new Map<ParentSpan, PreAlignTurn | null>()

  const placedRotation = new Quaternion()

  const heldEnd = new Quaternion()

  const gripWorld = new Matrix4()

  /** 팔 구간: 놓인 기록 각과 팔 기준 놓는 순간 각의 차이를, 베이스 정렬 뒤 흡착점 기준 회전으로 미리 돌린다 */
  function preAlignOf(box: DecodedBox, span: ParentSpan) {
    if (preAligns.has(span)) return preAligns.get(span) ?? null

    preAligns.set(span, null)

    const keys = streams.boxKeys?.[box.id]

    if (!span.parentId || !keys?.length || !keyQuatAt(keys, span.end + PRE_ALIGN_TARGET_PROBE, placedRotation)) return null

    if (!rigidRaw(box, span, span.end, source)) {
      preAligns.delete(span)

      return null
    }

    source.decompose(position, heldEnd, scale)

    const heldYaw = yawOf(heldEnd)

    const placedYaw = yawOf(placedRotation)

    let turn = wrapAngle(placedYaw - heldYaw)

    // 컨베이어 투입: 90° 동률에서 robot_IK 이 반대로 돌면 컨베이어가 박스를 반 바퀴 스냅한다.
    // 같은 크기만큼 컨베이어 안착 각 쪽으로 돌려 내려놓아, 놓은 뒤에는 돌지 않게 한다
    const landed = conveyorYaw(box, span)

    if (landed !== null && Math.abs(wrapAngle(landed - placedYaw)) > BOX_FLIP_SNAP) {
      const toConveyor = wrapAngle(landed - heldYaw)

      if (Math.abs(toConveyor) <= CONVEYOR_ALIGN_MAX_TURN) turn = toConveyor
    }

    const plan = planPreAlign(run, span.parentId, span.start, span.end, turn)

    preAligns.set(span, plan)

    return plan
  }

  function rigidWorld(box: DecodedBox, span: ParentSpan, time: number, out: Matrix4): boolean {
    const plan = span.kind === 'arm' ? preAlignOf(box, span) : null

    if (!rigidRaw(box, span, time, out)) return false

    if (plan) {
      gripWorld.copy(parent)

      applyPreAlign(plan, time, gripWorld, out)
    }

    return true
  }

  function rigidRaw(box: DecodedBox, span: ParentSpan, time: number, out: Matrix4): boolean {
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

  /** 이 시각 팔레트가 차량·조건 레일 위에 있으면 true (키프레임 드리프트 보정을 건너뛴다) */
  function onVehicle(span: ParentSpan, time: number) {
    const list = span.kind === 'pallet' && span.parentId ? pallets?.get(span.parentId) : undefined

    const event = list?.[palletEventAt(list, time)]

    // 차량·조건 레일 위에서는 1 Hz 키프레임으로 보정하지 않는다 (경사 구간에서 오프셋이 굳어 적재가 팔레트와 어긋나 흔들림)
    return !!event?.parentId && (!!run.tracks.poses[event.parentId] || isRailCarrier(event.parentId))
  }

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
      // 차량에 실린 팔레트 위 박스는 1 Hz 월드 키프레임으로 보정하지 않는다 (키 시각 오차가 오프셋으로 굳어 팔레트와 어긋남) -> 팔레트와 강체
      if (!onVehicle(current, time)) resync(box.id, streams.boxKeys?.[box.id], time, current, out)

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
