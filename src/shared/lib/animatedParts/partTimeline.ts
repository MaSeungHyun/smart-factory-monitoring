import type { AnimatedPart, AnimatedPartQuat, AnimatedPartRow, AnimatedPartTrack, AnimatedPartValue } from '@/shared/types/animatedParts'

/** 기록은 10Hz. 이보다 긴 간격은 값이 머물러 있던 구간이라 보간하지 않는다 */
const MAX_LERP_GAP = 0.15

// [1] 트랙 만들기

/** snapshot.parts + tracks.parts -> 파츠별 트랙. offset 을 빼서 재생 시간으로 맞춘다. start = 스냅샷 시각 (재생 시간) */
export function buildPartTracks(
  parts: AnimatedPart[],
  snapshot: (AnimatedPartValue | null)[] | undefined,
  rows: AnimatedPartRow[] | undefined,
  offset: number,
  start = 0,
): AnimatedPartTrack[] {
  const tracks = parts.map((part): AnimatedPartTrack => ({ part, t: [start], values: [snapshot?.[part.i] ?? null] }))

  const byIndex = new Map(tracks.map((track) => [track.part.i, track]))

  for (const [t, i, value] of rows ?? []) {
    const track = byIndex.get(i)

    if (!track) continue

    const time = Math.max(Math.round((t - offset) * 1000) / 1000, start)

    if (time === track.t[track.t.length - 1]) track.values[track.values.length - 1] = value
    else {
      track.t.push(time)

      track.values.push(value)
    }
  }

  return tracks
}

// [2] 샘플링 (이진 탐색 + lerp / slerp)

/** t[index] <= time 인 마지막 index */
export function partIndexAt(t: number[], time: number) {
  let lo = 0

  let hi = t.length - 1

  if (time <= t[0]) return 0

  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1

    if (t[mid] <= time) lo = mid
    else hi = mid - 1
  }

  return lo
}

function slerp(a: AnimatedPartQuat, b: AnimatedPartQuat, k: number, out: AnimatedPartQuat) {
  let [bx, by, bz, bw] = b

  let dot = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw

  if (dot < 0) {
    bx = -bx
    by = -by
    bz = -bz
    bw = -bw
    dot = -dot
  }

  let wa = 1 - k

  let wb = k

  if (dot < 0.9995) {
    const theta = Math.acos(Math.min(dot, 1))

    const sin = Math.sin(theta)

    wa = Math.sin((1 - k) * theta) / sin

    wb = Math.sin(k * theta) / sin
  }

  out[0] = a[0] * wa + bx * wb
  out[1] = a[1] * wa + by * wb
  out[2] = a[2] * wa + bz * wb
  out[3] = a[3] * wa + bw * wb

  const length = Math.hypot(out[0], out[1], out[2], out[3]) || 1

  for (let n = 0; n < 4; n += 1) out[n] /= length

  return out
}

const scratch: AnimatedPartQuat = [0, 0, 0, 1]

/** time 의 값. quat 은 공유 버퍼를 돌려주므로 바로 써야 한다 */
export function samplePart(track: AnimatedPartTrack, time: number): AnimatedPartValue | null {
  const index = partIndexAt(track.t, time)

  const a = track.values[index]

  const next = index + 1

  if (a === null || next >= track.t.length) return a

  const b = track.values[next]

  const span = track.t[next] - track.t[index]

  if (b === null || span <= 0 || span > MAX_LERP_GAP) return a

  const k = Math.min(Math.max((time - track.t[index]) / span, 0), 1)

  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k

  if (Array.isArray(a) && Array.isArray(b)) return slerp(a, b, k, scratch)

  return a
}