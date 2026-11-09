import { Pause, Play } from 'lucide-react'

import { playbackStore, usePlayback } from '../lib/usePlaybackStore'

/** 재생 구간 시계 (20분 창 기준 MM:SS) */
const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds))

  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

/** 재생 / 일시정지 · 위치 이동 (배속은 기본 2x, UI 숨김) */
export default function PlaybackControls() {
  const { run, playing, time, status } = usePlayback()

  if (status !== 'ready' || !run) return null

  const duration = run.meta.duration

  const PlayIcon = playing ? Pause : Play

  return (
    <div className="pointer-events-auto flex h-11 w-[420px] items-center gap-3 rounded border border-border-default bg-bg-surface/90 px-3 backdrop-blur">
      <button
        type="button"
        aria-label={playing ? '일시정지' : '재생'}
        onClick={() => playbackStore.getState().toggle()}
        className="flex size-7 items-center justify-center rounded bg-primary-fill text-text-primary"
      >
        <PlayIcon size={14} />
      </button>

      <input
        type="range"
        min={0}
        max={duration}
        step={0.1}
        value={time}
        onChange={(event) => playbackStore.getState().seek(Number(event.target.value))}
        className="h-1 min-w-0 flex-1 accent-primary-on-dark"
      />

      <span className="w-[88px] text-caption text-text-secondary tabular-nums">
        {clock(time)} / {clock(duration)}
      </span>
    </div>
  )
}
