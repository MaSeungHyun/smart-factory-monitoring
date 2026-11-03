import { useCallback, useRef } from 'react'
import { useStore } from 'zustand'

import type { KpiSample } from '@/shared/types/kpi'

import { kpiAt, kpiNumber } from '../lib/kpi'
import { getExactTime, playbackStore, type PlaybackSnapshot } from '../lib/usePlaybackStore'

/** 재생 시각 (스토어 4Hz) 의 KPI 샘플. KPI 없는 녹화 / 재생 전이면 null */
export function kpiOf(snap: Pick<PlaybackSnapshot, 'run' | 'time'>): KpiSample | null {
  return kpiAt(snap.run?.kpi, snap.time)
}

/** 현재 재생 시각의 KPI 샘플 (보간). 시각이 바뀔 때마다 리렌더 */
export function useKpi() {
  const run = useStore(playbackStore, (state) => state.run)

  const time = useStore(playbackStore, (state) => state.time)

  return kpiAt(run?.kpi, time)
}

/**
 * 프레임마다 읽는 KPI 숫자 getter (AnimatedNumber · SegmentBar 의 함수 목표).
 * key 가 없거나 값이 없으면 fallback (예전 녹화의 파생값). 호출해도 리렌더는 없다
 */
export function useKpiGetter(key: string | undefined, fallback: number | (() => number)) {
  const keyRef = useRef(key)

  const fallbackRef = useRef(fallback)

  keyRef.current = key

  fallbackRef.current = fallback

  return useCallback(() => {
    const read = () => (typeof fallbackRef.current === 'function' ? fallbackRef.current() : fallbackRef.current)

    if (!keyRef.current) return read()

    const value = kpiNumber(kpiAt(playbackStore.getState().run?.kpi, getExactTime()), keyRef.current)

    return value ?? read()
  }, [])
}
