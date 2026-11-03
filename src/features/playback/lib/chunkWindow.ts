import type { PlaybackRun } from '@/shared/types/playback'
import type { RunAggregates, RunChunk, RunManifest } from '@/shared/types/runChunk'

import { chunkToRun } from './chunkRun'

/** 같은 시각에 들고 있을 청크 JSON 최대 개수 (창 2개 + 처음 청크 + 여유 1) */
const CACHE_LIMIT = 4

// [1] 청크 index

/** 재생 시간 (offset 제거) 이 들어 있는 청크 index */
export function chunkIndexAt(manifest: RunManifest, time: number) {
  const sim = time + manifest.simTimeOffset

  const index = manifest.chunks.findIndex((chunk) => sim >= chunk.t0 && sim < chunk.t1)

  return index >= 0 ? index : sim < manifest.chunks[0].t0 ? 0 : manifest.chunks.length - 1
}

/** time 이 든 청크와 바로 다음 청크 [first, last] */
export function windowAt(manifest: RunManifest, time: number): [number, number] {
  const index = chunkIndexAt(manifest, time)

  return [index, Math.min(index + 1, manifest.chunks.length - 1)]
}

// [2] 이어 붙이기

/** 연속된 청크들 -> 청크 하나. 스냅샷은 첫 청크 것, 트랙 / 상태 / 이벤트 / 녹화는 시간순으로 잇는다 */
export function mergeChunks(chunks: RunChunk[]): RunChunk {
  if (chunks.length === 1) return chunks[0]

  const [first] = chunks

  const last = chunks[chunks.length - 1]

  const t: number[] = []

  const joints: Record<string, number[][]> = {}

  const amrs: RunChunk['tracks']['amrs'] = {}

  const jointIds = new Set(chunks.flatMap((chunk) => Object.keys(chunk.tracks.joints)))

  const amrIds = new Set(chunks.flatMap((chunk) => Object.keys(chunk.tracks.amrs)))

  for (const chunk of chunks) {
    const frames = chunk.tracks.t.length

    t.push(...chunk.tracks.t)

    // 한 청크에 없는 장비: 관절은 직전 값 유지, AMR 은 null (숨김)
    for (const id of jointIds) {
      const list = (joints[id] ??= [])

      const own = chunk.tracks.joints[id]

      if (own) list.push(...own)
      else list.push(...Array.from({ length: frames }, () => list[list.length - 1] ?? [0, 0, 0, 0, 0]))
    }

    for (const id of amrIds) {
      const list = (amrs[id] ??= [])

      list.push(...(chunk.tracks.amrs[id] ?? Array.from({ length: frames }, () => null)))
    }
  }

  const concat = <T,>(pick: (chunk: RunChunk) => T[] | undefined) => chunks.flatMap((chunk) => pick(chunk) ?? [])

  const hasParts = chunks.some((chunk) => chunk.tracks.parts)

  const hasKpi = chunks.some((chunk) => chunk.tracks.kpi)

  const hasPalletParents = chunks.some((chunk) => chunk.recording.palletParents)

  return {
    ...first,
    meta: { ...first.meta, t1: last.meta.t1 },
    tracks: { ...first.tracks, t, joints, amrs, parts: hasParts ? concat((chunk) => chunk.tracks.parts) : undefined, kpi: hasKpi ? concat((chunk) => chunk.tracks.kpi) : undefined },
    status: concat((chunk) => chunk.status),
    events: concat((chunk) => chunk.events),
    alarms: concat((chunk) => chunk.alarms),
    recording: {
      ...first.recording,
      suction: concat((chunk) => chunk.recording.suction),
      contacts: concat((chunk) => chunk.recording.contacts),
      boxParents: concat((chunk) => chunk.recording.boxParents),
      boxKeyframes: concat((chunk) => chunk.recording.boxKeyframes),
      pallets: concat((chunk) => chunk.recording.pallets),
      palletParents: hasPalletParents ? concat((chunk) => chunk.recording.palletParents) : undefined,
    },
  }
}

// [3] 재생 시각을 따라가는 청크 창

/** 재생 시각이 든 청크 + 다음 청크를 이어 붙인 PlaybackRun 을 만든다. 청크 수와 무관 */
export class ChunkWindow {
  /** 지금 run 이 덮는 청크 [first, last] */
  range: [number, number] | null = null

  private cache = new Map<number, Promise<RunChunk>>()

  readonly manifest: RunManifest

  private readonly base: string

  private readonly fetchChunk: (url: string) => Promise<RunChunk>

  private readonly aggregates?: RunAggregates

  constructor(manifest: RunManifest, base: string, fetchChunk: (url: string) => Promise<RunChunk>, aggregates?: RunAggregates) {
    this.manifest = manifest

    this.base = base

    this.fetchChunk = fetchChunk

    this.aggregates = aggregates
  }

  /** time 을 덮지 못하거나, 마지막 청크에 들어와 다음 청크를 붙여야 하면 true */
  needs(time: number) {
    if (!this.range) return true

    const index = chunkIndexAt(this.manifest, time)

    const [first, last] = this.range

    if (index < first || index > last) return true

    return index === last && last < this.manifest.chunks.length - 1
  }

  /** 청크를 미리 받아 둔다 (실패하면 캐시에서 빼서 다음에 다시 시도) */
  prefetch(index: number) {
    if (index < 0 || index >= this.manifest.chunks.length) return

    if (this.cache.has(index)) return

    const request = this.fetchChunk(this.base + this.manifest.chunks[index].file)

    request.catch(() => this.cache.delete(index))

    this.cache.set(index, request)
  }

  private evict(keep: number[]) {
    for (const index of [...this.cache.keys()]) {
      if (this.cache.size <= CACHE_LIMIT) return

      if (!keep.includes(index)) this.cache.delete(index)
    }
  }

  async build(time: number): Promise<PlaybackRun> {
    const [first, last] = windowAt(this.manifest, time)

    const indexes = Array.from({ length: last - first + 1 }, (_, k) => first + k)

    indexes.forEach((index) => this.prefetch(index))

    // 루프하면 처음으로 돌아가므로 첫 청크도 들고 있는다
    this.prefetch(0)

    this.evict([0, ...indexes])

    const chunks = await Promise.all(indexes.map((index) => this.cache.get(index)!))

    this.range = [first, last]

    return chunkToRun(this.manifest, mergeChunks(chunks), this.aggregates)
  }
}