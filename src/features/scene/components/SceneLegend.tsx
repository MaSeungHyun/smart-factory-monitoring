import { TONE_BG } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'
import { uiStore, useUi } from '@/shared/stores/useUiStore'
import type { EquipmentStatus } from '@/shared/types'

const LEGEND: Array<{ tone: EquipmentStatus; label: string }> = [
  { tone: 'running', label: '작동' },
  { tone: 'warning', label: '대기' },
  { tone: 'idle', label: '멈춤' },
  { tone: 'error', label: '고장' },
]

/** 범례 클릭 = 그 상태 장비를 3D · 목록에서 숨김/표시 */
export default function SceneLegend() {
  const { hiddenStatuses } = useUi()

  return (
    <div className="pointer-events-auto flex h-11 w-[314px] items-center justify-between rounded border border-border-default bg-bg-surface/90 px-2 text-caption text-text-secondary">
      {LEGEND.map(({ tone, label }) => {
        const hidden = hiddenStatuses.has(tone)

        return (
          <button
            key={label}
            type="button"
            data-legend={tone}
            aria-pressed={!hidden}
            title={hidden ? `${label} 표시` : `${label} 숨기기`}
            onClick={() => uiStore.getState().toggleStatus(tone)}
            className={cn('flex h-8 items-center gap-2 rounded px-2 hover:bg-bg-surface-2 hover:text-text-primary', hidden && 'opacity-40 line-through')}
          >
            <span className={cn('size-2 rounded-full', TONE_BG[tone])} />

            {label}
          </button>
        )
      })}
    </div>
  )
}
