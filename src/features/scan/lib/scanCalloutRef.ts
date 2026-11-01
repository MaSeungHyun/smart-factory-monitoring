import type { RefObject } from 'react'

import type { CalloutLayout } from '@/features/equipment-detail'

/** 상주 Canvas 안 ScanMarker3D ↔ 화면 DOM ScanCalloutOverlay 연결 */
export const scanCalloutRef: RefObject<CalloutLayout | null> = { current: null }
