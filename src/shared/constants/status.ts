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

export type { Tone }
