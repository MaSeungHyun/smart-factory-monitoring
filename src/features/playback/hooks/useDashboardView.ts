import { useStore } from 'zustand'

import type { PlaybackRun } from '@/shared/types/playback'

import { dashboardView, type DashboardView } from '../lib/dashboardView'
import { indexAt } from '../lib/frameAt'
import { playbackStore, type PlaybackSnapshot } from '../lib/usePlaybackStore'

let timesRun: PlaybackRun | null = null

let times: number[] = []

/** 상태 샘플 시각. 회차가 바뀌기 전에는 다시 만들지 않는다 */
function statusTimes(run: PlaybackRun) {
  if (timesRun !== run) {
    timesRun = run

    times = run.status.map((frame) => frame.t)
  }

  return times
}

function alarmsReached(run: PlaybackRun, reached: number) {
  let count = 0

  for (const alarm of run.alarms) {
    if (alarm.t <= reached) count += 1
  }

  return count
}

let cachedRun: PlaybackRun | null = null

let cachedKey = ''

let cachedAcked: PlaybackSnapshot['acked'] | null = null

let cachedOrigins: number[] | null = null

let cachedView: DashboardView | null = null

/** 상태 프레임·알람이 그대로면 같은 객체를 돌려 패널 리렌더를 건너뛴다 */
export function dashboardAt(snap: PlaybackSnapshot): DashboardView | null {
  const run = snap.run

  if (!run) return null

  const key = `${indexAt(statusTimes(run), snap.time)}|${alarmsReached(run, snap.reached)}`

  if (cachedView && cachedRun === run && cachedKey === key && cachedAcked === snap.acked && cachedOrigins === snap.origins) {
    return cachedView
  }

  cachedRun = run

  cachedKey = key

  cachedAcked = snap.acked

  cachedOrigins = snap.origins

  cachedView = dashboardView(run, snap.time, snap.reached, snap.origins, snap.acked)

  return cachedView
}

/** 재생 데이터 -> 대시보드 표시값. 시계가 아니라 상태 샘플이 바뀔 때만 갱신된다 */
export function useDashboardView() {
  return useStore(playbackStore, (state) => dashboardAt(state))
}
