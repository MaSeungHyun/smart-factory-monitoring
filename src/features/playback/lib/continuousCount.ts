import type { StatusFrame } from '@/shared/types/playback'

/** 앞뒤로 찾아볼 최대 상태 프레임 수 (2Hz 기준 약 1분) */
const SCAN_LIMIT = 120

/** t 이하 마지막 상태 프레임 index (없으면 0) */
function frameIndexAt(frames: StatusFrame[], t: number) {
  let low = 0

  let high = frames.length - 1

  while (low < high) {
    const mid = (low + high + 1) >> 1

    if (frames[mid].t <= t) low = mid
    else high = mid - 1
  }

  return low
}

/**
 * 계단처럼 +1 씩 바뀌는 누적 수량을 재생 시각으로 선형 보간.
 * 현재 값이 처음 나온 프레임 → 다음 값이 나오는 프레임 사이를 t 비율만큼 채운다.
 * (값이 실제로 바뀌는 순간에 다음 값에 도달하므로 최대 한 단계 늦게 보인다)
 */
export function continuousCount(frames: StatusFrame[], t: number, pick: (frame: StatusFrame) => number) {
  if (!frames.length) return 0

  const index = frameIndexAt(frames, t)

  const value = pick(frames[index])

  let start = index

  while (start > 0 && index - start < SCAN_LIMIT && pick(frames[start - 1]) === value) start -= 1

  let next = index + 1

  while (next < frames.length && next - index < SCAN_LIMIT && pick(frames[next]) === value) next += 1

  if (next >= frames.length || pick(frames[next]) === value) return value

  const nextValue = pick(frames[next])

  // 누적 수량은 줄어들지 않는다. 다음 값이 더 작으면 보간하지 않고 현재 값 유지
  if (nextValue < value) return value

  const span = frames[next].t - frames[start].t

  if (span <= 0) return value

  const ratio = Math.min(Math.max((t - frames[start].t) / span, 0), 1)

  return value + (nextValue - value) * ratio
}