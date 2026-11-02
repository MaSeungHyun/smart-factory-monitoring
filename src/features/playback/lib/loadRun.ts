import { unwrapDegrees } from '@/shared/lib/angles'
import type { PlaybackRun } from '@/shared/types/playback'
import type { RunAggregates, RunChunk, RunManifest } from '@/shared/types/runChunk'

import { chunkToRun } from './chunkRun'

export const RUN_URL = '/data/run-2026-11-03-t06-10m-w7200-s12345-v2/manifest.json'

const isManifest = (url: string) => url.endsWith('manifest.json')

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`playback data ${response.status} ${url}`)

  return (await response.json()) as T
}

// [1] 기존 단일 파일 run

async function loadSingle(url: string) {
  const run = await fetchJson<PlaybackRun>(url)

  for (const track of Object.values(run.tracks.joints)) unwrapDegrees(track)

  return run
}

// [2] manifest + 청크

/** 재생 시간 (offset 제거) 이 들어 있는 청크 index */
export function chunkIndexAt(manifest: RunManifest, time: number) {
  const sim = time + manifest.simTimeOffset

  const index = manifest.chunks.findIndex((chunk) => sim >= chunk.t0 && sim < chunk.t1)

  return index >= 0 ? index : sim < manifest.chunks[0].t0 ? 0 : manifest.chunks.length - 1
}

/** time 이 속한 청크를 읽어 PlaybackRun 으로 바꾼다. 집계는 없으면 목업 그대로 */
export async function loadChunkedRun(url: string, time = 0) {
  const base = url.slice(0, url.lastIndexOf('/') + 1)

  const manifest = await fetchJson<RunManifest>(url)

  const entry = manifest.chunks[chunkIndexAt(manifest, time)]

  const [chunk, aggregates] = await Promise.all([
    fetchJson<RunChunk>(base + entry.file),
    manifest.aggregates ? fetchJson<RunAggregates>(base + manifest.aggregates).catch(() => undefined) : undefined,
  ])

  return chunkToRun(manifest, chunk, aggregates)
}

export async function loadRun(url = RUN_URL): Promise<PlaybackRun> {
  return isManifest(url) ? loadChunkedRun(url) : loadSingle(url)
}
