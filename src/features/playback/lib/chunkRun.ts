import { buildPartTracks } from '@/shared/lib/animatedParts/partTimeline'
import { unwrapDegrees } from '@/shared/lib/angles'
import type { EquipmentStateSample, PlaybackRun, PoseSample, RunCounts, StatusFrame } from '@/shared/types/playback'
import type { RunAggregates, RunChunk, RunManifest } from '@/shared/types/runChunk'
import type { ChunkSnapshotBox } from '@/shared/types/runChunk'
import type { SimBoxKeyframe, SimBoxParentEvent, SimPalletEvent, SimQuat, SimRecording, SimSuctionEvent, SimVec3 } from '@/shared/types/runEvents'

import { boxesFromRecording } from './chunkBoxes'
import { injectEquipmentFaults } from './injectEquipmentFaults'
import { buildKpiTrack } from './kpi'

const DEG = Math.PI / 180

const round = (value: number) => Math.round(value * 1000) / 1000

// [1] 녹화 시간 이동 + 시작 스냅샷을 청크 시작 시각 이벤트로 넣기

/** 청크 (또는 이어 붙인 청크 구간) 시작 스냅샷의 재생 시각. 첫 청크면 0 */
const startOf = (chunk: RunChunk, offset: number) => Math.max(round(chunk.meta.t0 - offset), 0)

/** 스냅샷 박스의 부모 local 회전은 없으므로 같은 부모의 다음 이벤트 회전을 빌린다 */
function snapshotParents(chunk: RunChunk, events: SimBoxParentEvent[], start: number): SimBoxParentEvent[] {
  const later = new Map<string, SimBoxParentEvent>()

  for (const event of events) if (!later.has(event[1])) later.set(event[1], event)

  return chunk.snapshot.boxes.map((row) => {
    const [id, kind, parentId, x, y, z] = row

    // v2: 팔레트 위 박스는 팔레트 포즈 기준 local (cm) + local 쿼터니언이 붙어 있다
    if (kind === 'pallet' && row.length >= 17) {
      const local = row.slice(10, 17) as number[]

      return [start, id, 'pallet', parentId, local.slice(0, 3).map((v) => v / 100) as SimVec3, local.slice(3, 7) as SimQuat]
    }

    const next = later.get(id)

    const quat = next && next[3] === parentId ? next[5] : ([0, 0, 0, 1] as SimBoxParentEvent[5])

    return [start, id, kind as SimBoxParentEvent[2], parentId, [x / 100, y / 100, z / 100], quat]
  })
}

/** 스냅샷 박스 -> t=0 키프레임 행 (v2 는 world 쿼터니언 포함) */
function snapshotKeyRow(row: ChunkSnapshotBox): SimBoxKeyframe['boxes'][number] {
  const [id, , , x, y, z] = row

  if (row.length >= 10) return [id, x / 100, y / 100, z / 100, row[6] as number, row[7] as number, row[8] as number, row[9] as number]

  return [id, x / 100, y / 100, z / 100]
}

function snapshotPallets(chunk: RunChunk, start: number): SimPalletEvent[] {
  return chunk.snapshot.pallets.map(([id, state, , , pos, yaw, carrierKey]) => {
    // inbound (IN-xxxx) pallets have no carrier key
    const [kind, carrier] = (carrierKey ?? '').split('|')

    const carried = kind && kind !== 'null'

    return [start, id, 'create', state, pos, yaw, carried ? (kind as SimPalletEvent[6]) : null, carried && carrier !== 'null' ? carrier : null]
  })
}

function shiftRecording(chunk: RunChunk, offset: number, duration: number): SimRecording {
  const source = chunk.recording

  const at = (t: number) => round(t - offset)

  const start = startOf(chunk, offset)

  const boxParents = source.boxParents.map((event): SimBoxParentEvent => [at(event[0]), ...event.slice(1)] as SimBoxParentEvent)

  const suction: SimSuctionEvent[] = Object.entries(chunk.snapshot.suction)
    .filter(([, box]) => box)
    .map(([robot, box]) => [start, robot, true, box])

  return {
    ...source,
    seconds: duration,
    suction: [...suction, ...source.suction.map((event): SimSuctionEvent => [at(event[0]), event[1], event[2], event[3]])],
    contacts: source.contacts.map((contact) => ({ ...contact, t: at(contact.t) })),
    boxParents: [...snapshotParents(chunk, boxParents, start), ...boxParents],
    boxKeyframes: [
      { t: start, boxes: chunk.snapshot.boxes.map(snapshotKeyRow) },
      ...source.boxKeyframes.map((frame) => ({ ...frame, t: at(frame.t) })),
    ],
    pallets: [...snapshotPallets(chunk, start), ...source.pallets.map((event) => [at(event[0]), ...event.slice(1)] as SimPalletEvent)],
    palletParents: source.palletParents?.map((event) => [at(event[0]), event[1], event[2], event[3]]),
  }
}

