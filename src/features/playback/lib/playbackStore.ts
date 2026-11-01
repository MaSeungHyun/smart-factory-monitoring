import type { PlaybackRun } from '@/shared/types/playback'

export type LoadStatus = 'loading' | 'ready' | 'error'

export interface PlaybackSnapshot {
  status: LoadStatus
  run: PlaybackRun | null
  playing: boolean
  speed: number
  /** UI 용 재생 시각 (s, 약 4Hz 로 갱신) */
  time: number
  /** 회차별 재생 시간 0 에 해당하는 실제 시각 (epoch ms), 마지막이 현재 회차 */
  origins: number[]
  /** 현재 회차에서 도달한 가장 늦은 재생 시각 (뒤로 seek 해도 알람 유지) */
  reached: number
  acked: ReadonlySet<string>
}

type Listener = () => void

const UI_INTERVAL_MS = 250

let snapshot: PlaybackSnapshot = {
  status: 'loading',
  run: null,
  playing: false,
  speed: 1,
  time: 0,
  origins: [Date.now()],
  reached: 0,
  acked: new Set(),
}

/** 씬 보간용 정밀 시각 (매 프레임 갱신, 리렌더 없음) */
let exactTime = 0

let lastFrame = 0

let lastPublish = 0

let raf = 0

const listeners = new Set<Listener>()

function publish(patch: Partial<PlaybackSnapshot>) {
  snapshot = { ...snapshot, ...patch }

  if (snapshot.time > snapshot.reached) snapshot.reached = snapshot.time

  listeners.forEach((listener) => listener())
}

function frame(now: number) {
  raf = requestAnimationFrame(frame)

  const run = snapshot.run

  if (!run || !snapshot.playing) {
    lastFrame = now

    return
  }

  exactTime += (Math.min(now - lastFrame, 250) / 1000) * snapshot.speed

  lastFrame = now

  let patch: Partial<PlaybackSnapshot> = {}

  if (exactTime >= run.meta.duration) {
    // 끝나면 처음부터 다시: 실제 시각 기준점도 지금으로 옮긴다
    exactTime = 0

    patch = { origins: [...snapshot.origins, Date.now()], reached: 0 }
  }

  if (now - lastPublish >= UI_INTERVAL_MS || patch.origins !== undefined) {
    lastPublish = now

    publish({ ...patch, time: exactTime })
  }
}

export const playbackStore = {
  subscribe(listener: Listener) {
    listeners.add(listener)

    if (!raf) raf = requestAnimationFrame(frame)

    return () => {
      listeners.delete(listener)
    }
  },

  getSnapshot: () => snapshot,

  getExactTime: () => exactTime,

  setRun(run: PlaybackRun) {
    exactTime = 0

    publish({ run, status: 'ready', playing: true, time: 0, origins: [Date.now()], reached: 0, acked: new Set() })
  },

  setError() {
    publish({ status: 'error' })
  },

  toggle() {
    publish({ playing: !snapshot.playing })
  },

  setSpeed(speed: number) {
    publish({ speed })
  },

  seek(time: number) {
    const duration = snapshot.run?.meta.duration ?? 0

    exactTime = Math.min(Math.max(time, 0), duration)

    // 실제 시각 매핑 유지: 현재 회차 기준점은 그대로 두고 재생 위치만 옮긴다
    publish({ time: exactTime })
  },

  ack(id: string) {
    publish({ acked: new Set([...snapshot.acked, id]) })
  },

  ackAll(ids: string[]) {
    publish({ acked: new Set([...snapshot.acked, ...ids]) })
  },
}
