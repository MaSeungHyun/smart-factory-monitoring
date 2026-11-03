import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface IntroClockState {
  /** 대시보드가 처음 나타난 시각 (performance.now, ms). 로딩 중이면 null */
  startedAt: number | null
  start: () => void
}

/** 인트로 애니메이션 기준 시각(T=0): 로딩 화면이 걷히는 순간 */
export const introClock = createStore<IntroClockState>((set, get) => ({
  startedAt: null,

  start() {
    if (get().startedAt === null) set({ startedAt: performance.now() })
  },
}))

export function useIntroStarted() {
  return useStore(introClock, (state) => state.startedAt !== null)
}