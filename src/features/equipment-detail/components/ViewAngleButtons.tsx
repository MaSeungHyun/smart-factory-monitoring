import { useMonitorState } from '@/shared/hooks/useMonitorView'
import { cn } from '@/shared/lib/cn'
import { monitorView, type ViewAngle } from '@/shared/stores/monitorView'

const ANGLES: { id: ViewAngle; label: string }[] = [
  { id: 'front', label: '정면' },
  { id: 'side', label: '측면' },
  { id: 'top', label: '탑뷰' },
]

export default function ViewAngleButtons() {
  const { angle } = useMonitorState()

  return (
    <div className="pointer-events-auto flex h-9 rounded border border-border-default bg-bg-surface/90 p-1">
      {ANGLES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => monitorView.setAngle(item.id)}
          className={cn(
            'w-[60px] rounded text-caption',
            angle === item.id ? 'bg-primary-fill font-semibold text-text-primary' : 'text-text-secondary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