// [2] 트랙 (관절 0.1 deg -> deg, AMR cm / 0.1 deg -> m / rad)

function convertTracks(chunk: RunChunk, offset: number): PlaybackRun['tracks'] {
  const joints: Record<string, number[][]> = {}

  for (const [id, frames] of Object.entries(chunk.tracks.joints)) {
    joints[id] = frames.map((frame) => frame.map((value) => value / 10))

    unwrapDegrees(joints[id])
  }

  const poses: Record<string, PoseSample[]> = {}

  for (const [id, frames] of Object.entries(chunk.tracks.amrs)) {
    poses[id] = frames.map((frame) => (frame ? [frame[0] / 100, 0, frame[1] / 100, (frame[2] / 10) * DEG] : null))
  }

  return { t: chunk.tracks.t.map((t) => round(t - offset)), poses, joints }
}

// [3] 상태 (변화분 행 -> 전체 행, 집계 가동률 보충)

const ZERO_COUNTS: RunCounts = { handled: 0, inbound: 0, placed: 0, passed: 0, palletsShipped: 0, outbound: 0, defects: 0, wip: 0 }

function utilizationOf(aggregates: RunAggregates | undefined, time: number) {
  const minute = aggregates?.perMinute[Math.min(Math.floor(time / 60), aggregates.perMinute.length - 1)]

  return minute?.robots
}

function expandStatus(chunk: RunChunk, offset: number, aggregates?: RunAggregates): StatusFrame[] {
  // 뒤 청크는 상태 행이 변화분이어도 스냅샷 누계에서 이어진다
  let counts: Record<string, number> = { ...ZERO_COUNTS, ...((chunk.snapshot.counts ?? {}) as Record<string, number>) }

  let equipment: Record<string, EquipmentStateSample> = {}

  return chunk.status.map((row) => {
    const t = round(row.t - offset)

    counts = { ...counts, ...(row.counts as Record<string, number>) }

    counts.handled = (counts.placed ?? 0) + (counts.depalletized ?? 0)

    equipment = { ...equipment, ...(row.equipment as Record<string, EquipmentStateSample>) }

    const robots = utilizationOf(aggregates, t)

    const frame: Record<string, EquipmentStateSample> = { ...equipment }

    // aggregates 분당 가동률을 상태 샘플에 심는다 (장비 행에 없어도 OEE 평균에 쓰이도록)
    for (const [id, robot] of Object.entries(robots ?? {})) {
      const utilization = robot.util <= 1 ? robot.util * 100 : robot.util

      const sample = frame[id]

      frame[id] = sample
        ? sample.utilization === undefined
          ? { ...sample, utilization }
          : sample
        : { state: (robot.state as EquipmentStateSample['state']) ?? 'idle', label: '', count: robot.cycles ?? 0, utilization }
    }

    return { t, counts: counts as unknown as RunCounts, equipment: frame }
  })
}

// [4] 조립

/** manifest + 청크 1개 또는 mergeChunks 로 이어 붙인 구간 (+ 집계) -> 기존 PlaybackRun. 시간은 청크가 아니라 run 기준 (offset 제거) */
export function chunkToRun(manifest: RunManifest, chunk: RunChunk, aggregates?: RunAggregates): PlaybackRun {
  const offset = manifest.simTimeOffset

  const tracks = convertTracks(chunk, offset)

  const recording = shiftRecording(chunk, offset, manifest.duration)

  return injectEquipmentFaults({
    meta: {
      source: `robot_IK headless ${manifest.runId}`,
      template: manifest.template ?? '',
      capturedAt: manifest.runId,
      duration: manifest.duration,
      poseHz: chunk.meta.poseHz,
      statusHz: chunk.meta.statusHz,
      jointNames: manifest.jointNames,
      simTimeOffset: offset,
    },
    equipment: manifest.equipment.map(({ id, kind, name }) => ({ id, kind, name })),
    tracks,
    status: expandStatus(chunk, offset, aggregates),
    events: chunk.events.map((event) => ({ ...event, t: round(event.t - offset), from: event.from ?? event.to })),
    alarms: (chunk.alarms ?? []).map((alarm) => ({ ...alarm, t: round(alarm.t - offset), until: alarm.until === undefined ? undefined : round(alarm.until - offset) })) as PlaybackRun['alarms'],
    recording,
    boxes: boxesFromRecording(recording, tracks.t),
    aggregates,
    racks: chunk.snapshot.racks,
    parts: manifest.animatedParts ? buildPartTracks(manifest.animatedParts, chunk.snapshot.parts, chunk.tracks.parts, offset, startOf(chunk, offset)) : undefined,
    kpi: buildKpiTrack(chunk.tracks.kpi, chunk.snapshot.kpi, offset, manifest.kpiSchema),
  })
}
