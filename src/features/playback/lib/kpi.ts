import type { KpiRow, KpiSample, KpiSchema, KpiTrack } from '@/shared/types/kpi'

import { indexAt } from './frameAt'

// [1] 청크 -> 트랙 (재생 시간 기준)

/** 스냅샷 샘플 + 1Hz 행 -> 재생 시각 트랙. KPI 가 없는 예전 녹화면 undefined */
export function buildKpiTrack(
  rows: KpiRow[] | undefined,
  snapshot: KpiSample | undefined,
  offset: number,
  schema?: KpiSchema,
): KpiTrack | undefined {
  if (!rows?.length && !snapshot) return undefined

  const t: number[] = []

  const samples: KpiSample[] = []

  const push = (time: number, sample: KpiSample) => {
    const at = Math.round((time - offset) * 1000) / 1000

    // 청크 경계 중복 / 역행은 버린다
    if (t.length && at <= t[t.length - 1]) return

    t.push(at)

    samples.push(sample)
  }

  if (snapshot) push(snapshot.t, snapshot)

  for (const [time, sample] of rows ?? []) push(time, sample)

  return { t, samples, schema }
}

// [2] 시각 -> 샘플

/** 숫자 잎은 선형 보간, 문자열 · null · 한쪽에만 있는 값은 앞 샘플 것 */
function lerpDeep(a: unknown, b: unknown, k: number): unknown {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * k

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const out: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(a)) out[key] = lerpDeep(value, (b as Record<string, unknown>)[key], k)

    return out
  }

  return a
}

/** 재생 시각의 직전 샘플 (보간 없음, 4Hz 캐시 키 등) */
export function kpiIndexAt(track: KpiTrack, time: number) {
  return indexAt(track.t, time)
}

/** 재생 시각의 KPI. 1Hz 샘플 사이를 보간해 매 프레임 연속으로 읽을 수 있다 */
export function kpiAt(track: KpiTrack | undefined, time: number): KpiSample | null {
  if (!track?.samples.length) return null

  const index = indexAt(track.t, time)

  if (index < 0) return track.samples[0]

  const next = index + 1

  if (next >= track.samples.length) return track.samples[index]

  const t0 = track.t[index]

  const t1 = track.t[next]

  const k = t1 > t0 ? Math.min(1, Math.max(0, (time - t0) / (t1 - t0))) : 0

  return k === 0 ? track.samples[index] : (lerpDeep(track.samples[index], track.samples[next], k) as KpiSample)
}

// [3] 점 경로 읽기

/** 'stages.palletize.count' 같은 스키마 키로 값 읽기 */
export function kpiValue(sample: KpiSample | null | undefined, key: string): unknown {
  let node: unknown = sample

  for (const part of key.split('.')) {
    if (!node || typeof node !== 'object') return undefined

    node = (node as Record<string, unknown>)[part]
  }

  return node
}

/** 숫자 키 읽기. 없거나 null 이면 undefined (호출 쪽 기존 값으로 대체) */
export function kpiNumber(sample: KpiSample | null | undefined, key: string): number | undefined {
  const value = kpiValue(sample, key)

  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}
