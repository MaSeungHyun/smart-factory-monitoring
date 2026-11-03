import { useEffect } from 'react'

import type { ChunkWindow } from '../lib/chunkWindow'
import { loadRun } from '../lib/loadRun'
import { getExactTime, playbackStore } from '../lib/usePlaybackStore'

/** 청크 창 확인 주기 (ms). 시크 / 루프는 스토어 time 변경으로도 바로 확인한다 */
const WINDOW_CHECK_MS = 500

/** 재생 시각이 창을 벗어나거나 마지막 청크에 들어오면 창을 다시 만들어 run 을 바꿔 끼운다 */
function followChunks(window: ChunkWindow, isCancelled: () => boolean) {
  let building = false

  const check = () => {
    const time = getExactTime()

    if (building || isCancelled() || !window.needs(time)) return

    building = true

    window
      .build(time)
      .then((run) => {
        if (!isCancelled()) playbackStore.getState().replaceRun(run)
      })
      .catch(() => undefined)
      .finally(() => {
        building = false

        // 받는 동안 시각이 또 넘어갔으면 이어서
        if (!isCancelled()) check()
      })
  }

  const timer = setInterval(check, WINDOW_CHECK_MS)

  const unsubscribe = playbackStore.subscribe((state, prev) => {
    if (state.time !== prev.time) check()
  })

  return () => {
    clearInterval(timer)

    unsubscribe()
  }
}

/** 앱 시작 시 재생 데이터를 읽어 store 에 넣고, 청크 run 이면 재생 시각을 따라 청크를 바꿔 끼운다 */
export function usePlaybackLoader() {
  useEffect(() => {
    let cancelled = false

    let stop: (() => void) | undefined

    loadRun()
      .then(({ run, window }) => {
        if (cancelled) return

        playbackStore.getState().setRun(run)

        if (window) stop = followChunks(window, () => cancelled)
      })
      .catch(() => {
        if (!cancelled) playbackStore.getState().setError()
      })

    return () => {
      cancelled = true

      stop?.()
    }
  }, [])
}