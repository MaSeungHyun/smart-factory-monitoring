import { useSyncExternalStore } from 'react'

import { uiStore } from '@/shared/stores/uiStore'

/** 공용 UI 상태 (선택 · 호버 · 알림 패널 · 라벨 · 필터) */
export function useUi() {
  return useSyncExternalStore(uiStore.subscribe, uiStore.get)
}
