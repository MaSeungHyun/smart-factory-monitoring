/** 카메라 명령 (GlbCameraRig 가 구독): 장비로 비행 · 따라가기 · 확대/축소 · 맞춤 · main_cam · 북마크 */
export type CameraCommand =
  | { kind: 'focus'; id: string; /** true 면 빠르게 (F 키) */ fast?: boolean }
  | { kind: 'follow'; id: string }
  | { kind: 'zoom'; factor: number }
  | { kind: 'fit' }
  | { kind: 'home' }
  | { kind: 'look'; position: [number, number, number]; target: [number, number, number]; /** true 면 현재 방향을 유지한 채 위치를 먼저 옮긴 뒤 회전 */ moveThenTurn?: boolean }

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
