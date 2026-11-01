import { Play, Square } from 'lucide-react'

import { playbackStore, usePlaybackPick } from '@/features/playback'

/** 시작 / 정지 — 지금은 재생 제어에 연결 (실장비 제어 API 연결 전) */
export default function RunButtons({ stopLabel = '정지' }: { stopLabel?: string }) {
  const playing = usePlaybackPick((snap) => snap.playing)

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        disabled={playing}
        onClick={() => playbackStore.getState().toggle()}
        className="flex h-11 items-center justify-center gap-1 rounded border border-status-success bg-status-success/16 text-label font-semibold text-status-success disabled:opacity-50"
      >
        <Play size={14} />
        시작
      </button>

      <button
        type="button"
        disabled={!playing}
        onClick={() => playbackStore.getState().toggle()}
        className="flex h-11 items-center justify-center gap-1 rounded border border-status-error bg-status-error/16 text-label font-semibold text-status-error disabled:opacity-50"
      >
        <Square size={14} />
        {stopLabel}
      </button>
    </div>
  )
}
