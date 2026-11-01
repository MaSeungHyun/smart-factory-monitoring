import { AlertTriangle, Check, CheckCircle2, Info, XCircle } from 'lucide-react'

import { TONE_BORDER, TONE_TEXT } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'
import type { AlertItem, AlertSeverity } from '@/shared/types'

const SEVERITY_ICON: Record<AlertSeverity, typeof Info> = {
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
}

interface AlertItemRowProps {
  alert: AlertItem
  onAck?: () => void
}

export default function AlertItemRow({ alert, onAck }: AlertItemRowProps) {
  const Icon = SEVERITY_ICON[alert.severity]

  return (
    <li className={cn('flex h-16 items-center gap-2 rounded border-l-2 bg-bg-surface-2 px-3.5', TONE_BORDER[alert.severity])}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-label font-medium text-text-primary">
          <Icon size={14} className={cn('shrink-0', TONE_TEXT[alert.severity])} />

          <span className="truncate">{alert.message}</span>
        </div>

        <p className="mt-1 pl-6 text-caption text-text-tertiary tabular-nums">{alert.time}</p>
      </div>

      {onAck && (
        <button
          type="button"
          onClick={onAck}
          className="flex h-7 shrink-0 items-center gap-1 rounded border border-border-default px-2 text-caption text-text-secondary hover:text-text-primary"
        >
          <Check size={12} />
          확인
        </button>
      )}
    </li>
  )
}
