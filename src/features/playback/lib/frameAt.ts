import type { StatusFrame } from '@/shared/types/playback'

/** 정렬된 times 에서 t 이하 마지막 index (없으면 0) */
export function indexAt(times: ArrayLike<number>, t: number) {
  let low = 0

  let high = times.length - 1

  if (high < 0 || t <= times[0]) return 0

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (times[mid] <= t) low = mid
    else high = mid - 1
  }

  return low
}

export function statusAt(frames: StatusFrame[], t: number) {
  if (!frames.length) return null

  let low = 0

  let high = frames.length - 1

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (frames[mid].t <= t) low = mid
    else high = mid - 1
  }

  return frames[low]
}
