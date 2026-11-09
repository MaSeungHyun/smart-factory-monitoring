import { useStore } from 'zustand'
import { createStore } from 'zustand/vanilla'

import { PLAYBACK_TIME_SCALE } from '@/shared/constants/playback'
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

interface PlaybackActions {
  setRun: (run: PlaybackRun) => void
  /** 같은 run 의 다른 청크 구간으로 바꿔 끼운다. 재생 시각 · 회차 · 알람 확인은 유지 */
  replaceRun: (run: PlaybackRun) => void
  setError: () => void
  toggle: () => void
  /** 씬이 그려지고 main_cam 에 도착한 뒤 한 번 재생을 시작한다 */
  begin: () => boolean
  setSpeed: (speed: number) => void
  seek: (time: number) => void
  ack: (id: string) => void
  ackAll: (ids: string[]) => void
}

export type PlaybackState = PlaybackSnapshot & PlaybackActions

const UI_INTERVAL_MS = 250

/** 한 프레임에 재생 시각은 최대 40ms. 25fps 가 보장된다고 보고 그 이상은 다음 프레임으로 넘긴다 */
const STEP_MS = 40

/** 오프닝이 끝나기 전에는 재생하지 않는다 */
let live = false

/** 씬이 그릴 재생 시각 (s). 스토어에 넣지 않는다 */
let simTime = 0

/** 아직 재생에 반영하지 않은 실제 시간 (ms) */
let pendingMs = 0

let lastFrame = 0

let lastPublish = 0

/** 씬이 그릴 시각. 시계 틱마다 스토어를 갱신하지 않는다 */
export function getExactTime() {
  return simTime
}

function publish(patch: Partial<PlaybackSnapshot>) {
  playbackStore.setState((current) => {
    const time = patch.time ?? current.time

    const reached = patch.reached ?? current.reached

    return { ...patch, time, reached: time > reached ? time : reached }
  })
}

function frame(now: number) {
  const { run, playing, speed, origins } = playbackStore.getState()

  if (!run || !playing) {
    lastFrame = now

    return
  }

  pendingMs += Math.min(now - lastFrame, 250)

  lastFrame = now

  const step = Math.min(pendingMs, STEP_MS)

  pendingMs -= step

  simTime += (step / 1000) * speed * PLAYBACK_TIME_SCALE

  let patch: Partial<PlaybackSnapshot> = {}

  if (simTime >= run.meta.duration) {
    simTime = 0

    pendingMs = 0

    patch = { origins: [...origins, Date.now()], reached: 0 }
  }

  if (now - lastPublish >= UI_INTERVAL_MS || patch.origins !== undefined) {
    lastPublish = now

    publish({ ...patch, time: simTime })
  }
}

export const playbackStore = createStore<PlaybackState>((set, get) => ({
  status: 'loading',
  run: null,
  playing: false,
  speed: 2,
  time: 0,
  origins: [Date.now()],
  reached: 0,
  acked: new Set(),

  setRun(run) {
    simTime = 0

    pendingMs = 0

    lastPublish = 0

    publish({
      run,
      status: 'ready',
      playing: live,
      time: 0,
      origins: [Date.now()],
      reached: 0,
      acked: new Set(),
    })
  },

  replaceRun(run) {
    simTime = Math.min(simTime, run.meta.duration)

    publish({ run, status: 'ready' })
  },

  setError() {
    publish({ status: 'error' })
  },

  begin() {
    if (live || !get().run) return false

    live = true

    set({ playing: true })

    return true
  },

  toggle() {
    if (!live) return

    set({ playing: !get().playing })
  },

  setSpeed(speed) {
    set({ speed })
  },

  seek(time) {
    const duration = get().run?.meta.duration ?? 0

    simTime = Math.min(Math.max(time, 0), duration)

    pendingMs = 0

    lastPublish = 0

    publish({ time: simTime })
  },

  ack(id) {
    publish({ acked: new Set([...get().acked, id]) })
  },

  ackAll(ids) {
    publish({ acked: new Set([...get().acked, ...ids]) })
  },
}))

/** HMR 이 모듈을 다시 평가해도 시계 루프는 하나 */
const clock = globalThis as { __sfmPlayback?: { frame?: (now: number) => void; started?: boolean } }

clock.__sfmPlayback ??= {}

clock.__sfmPlayback.frame = frame

if (!clock.__sfmPlayback.started) {
  clock.__sfmPlayback.started = true

  const tick = (now: number) => {
    clock.__sfmPlayback?.frame?.(now)

    requestAnimationFrame(tick)
  }

  requestAnimationFrame(tick)
}

/** 시계 UI. time 이 0.25초마다 바뀌므로 이 훅을 쓰는 컴포넌트만 그때 다시 그려진다 */
export function usePlayback(): PlaybackState {
  return useStore(playbackStore)
}

/**
 * 고른 값이 같으면 리렌더하지 않는다.
 * 재생 시각은 0.25초마다 바뀌므로, 패널은 run · playing · origins 만 고른다.
 * 3D 씬은 이 훅을 쓰지 않고 playbackStore.getState() 를 프레임에서 읽는다.
 * pick 은 스냅샷 필드이거나, 내용이 같을 때 같은 참조를 돌려야 한다.
 */
export function usePlaybackPick<T>(pick: (snap: PlaybackSnapshot) => T): T {
  return useStore(playbackStore, (state) => pick(state))
}
