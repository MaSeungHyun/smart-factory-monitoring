import type { PlaybackRun } from '@/shared/types/playback'
import type { BoxKeyframe, PalletEvent, RunEventStreams, SimRecording } from '@/shared/types/runEvents'

const PALLET_KIND = { create: 'spawn', move: 'move', ship: 'ship' } as const

const cache = new WeakMap<PlaybackRun, RunEventStreams>()

/**
 * PROVISIONAL 어댑터: run.recording (robot_IK SimRecording v1) -> 내부 형식.
 * - 녹화 local 은 박스의 three.js 부모 기준이라 모니터링 노드와 같다는 보장이 없어 쓰지 않고,
 *   붙는 순간 월드를 유지하도록 다시 계산한다 (contacts 거리 0 이라 결과는 같음).
 * - parentId 가 null 인 부모(팔레트 등)는 찾을 수 없으므로 기록 월드(키프레임)를 따른다.
 */
function fromRecording(recording: SimRecording): RunEventStreams {
  const boxKeys: Record<string, BoxKeyframe[]> = {}

  for (const frame of recording.boxKeyframes ?? []) {
    for (const [id, x, y, z] of frame.boxes) (boxKeys[id] ??= []).push([frame.t, x, y, z, 0])
  }

  const palletEvents: PalletEvent[] = (recording.pallets ?? []).map(([t, id, kind, , position, yaw]) => ({
    t,
    id,
    kind: PALLET_KIND[kind],
    pose: position ? [position[0], position[1], position[2], yaw ?? 0] : undefined,
  }))

  return {
    gripEvents: (recording.suction ?? []).map(([t, robot, on, box]) => [t, robot, on ? 1 : 0, box]),
    boxParents: (recording.boxParents ?? []).map(([t, box, kind, parentId]) => [t, box, parentId ? kind : 'world', parentId, null]),
    boxKeys,
    // 위치가 하나도 없으면 레거시 팔레트 재구성(RailPallets)을 쓴다
    palletEvents: palletEvents.some((event) => event.pose) ? palletEvents : undefined,
    armElevated: true,
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
