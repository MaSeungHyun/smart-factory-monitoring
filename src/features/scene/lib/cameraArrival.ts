import { createStore } from 'zustand/vanilla'

interface CameraArrivalState {
  /** 첫 비행이 main_cam 에 도착한 뒤 */
  arrived: boolean
  arrive: () => void
}

/** 오프닝 카메라가 main_cam 에 도착했는지 */
export const cameraArrival = createStore<CameraArrivalState>((set, get) => ({
  arrived: false,

  arrive() {
    if (!get().arrived) set({ arrived: true })
  },
}))
