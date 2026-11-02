import type { BoxOwnerSegment, BoxReject, BoxTrack, PlaybackRun } from '@/shared/types/playback'

import { createContactFinder } from './gripContact'

export interface DecodedGrip {
  start: number
  /** 기록상 그립 시작 (접촉 탐색 시작점). start 는 상태 기반 접촉 시각 */
  claimed: number
  end: number
  robot: string
  synthetic: boolean
}

/** 재생용으로 풀어 둔 박스 트랙 (단위 m, rad) */
export interface DecodedBox {
  id: string
  start: number
  end: number
  src: string | null
  defectAt: number
  /** 스캐너 판정 사유. 불량이 아니면 null */
  defectReason: string | null
  own: BoxOwnerSegment[]
  grips: DecodedGrip[]
  reject: BoxReject | null
  /** 키프레임 시각 s */
  times: Float32Array
  /** 키프레임마다 x, y, z, yaw */
  poses: Float32Array
}

function defectReason(run: PlaybackRun, box: BoxTrack) {
  const defect = box.defect

  if (!defect) return null

  const alarm = run.alarms.find(
    (item) => item.equipmentId === defect.by && item.message.includes('불량 감지') && Math.abs(item.t - defect.t) < 8,
  )

  return alarm?.message.match(/\(([^)]+)\)/)?.[1] ?? null
}

export function decodeBoxes(run: PlaybackRun): DecodedBox[] {
  const frameTimes = run.tracks.t

  const contactAfter = createContactFinder(run)

  return (run.boxes ?? []).map((box) => {
    const times = new Float32Array(box.k.length)

    const poses = new Float32Array(box.k.length * 4)

    let frame = box.f0

    box.k.forEach((step, index) => {
      frame += step

      times[index] = frameTimes[Math.min(frame, frameTimes.length - 1)]

      poses[index * 4] = box.p[index * 4] / 100

      poses[index * 4 + 1] = box.p[index * 4 + 1] / 100

      poses[index * 4 + 2] = box.p[index * 4 + 2] / 100

      poses[index * 4 + 3] = box.p[index * 4 + 3] / 100
    })

    return {
      id: box.id,
      start: box.t0,
      end: box.t1 ?? Infinity,
      src: box.src,
      defectAt: box.defect?.t ?? Infinity,
      defectReason: defectReason(run, box),
      own: box.own,
      grips: (box.grip ?? []).map(([start, end, robot, synthetic]) => ({
        start: synthetic === 1 ? start : contactAfter(robot, start, end),
        claimed: start,
        end,
        robot,
        synthetic: synthetic === 1,
      })),
      reject: box.reject ?? null,
      times,
      poses,
    }
  })
}
