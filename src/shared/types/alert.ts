import type { AlertSeverity } from './status'

export interface AlertItem {
  id: string
  severity: AlertSeverity
  message: string
  time: string
}
