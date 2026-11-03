import { unwrapDegrees } from '@/shared/lib/angles'
import type { PlaybackRun } from '@/shared/types/playback'
import type { RunAggregates, RunChunk, RunManifest } from '@/shared/types/runChunk'

import { ChunkWindow } from './chunkWindow'

export { chunkIndexAt } from './chunkWindow'

export const RUN_URL = '/data/run-2026-11-03-t06-20m-w7200-s12345-v3/manifest.json'

const isManifest = (url: string) => url.endsWith('manifest.json')

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`playback data ${response.status} ${url}`)

  return (await response.json()) as T
}

export interface LoadedRun {
  run: PlaybackRun
  /** 청크 run 이면 재생 시각에 맞춰 run 을 바꿔 끼우는 창. 단일 파일 run 이면 없음 */
  window?: ChunkWindow
}

// [1] 기존 단일 파일 run

async function loadSingle(url: string) {
  const run = await fetchJson<PlaybackRun>(url)

  for (const track of Object.values(run.tracks.joints)) unwrapDegrees(track)

  return run
}

// [2] manifest + 청크

/** manifest 와 집계를 읽고 time 의 청크 창으로 첫 run 을 만든다. 집계는 없으면 목업 그대로 */
export async function loadChunkedRun(url: string, time = 0): Promise<LoadedRun> {
  const base = url.slice(0, url.lastIndexOf('/') + 1)

  const manifest = await fetchJson<RunManifest>(url)

  const aggregates = manifest.aggregates ? await fetchJson<RunAggregates>(base + manifest.aggregates).catch(() => undefined) : undefined

  const window = new ChunkWindow(manifest, base, (chunkUrl) => fetchJson<RunChunk>(chunkUrl), aggregates)

  return { run: await window.build(time), window }
}

export async function loadRun(url = RUN_URL): Promise<LoadedRun> {
  return isManifest(url) ? loadChunkedRun(url) : { run: await loadSingle(url) }
}