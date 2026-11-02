import { Matrix4, Quaternion, Vector3 } from 'three'

import type { BoxParentKind, BoxParentEvent, GripEvent, LocalTransform, RunEventStreams } from '@/shared/types/runEvents'

import type { DecodedBox } from './decodeBoxes'

/** track: 기록 월드(컨베이어·레일·바닥). 나머지는 부모 matrixWorld x local 강체 */
export type SpanKind = 'track' | 'arm' | 'amr' | 'pallet'

export interface ParentSpan {
  start: number
  end: number
  kind: SpanKind
  parentId: string | null
  /** 부모 기준 로컬 행렬. null 이면 붙는 순간의 월드를 유지하도록 계산해 채운다 */
  local: Matrix4 | null
  /** 레거시 그립: from 부터 그리퍼가 박스에 닿는 시각을 FK 로 찾는다. 못 찾으면 fallback */
  window: { from: number; fallback: number } | null
}

/** boxId 없는 grip 이벤트: 그 순간 그리퍼에 가장 가까운 박스에 붙인다 */
export interface PendingGrip {
  robot: string
  start: number
  end: number
}

export interface Parenting {
  spans: Map<string, ParentSpan[]>
  pending: PendingGrip[]
}

const KIND: Record<BoxParentKind, SpanKind> = {
  conveyor: 'track',
  rack: 'track',
  dock: 'track',
  world: 'track',
  rail: 'track',
  none: 'track',
  arm: 'arm',
  amr: 'amr',
  pallet: 'pallet',
}

export function localMatrix(local: LocalTransform) {
  return new Matrix4().compose(
    new Vector3(local[0], local[1], local[2]),
    new Quaternion(local[3], local[4], local[5], local[6]).normalize(),
    new Vector3(1, 1, 1),
  )
}

export function insertSpan(spans: Map<string, ParentSpan[]>, id: string, span: ParentSpan) {
  const list = spans.get(id) ?? []

  list.push(span)

  list.sort((a, b) => a.start - b.start)

  spans.set(id, list)
}

function fromParentEvents(boxes: DecodedBox[], events: BoxParentEvent[]) {
  const ends = new Map(boxes.map((box) => [box.id, box.end]))

  const spans = new Map<string, ParentSpan[]>()

  for (const [t, id, kind, parentId, local] of [...events].sort((a, b) => a[0] - b[0])) {
    const list = spans.get(id) ?? []

    const previous = list[list.length - 1]

    if (previous) previous.end = t

    list.push({ start: t, end: ends.get(id) ?? Infinity, kind: KIND[kind] ?? 'track', parentId, local: local ? localMatrix(local) : null, window: null })

    spans.set(id, list)
  }

  return spans
}

function fromGripEvents(events: GripEvent[]): Parenting {
  const spans = new Map<string, ParentSpan[]>()

  const pending: PendingGrip[] = []

  const open = new Map<string, { t: number; box: string | null }>()

  const close = (robot: string, end: number) => {
    const grip = open.get(robot)

    if (!grip) return

    open.delete(robot)

    if (grip.box) insertSpan(spans, grip.box, { start: grip.t, end, kind: 'arm', parentId: robot, local: null, window: null })
    else pending.push({ robot, start: grip.t, end })
  }

  for (const [t, robot, on, box] of [...events].sort((a, b) => a[0] - b[0])) {
    close(robot, t)

    if (on === 1) open.set(robot, { t, box })
  }

  for (const robot of [...open.keys()]) close(robot, Infinity)

  return { spans, pending }
}

function fromLegacyGrips(boxes: DecodedBox[]) {
  const spans = new Map<string, ParentSpan[]>()

  for (const box of boxes) {
    for (const grip of box.grips) {
      if (grip.synthetic) continue

      insertSpan(spans, box.id, {
        start: grip.start,
        end: grip.end,
        kind: 'arm',
        parentId: grip.robot,
        local: null,
        window: { from: grip.claimed, fallback: grip.start },
      })
    }
  }

  return spans
}

/** 우선순위: boxParents 이벤트 > grip 이벤트 > 기존 boxes[].grip */
export function buildParentSpans(boxes: DecodedBox[], streams: RunEventStreams): Parenting {
  if (streams.boxParents?.length) return { spans: fromParentEvents(boxes, streams.boxParents), pending: [] }

  if (streams.gripEvents?.length) return fromGripEvents(streams.gripEvents)

  return { spans: fromLegacyGrips(boxes), pending: [] }
}

export interface SpanLookup {
  /** time 을 포함하는 구간 */
  current: ParentSpan | null
  /** 그 직전 구간 (놓은 직후 블렌드용) */
  previous: ParentSpan | null
}

/** 이진 탐색: 재생·시크 모두 O(log n) */
export function spanAt(spans: ParentSpan[] | undefined, time: number, out: SpanLookup) {
  out.current = null

  out.previous = null

  if (!spans?.length || time < spans[0].start) return out

  let low = 0

  let high = spans.length - 1

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (spans[mid].start <= time) low = mid
    else high = mid - 1
  }

  const span = spans[low]

  if (time < span.end) {
    out.current = span

    out.previous = spans[low - 1] ?? null
  } else {
    out.previous = span
  }

  return out
}
