import type { AlertSeverity, EquipmentStatus } from '@/shared/types'

type Tone = EquipmentStatus | AlertSeverity

export const TONE_TEXT: Record<Tone, string> = {
  running: 'text-status-success',
  success: 'text-status-success',
  idle: 'text-text-tertiary',
  warning: 'text-status-warning',
  error: 'text-status-error',
  info: 'text-primary-on-dark',
}

export const TONE_BG: Record<Tone, string> = {
  running: 'bg-status-success',
  success: 'bg-status-success',
  idle: 'bg-text-tertiary',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
  info: 'bg-primary-on-dark',
}

export const TONE_TINT: Record<Tone, string> = {
  running: 'bg-status-success/16',
  success: 'bg-status-success/16',
  idle: 'bg-text-tertiary/16',
  warning: 'bg-status-warning/16',
  error: 'bg-status-error/16',
  info: 'bg-primary-on-dark/16',
}

export const TONE_BORDER: Record<Tone, string> = {
  running: 'border-status-success',
  success: 'border-status-success',
  idle: 'border-text-tertiary',
  warning: 'border-status-warning',
  error: 'border-status-error',
  info: 'border-primary-on-dark',
}

/** 상태별 실제 색 (SVG 선 · 카드 테두리처럼 클래스 대신 값이 필요한 곳). 장비 상세 ROBOT_STATUS_COLOR 와 같은 값 */
export const TONE_COLOR: Record<Tone, string> = {
  running: '#34c77b',
  success: '#34c77b',
  idle: '#8a8f98',
  warning: '#d99718',
  error: '#d94845',
  info: '#4fa8d4',
}

export type { Tone }
