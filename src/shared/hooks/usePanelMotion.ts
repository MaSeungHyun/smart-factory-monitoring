import { useReducedMotion } from 'motion/react'

import { useGraphics } from '@/shared/stores/useGraphicsStore'

/** 패널 애니메이션 사용 여부: 설정이 켜져 있고 OS 의 동작 줄이기가 꺼져 있을 때만 */
export function usePanelMotion() {
  const { panelMotion } = useGraphics()

  const reduced = useReducedMotion()

  return panelMotion && !reduced
}