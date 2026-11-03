import { samplePose } from '@/features/playback/lib/samplePose'
import type { PlaybackRun } from '@/shared/types/playback'
import type { PalletEvent } from '@/shared/types/runEvents'

import { CARRY_TURN_EPS, CARRY_TURN_PROBE } from '../constants/carry'
import { palletEventAt, palletPoseAt } from './palletTracks'

/** 차량 yaw 좌표계 기준 팔레트 오프셋 [x, z, yaw] */
type CarryLocal = [x: number, z: number, yaw: number]

/**
 * 차량(AMR · 지게차)에 실린 팔레트 포즈. 매 프레임 차량 현재 포즈(PlaybackDriver 와 같은 samplePose) x 고정 local 로
 * 강체 추종한다. local 은 각 이벤트 시각의 차량 포즈 기준으로 잠그고, 같은 차량의 다음 이벤트 local 까지 보간한다
 * (주행 중엔 일정 -> 강체, 포크 신축만 반영). y 는 기록 스트림(리프트 높이). 상태 없음 -> 탐색 · 청크 경계 안전
 */
export function createCarriedPallets(run: PlaybackRun) {
  const locals = new WeakMap<PalletEvent, CarryLocal | null>()

  /** 차량이 이 시각 제자리 회전 중인가 (10 Hz 샘플 사이에 돌아 팔레트 기록과 yaw 가 어긋남) */
  function turning(track: PlaybackRun['tracks']['poses'][string], time: number) {
    const a = samplePose(track, run.tracks.t, time - CARRY_TURN_PROBE)

    const b = samplePose(track, run.tracks.t, time + CARRY_TURN_PROBE)

    if (!a || !b) return false

    return Math.abs(Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw))) > CARRY_TURN_EPS
  }

  function localOf(events: PalletEvent[], index: number): CarryLocal | null {
    const event = events[index]

    const cached = locals.get(event)

    if (cached !== undefined) return cached

    const track = event.parentId ? run.tracks.poses[event.parentId] : undefined

    const carrier = track && event.pose ? samplePose(track, run.tracks.t, event.t) : null

    let local: CarryLocal | null = null

    const previous = events[index - 1]

    // 회전 중 기록은 같은 차량의 직전 오프셋을 그대로 쓴다 (IN-0193 / amr-65 @ t 7258.85 에서 1.4 m 튐)
    if (track && previous?.parentId === event.parentId && turning(track, event.t)) local = localOf(events, index - 1)
    else if (carrier && event.pose) {
      const dx = event.pose[0] - carrier.x

      const dz = event.pose[2] - carrier.z

      const cos = Math.cos(carrier.yaw)

      const sin = Math.sin(carrier.yaw)

      local = [dx * cos - dz * sin, dx * sin + dz * cos, event.pose[3] - carrier.yaw]
    }

    locals.set(event, local)

    return local
  }

  /** palletPoseAt 과 같은 out [x, y, z, yaw]. 차량에 안 실렸으면 스트림 포즈 */
  return function carriedPoseAt(events: PalletEvent[], time: number, out: number[]) {
    if (!palletPoseAt(events, time, out)) return false

    const index = palletEventAt(events, time)

    const event = events[index]

    const track = event.parentId ? run.tracks.poses[event.parentId] : undefined

    const local = track ? localOf(events, index) : null

    const carrier = local && track ? samplePose(track, run.tracks.t, time) : null

    if (!local || !carrier) return true

    const next = events[index + 1]

    const nextLocal = next && next.kind === 'move' && next.parentId === event.parentId ? localOf(events, index + 1) : null

    const k = nextLocal && next.t > event.t ? Math.min(Math.max((time - event.t) / (next.t - event.t), 0), 1) : 0

    const lx = nextLocal ? local[0] + (nextLocal[0] - local[0]) * k : local[0]

    const lz = nextLocal ? local[1] + (nextLocal[1] - local[1]) * k : local[1]

    const cos = Math.cos(carrier.yaw)

    const sin = Math.sin(carrier.yaw)

    out[0] = carrier.x + lx * cos + lz * sin

    out[2] = carrier.z - lx * sin + lz * cos

    out[3] = carrier.yaw + local[2]

    return true
  }
}