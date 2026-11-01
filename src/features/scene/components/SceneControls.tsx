import { Focus, Minus, Plus } from 'lucide-react'

import IconButton from '@/shared/components/IconButton'
import { useUi } from '@/shared/hooks/useUi'
import { cn } from '@/shared/lib/cn'
import { cameraBus } from '@/shared/stores/cameraBus'
import { monitorView } from '@/shared/stores/monitorView'
import { uiStore } from '@/shared/stores/uiStore'

/** 카메라: 확대 · 축소 · 맞춤(선택 장비 / 현재 시점) · 전체 보기(main_cam) · View(라벨 표시) */
export default function SceneControls() {
  const { labelsVisible, selectedId } = useUi()

  const home = () => {
    uiStore.select(null)

    monitorView.set('main')

    cameraBus.request({ kind: 'home' })
  }

  return (
    <div className="pointer-events-auto flex items-center gap-1">
      <IconButton aria-label="확대" title="확대" onClick={() => cameraBus.request({ kind: 'zoom', factor: 0.75 })}>
        <Plus size={18} />
      </IconButton>

      <IconButton aria-label="축소" title="축소" onClick={() => cameraBus.request({ kind: 'zoom', factor: 1.33 })}>
        <Minus size={18} />
      </IconButton>

      <IconButton
        aria-label="맞춤"
        title={selectedId ? '선택 장비에 맞춤' : '현재 화면 기본 시점'}
        onClick={() => cameraBus.request({ kind: 'fit' })}
      >
        <Focus size={18} />
      </IconButton>

      <button
        type="button"
        onClick={home}
        className="h-11 w-[92px] rounded bg-primary-fill text-label font-semibold text-text-primary hover:brightness-110"
      >
        전체 보기
      </button>

      <button
        type="button"
        aria-pressed={labelsVisible}
        title="라벨 · 콜아웃 표시"
        onClick={uiStore.toggleLabels}
        className={cn(
          'h-11 w-[92px] rounded border text-label hover:border-text-tertiary',
          labelsVisible ? 'border-primary-on-dark bg-bg-surface text-text-primary' : 'border-border-default bg-bg-surface text-text-tertiary line-through',
        )}
      >
        View
      </button>
    </div>
  )
}
