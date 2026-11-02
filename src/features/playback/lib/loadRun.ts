import type { PlaybackRun } from '@/shared/types/playback'

export const RUN_URL = '/data/run-2026-11-02.json'

export async function loadRun(url = RUN_URL): Promise<PlaybackRun> {
  const response = await fetch(url)

  if (!response.ok) throw new Error(`playback data ${response.status}`)

  return (await response.json()) as PlaybackRun
}
