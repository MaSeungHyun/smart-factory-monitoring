import { useEffect } from 'react'

import { loadRun } from '../lib/loadRun'
import { playbackStore } from '../lib/playbackStore'

/** 앱 시작 시 재생 데이터를 한 번 읽어 store 에 넣는다 */
export function usePlaybackLoader() {
  useEffect(() => {
    let cancelled = false

    loadRun()
      .then((run) => {
        if (!cancelled) playbackStore.setRun(run)
      })
      .catch(() => {
        if (!cancelled) playbackStore.setError()
      })

    return () => {
      cancelled = true
    }
  }, [])
}
