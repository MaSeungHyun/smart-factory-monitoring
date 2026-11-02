import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

interface SceneWarmState {
  /** 셰이더·텍스처를 프레임 단위로 올린 뒤 */
  ready: boolean
  mark: () => void
}

/** 첫 화면 컴파일을 한 프레임에 몰지 않기 위한 준비 상태 */
export const sceneWarm = createStore<SceneWarmState>((set, get) => ({
  ready: false,

  mark() {
    if (!get().ready) set({ ready: true })
  },
}))

export function useSceneWarm() {
  return useStore(sceneWarm, (state) => state.ready)
}
