import type { ScreenRect } from '@/shared/lib/three/screenBounds'

export const CALLOUT_WIDTH = 254

export const CALLOUT_HEIGHT = 136

const GAP = 28

const MARGIN = 12

/** 위쪽 HUD (칩, 시점 버튼) 아래부터 배치 */
const TOP = 64

/**
 * 콜아웃 카드 위치 (화면 픽셀, 카드 왼쪽 위). 로봇 화면 bbox 바깥 오른쪽 → 왼쪽 → 위 순서로
 * 들어가는 곳에 두고, 화면 밖으로 나가면 화면 안쪽으로 밀어 넣는다.
 */
export function calloutPlacement(rect: ScreenRect, width: number, height: number) {
  const clampY = (y: number) => Math.min(Math.max(y, TOP), height - CALLOUT_HEIGHT - MARGIN)

  const clampX = (x: number) => Math.min(Math.max(x, MARGIN), width - CALLOUT_WIDTH - MARGIN)

  const top = clampY(rect.minY)

  if (rect.maxX + GAP + CALLOUT_WIDTH + MARGIN <= width) return { x: rect.maxX + GAP, y: top }

  if (rect.minX - GAP - CALLOUT_WIDTH >= MARGIN) return { x: rect.minX - GAP - CALLOUT_WIDTH, y: top }

  if (rect.minY - GAP - CALLOUT_HEIGHT >= TOP) return { x: clampX((rect.minX + rect.maxX - CALLOUT_WIDTH) / 2), y: rect.minY - GAP - CALLOUT_HEIGHT }

  // 로봇이 화면을 거의 채운 경우: 화면 오른쪽 위 구석
  return { x: width - CALLOUT_WIDTH - MARGIN, y: TOP }
}
