import { useSyncExternalStore } from 'react'

import { playbackStore } from '../lib/playbackStore'

export function usePlayback() {
  return useSyncExternalStore(playbackStore.subscribe, playbackStore.getSnapshot)
}
