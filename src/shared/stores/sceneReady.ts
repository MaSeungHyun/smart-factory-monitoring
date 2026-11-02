import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface SceneReadyState {
  /** 보이는 크기로 공장 장면이 그려진 뒤 */
  ready: boolean
  mark: () => void
}

/** 파일 로딩과 별개로, 첫 화면이 실제로 그려졌는지 */
export const sceneReady = createStore<SceneReadyState>((set, get) => ({
  ready: false,

  mark() {
    if (!get().ready) set({ ready: true })
  },
}))

export function useSceneReady() {
  return useStore(sceneReady, (state) => state.ready)
}
