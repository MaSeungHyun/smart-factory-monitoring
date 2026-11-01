import { useSyncExternalStore } from 'react'

import { monitorView } from '@/shared/stores/monitorView'

/** 화면 상태 전체 (view / robotId / angle) */
export function useMonitorState() {
  return useSyncExternalStore(monitorView.subscribe, monitorView.get)
}

export function useMonitorView() {
  return useMonitorState().view
}
