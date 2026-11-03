import type { Variants } from 'motion/react'

import {
  CARD_ENTER_DURATION_S,
  CARD_ENTER_OFFSET_PX,
  CARD_STAGGER_DELAY_S,
  CARD_STAGGER_S,
  FLOAT_ENTER_DELAY_S,
  FLOAT_ENTER_DURATION_S,
  FLOAT_ENTER_OFFSET_PX,
  PANEL_EASE,
  PANEL_EXIT_DURATION_S,
  PANEL_EXIT_OFFSET_PX,
  SIDE_PANEL_ENTER_DELAY_S,
  SIDE_PANEL_ENTER_DURATION_S,
  SIDE_PANEL_ENTER_OFFSET_PX,
  INTRO_WINDOW_S,
  TAB_CARD_STAGGER_DELAY_S,
  TAB_ENTER_DELAY_S,
  TAB_ENTER_DURATION_S,
  TAB_ENTER_OFFSET_PX,
} from '@/shared/constants/animation'
import { introClock } from '@/shared/stores/introClock'

/**
 * 패널이 들어오는 방향: left = 왼쪽에서, right = 오른쪽에서, bottom = 아래에서,
 * float = 떠 있는 작은 컨트롤 (아래 가장자리에서 살짝)
 */
export type PanelFrom = 'left' | 'right' | 'bottom' | 'float'

interface Entry {
  x: number
  y: number
  delay: number
  duration: number
}

/** 방향별 출발 위치 · 지연 · 시간 */
const ENTRIES: Record<PanelFrom, Entry> = {
  left: { x: -SIDE_PANEL_ENTER_OFFSET_PX, y: 0, delay: SIDE_PANEL_ENTER_DELAY_S, duration: SIDE_PANEL_ENTER_DURATION_S },
  right: { x: SIDE_PANEL_ENTER_OFFSET_PX, y: 0, delay: 0, duration: SIDE_PANEL_ENTER_DURATION_S },
  bottom: { x: 0, y: SIDE_PANEL_ENTER_OFFSET_PX, delay: SIDE_PANEL_ENTER_DELAY_S, duration: SIDE_PANEL_ENTER_DURATION_S },
  float: { x: 0, y: FLOAT_ENTER_OFFSET_PX, delay: FLOAT_ENTER_DELAY_S, duration: FLOAT_ENTER_DURATION_S },
}

/** 인트로 창이 지난 뒤(탭 전환)인지. 시작 전이면 인트로로 본다 */
function isTabSwitch() {
  const startedAt = introClock.getState().startedAt

  return startedAt !== null && performance.now() - startedAt > INTRO_WINDOW_S * 1000
}

/** 탭 전환 때는 같은 방향으로 짧게 · 빠르게, 지연은 커밋이 끝날 정도만 */
function entryOf(from: PanelFrom): Entry & { cards: number } {
  const entry = ENTRIES[from]

  if (!isTabSwitch()) return { ...entry, cards: CARD_STAGGER_DELAY_S }

  return {
    x: Math.sign(entry.x) * TAB_ENTER_OFFSET_PX,
    y: Math.sign(entry.y) * TAB_ENTER_OFFSET_PX,
    delay: TAB_ENTER_DELAY_S,
    duration: TAB_ENTER_DURATION_S,
    cards: TAB_CARD_STAGGER_DELAY_S,
  }
}

/** 사라질 때는 같은 방향으로 짧게 */
function exitOffset(from: PanelFrom) {
  const { x, y } = ENTRIES[from]

  return { x: Math.sign(x) * PANEL_EXIT_OFFSET_PX, y: Math.sign(y) * PANEL_EXIT_OFFSET_PX }
}

/** 패널: hidden → shown 으로 밀려 들어오며 페이드, 자식 카드는 순서대로 */
export const panelVariants: Variants = {
  hidden: (from: PanelFrom) => ({ opacity: 0, x: entryOf(from).x, y: entryOf(from).y }),

  shown: (from: PanelFrom) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: entryOf(from).delay,
      duration: entryOf(from).duration,
      ease: PANEL_EASE,
      delayChildren: entryOf(from).cards,
      staggerChildren: CARD_STAGGER_S,
    },
  }),

  exit: (from: PanelFrom) => ({
    opacity: 0,
    ...exitOffset(from),
    transition: { duration: PANEL_EXIT_DURATION_S, ease: PANEL_EASE },
  }),
}

/** 카드 목록: 자기 자신은 움직이지 않고 자식만 DOM 순서(왼쪽 → 오른쪽, 위 → 아래)대로. 시작 지연은 부모 패널이 준다 */
export const listVariants: Variants = {
  hidden: {},

  shown: { transition: { staggerChildren: CARD_STAGGER_S } },
}

/** 카드: y 양수(아래)에서 0 으로 올라오며 페이드 */
export const itemVariants: Variants = {
  hidden: { opacity: 0, y: CARD_ENTER_OFFSET_PX },

  shown: { opacity: 1, y: 0, transition: { duration: CARD_ENTER_DURATION_S, ease: PANEL_EASE } },
}