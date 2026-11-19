/**
 * 렌더 온디맨드(FrameLoopGate)용 활동 신호.
 * - keepAlive: 매 프레임 움직이는 연출(맥동 · 페이드 등)이 있으면 useFrame 안에서 부른다 → 게이트가 계속 그린다
 * - wake: 프레임 밖(이벤트 · 스토어)에서 다시 그리기를 요청한다
 */
let lastActive = 0

const listeners = new Set<() => void>()

export const renderActivity = {
  keepAlive() {
    lastActive = performance.now()
  },

  wake() {
    lastActive = performance.now()

    listeners.forEach((listener) => listener())
  },

  lastActive() {
    return lastActive
  },

  on(listener: () => void) {
    listeners.add(listener)

    return () => {
      listeners.delete(listener)
    }
  },
}
