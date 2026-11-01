import type { RefObject } from 'react'

import type { CalloutLayout } from '../components/RobotCalloutOverlay'

/** 상주 Canvas 안 RobotMarker3D ↔ 화면 DOM RobotCalloutOverlay 연결 */
export const robotCalloutRef: RefObject<CalloutLayout | null> = { current: null }
