import { useCallback, useRef } from 'react'

import type { StatusFrame } from '@/shared/types/playback'

import { continuousCount } from '../lib/continuousCount'
import { getExactTime, playbackStore } from '../lib/usePlaybackStore'

/**
 * 프레임마다 읽는 연속 수량 getter (useSmoothValue 의 함수 목표로 넘긴다).
 * 재생 데이터가 없으면 fallback 을 그대로 돌려준다. 호출해도 리렌더는 없다
 */
export function useContinuousCount(pick: (frame: StatusFrame) => number, fallback: number) {
  const pickRef = useRef(pick)

  const fallbackRef = useRef(fallback)

  pickRef.current = pick

  fallbackRef.current = fallback

  return useCallback(() => {
    const run = playbackStore.getState().run

    if (!run?.status.length) return fallbackRef.current

    return continuousCount(run.status, getExactTime(), pickRef.current)
  }, [])
}