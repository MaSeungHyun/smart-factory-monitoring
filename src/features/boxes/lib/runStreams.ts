import type { PlaybackRun } from '@/shared/types/playback'
import type { BoxKeyframe, LocalTransform, PalletEvent, RunEventStreams, SimQuat, SimRecording } from '@/shared/types/runEvents'

const PALLET_KIND = { create: 'spawn', move: 'move', ship: 'ship' } as const

const cache = new WeakMap<PlaybackRun, RunEventStreams>()

/** v2 keyframes are only emitted on a >= 1 cm / ~1 deg change; a gap longer than this means the box held still */
const HOLD_GAP = 1.05

const quatYaw = ([x, y, z, w]: SimQuat) => Math.atan2(2 * (w * y + x * z), 1 - 2 * (x * x + y * y))

/** v2: keyframe rows carry a world quaternion and pallet locals are relative to the pallet stream pose */
export function isRecordingV2(recording: SimRecording) {
  return !!recording.boxKeyframeEncoding || (recording.boxKeyframes ?? []).some((frame) => frame.boxes.some((row) => row.length >= 8))
}

function withHolds(keys: BoxKeyframe[]) {
  const out: BoxKeyframe[] = []

  for (const key of keys) {
    const last = out[out.length - 1]

    if (last && key[0] - last[0] > HOLD_GAP) out.push([key[0] - 1, ...last.slice(1)] as BoxKeyframe)

    out.push(key)
  }

  return out
}

/**
 * PROVISIONAL 어댑터: run.recording (robot_IK SimRecording v1) -> 내부 형식.
 * - 녹화 local 은 박스의 three.js 부모 기준이라 모니터링 노드와 같다는 보장이 없어 쓰지 않고,
 *   붙는 순간 월드를 유지하도록 다시 계산한다 (contacts 거리 0 이라 결과는 같음).
 * - parentId 가 null 인 부모(팔레트 등)는 찾을 수 없으므로 기록 월드(키프레임)를 따른다.
 */
function fromRecording(recording: SimRecording): RunEventStreams {
  const v2 = isRecordingV2(recording)

  const boxKeys: Record<string, BoxKeyframe[]> = {}

  for (const frame of [...(recording.boxKeyframes ?? [])].sort((a, b) => a.t - b.t)) {
    for (const row of frame.boxes) {
      const [id, x, y, z] = row

      const quat = row.length >= 8 ? (row.slice(4, 8) as SimQuat) : null

      ;(boxKeys[id] ??= []).push(quat ? [frame.t, x, y, z, quatYaw(quat), ...quat] : [frame.t, x, y, z, 0])
    }
  }

  if (v2) for (const id of Object.keys(boxKeys)) boxKeys[id] = withHolds(boxKeys[id])

  const palletEvents: PalletEvent[] = (recording.pallets ?? []).map(([t, id, kind, , position, yaw]) => ({
    t,
    id,
    kind: PALLET_KIND[kind],
    pose: position ? [position[0], position[1], position[2], yaw ?? 0] : undefined,
  }))

  return {
    gripEvents: (recording.suction ?? []).map(([t, robot, on, box]) => [t, robot, on ? 1 : 0, box]),
    // v2 pallet locals are pallet-pose relative (match EventPallets groups); other kinds stay three.js-parent relative, so recompute
    boxParents: (recording.boxParents ?? []).map(([t, box, kind, parentId, position, quaternion]) => [
      t,
      box,
      parentId ? kind : 'world',
      parentId,
      v2 && kind === 'pallet' && parentId && position && quaternion ? ([...position, ...quaternion] as LocalTransform) : null,
    ]),
    boxKeys,
    // 위치가 하나도 없으면 레거시 팔레트 재구성(RailPallets)을 쓴다
    palletEvents: palletEvents.some((event) => event.pose) ? palletEvents : undefined,
    armElevated: true,
    palletLocal: v2,
  }
}

export function readStreams(run: PlaybackRun): RunEventStreams {
  let streams = cache.get(run)

  if (!streams) {
    streams = run.recording?.version === 1 ? fromRecording(run.recording) : {}

    cache.set(run, streams)
  }

  return streams
}
