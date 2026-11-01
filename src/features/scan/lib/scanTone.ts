import type { Tone } from '@/shared/constants/status'

import type { ScanVerdict } from './scanDetail'

export const VERDICT_TONE: Record<ScanVerdict, Tone> = { pass: 'running', defect: 'error', pending: 'info' }

export const VERDICT_BADGE: Record<ScanVerdict, string> = { pass: '정상', defect: '불량', pending: '판독 중' }

/** 3D 마커 / 리더선 색 */
export const VERDICT_COLOR: Record<ScanVerdict, string> = { pass: '#34c77b', defect: '#d94845', pending: '#4fa8d4' }
