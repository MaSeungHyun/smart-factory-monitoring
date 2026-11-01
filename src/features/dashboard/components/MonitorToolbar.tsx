import { AlertCircle, CheckCircle2, Clock, Layers } from 'lucide-react'

import { useDashboardView, usePlayback } from '@/features/playback'

import { STATUS_COUNTS } from '../data/dashboard.mock'

export default function MonitorToolbar() {
  const view = useDashboardView()

  const { playing } = usePlayback()

  const counts = view?.statusCounts ?? STATUS_COUNTS

  const counters = [
    { id: 'running', label: '작동', value: counts.running, icon: CheckCircle2, className: 'text-status-success border-status-success/40' },
    { id: 'idle', label: '대기', value: counts.idle, icon: Clock, className: 'text-status-warning border-status-warning/40' },
    { id: 'error', label: '고장', value: counts.error, icon: AlertCircle, className: 'text-status-error border-status-error' },
  ]

  return (
    <div className="flex h-9 shrink-0 items-center gap-3">
      <h2 className="text-h1 text-text-primary">메인 관제</h2>

      <span className="flex h-9 w-[68px] items-center justify-center gap-1 rounded border border-border-default text-label font-medium text-text-secondary">
        <Layers size={14} />
        1F
      </span>

      <div className="ml-auto flex items-center gap-2">
        {counters.map(({ id, label, value, icon: Icon, className }) => (
          <span key={id} className={`flex h-8 w-[88px] items-center justify-center gap-2 rounded border bg-bg-surface text-label ${className}`}>
            <Icon size={14} />

            <span className="text-text-secondary">{label}</span>

            <span className="font-semibold text-text-primary tabular-nums">{value}</span>
          </span>
        ))}

        <span className="flex h-9 w-20 items-center justify-center gap-1 rounded bg-primary-fill text-label font-semibold text-text-primary">
          <span className={`size-1.5 rounded-full bg-text-primary ${playing ? 'animate-pulse' : 'opacity-40'}`} />
          {playing ? 'LIVE' : 'PAUSE'}
        </span>
      </div>
    </div>
  )
}
