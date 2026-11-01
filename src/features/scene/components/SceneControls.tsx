import { Maximize, Minus, Plus } from 'lucide-react'

import IconButton from '@/shared/components/IconButton'
import { monitorView } from '@/shared/stores/monitorView'

export default function SceneControls() {
  return (
    <div className="pointer-events-auto flex items-center gap-1">
      <IconButton aria-label="확대">
        <Plus size={18} />
      </IconButton>

      <IconButton aria-label="축소">
        <Minus size={18} />
      </IconButton>

      <IconButton aria-label="전체 화면">
        <Maximize size={18} />
      </IconButton>

      <button
        type="button"
        onClick={() => monitorView.set('main')}
        className="h-11 w-[92px] rounded bg-primary-fill text-label font-semibold text-text-primary">
        전체 보기
      </button>

      <button
        type="button"
        className="h-11 w-[92px] rounded border border-border-default bg-bg-surface text-label text-text-primary"
      >
        View
      </button>
    </div>
  )
}
