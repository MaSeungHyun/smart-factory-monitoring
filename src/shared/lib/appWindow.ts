import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

/** electron/preload.cjs 가 노출하는 API */
interface ElectronAppApi {
  /** 첫 화면 준비 완료를 알린다. 메인 창이 실제로 보이면 resolve 된다 */
  ready: () => Promise<void>
}

declare global {
  interface Window {
    electronApp?: ElectronAppApi
  }
}

interface AppWindowState {
  /** 사용자에게 화면이 보이는지. 웹은 처음부터, 일렉트론은 스플래시가 닫히고 메인 창이 뜬 뒤 */
  shown: boolean
}

/** 앱 창 표시 상태. preload 가 없으면(웹 · 오류) 기다리지 않고 바로 보이는 것으로 둔다 */
export const appWindow = createStore<AppWindowState>(() => ({
  shown: typeof window === 'undefined' || !window.electronApp,
}))

let readySent = false

/** 첫 화면 준비가 끝났음을 알린다. 일렉트론이면 메인 창을 띄우고 스플래시를 닫는다 (한 번만) */
export function revealAppWindow() {
  const api = window.electronApp

  if (readySent || !api) return

  readySent = true

  void api
    .ready()
    .catch((error: unknown) => console.error('Failed to reveal the app window:', error))
    .finally(() => appWindow.setState({ shown: true }))
}

export function isAppWindowShown() {
  return appWindow.getState().shown
}

export function useAppWindowShown() {
  return useStore(appWindow, (state) => state.shown)
}
