import { cn } from '@/shared/lib/cn'
import { monitorView, useMonitorState, type ViewAngle } from '@/shared/stores/useMonitorViewStore'

const ANGLES: { id: ViewAngle; label: string }[] = [
  { id: 'front', label: '정면' },
  { id: 'side', label: '측면' },
  { id: 'top', label: '탑뷰' },
]

/** 장비 상세 · 스캔 검사 공용 정면 / 측면 / 탑뷰 버튼. 카메라를 직접 움직이면 선택이 풀리고, 다시 누르면 그 시점으로 돌아간다 */
export default function ViewAngleButtons() {
  const { angle, free } = useMonitorState()

  return (
    <div className="pointer-events-auto flex h-9 rounded border border-border-default bg-bg-surface/90 p-1">
      {ANGLES.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => monitorView.getState().setAngle(item.id)}
          className={cn(
            'w-[60px] rounded text-caption',
            !free && angle === item.id ? 'bg-primary-fill font-semibold text-text-primary' : 'text-text-secondary',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
