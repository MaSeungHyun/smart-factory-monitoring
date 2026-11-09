import { Pause, Play } from 'lucide-react'

import { cn } from '@/shared/lib/cn'

import { playbackStore, usePlayback } from '../lib/usePlaybackStore'

const SPEEDS = [1, 2, 4]

/** 공장 절대 시각 (시프트 시작 기준 HH:MM:SS) */
const clock = (seconds: number) => {
  const whole = Math.max(0, Math.floor(seconds))

  const h = Math.floor(whole / 3600)

  const m = Math.floor((whole % 3600) / 60)

  const s = whole % 60

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** 재생 / 일시정지 · 배속 · 위치 이동 */
export default function PlaybackControls() {
  const { run, playing, speed, time, status } = usePlayback()

  if (status !== 'ready' || !run) return null

  const duration = run.meta.duration

  const offset = run.meta.simTimeOffset ?? 0

  const PlayIcon = playing ? Pause : Play

  return (
    <div className="pointer-events-auto flex h-11 w-[560px] items-center gap-3 rounded border border-border-default bg-bg-surface/90 px-3 backdrop-blur">
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

      <span className="w-[132px] text-caption text-text-secondary tabular-nums" title="공장 가동 경과 (창 시작 오프셋 포함)">
        {clock(offset + time)} / {clock(offset + duration)}
      </span>

      <div className="flex gap-1">
        {SPEEDS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => playbackStore.getState().setSpeed(value)}
            className={cn(
              'h-6 rounded px-1.5 text-caption tabular-nums',
              speed === value ? 'bg-primary-fill text-text-primary' : 'text-text-tertiary',
            )}
          >
            {value}x
          </button>
        ))}
      </div>
    </div>
  )
}
