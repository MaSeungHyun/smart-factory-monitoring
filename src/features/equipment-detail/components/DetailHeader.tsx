import { ChevronLeft, Layers } from 'lucide-react'

import { usePlaybackPick } from '@/features/playback'
import { monitorView } from '@/shared/stores/useMonitorViewStore'

interface DetailHeaderProps {
  title?: string
  trail?: string
  name: string
}

export default function DetailHeader({ title = '장비 상세', trail = '메인 관제 / 팔레트 적재', name }: DetailHeaderProps) {
  const playing = usePlaybackPick((snap) => snap.playing)

  return (
    <div className="flex h-9 shrink-0 items-center gap-3">
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => monitorView.getState().set('main')}
        className="flex size-9 items-center justify-center rounded border border-border-default bg-bg-surface text-text-primary"
      >
        <ChevronLeft size={18} />
      </button>

      <h1 className="text-h1 text-text-primary">{title}</h1>

      <p className="text-caption text-text-tertiary">
        {trail} / <span className="font-semibold text-text-primary">{name}</span>
      </p>

      <span className="ml-auto flex h-8 items-center gap-1 rounded border border-border-default bg-bg-surface px-2 text-caption text-text-primary">
        <Layers size={14} />
        1F
      </span>

      <span className="flex h-8 items-center gap-1 rounded bg-primary-fill px-2.5 text-caption font-semibold text-text-primary">
        <span className={`size-1.5 rounded-full bg-text-primary ${playing ? 'animate-pulse' : 'opacity-40'}`} />
        {playing ? 'LIVE' : 'PAUSE'}
      </span>
    </div>
  )
}
