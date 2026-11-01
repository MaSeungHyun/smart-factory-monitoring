/** 카메라 명령 (GlbCameraRig 가 구독): 장비로 비행 · 확대/축소 · 맞춤 · main_cam */
export type CameraCommand = { kind: 'focus'; id: string } | { kind: 'zoom'; factor: number } | { kind: 'fit' } | { kind: 'home' }

type Listener = (command: CameraCommand) => void

const listeners = new Set<Listener>()

export const cameraBus = {
  request(command: CameraCommand) {
    listeners.forEach((listener) => listener(command))
  },

  on(listener: Listener) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },
}
