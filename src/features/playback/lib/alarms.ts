import type { PlaybackRun, RunAlarm } from '@/shared/types/playback'

export interface ActiveAlarm extends RunAlarm {
  /** 반복 재생 구분까지 포함한 고유 key */
  key: string
  /** 발생 실제 시각 (epoch ms) */
  at: number
}

/**
 * 지금까지 발생한 알람 (이전 반복 재생분 포함). 확인(ack) 전까지 계속 남는다.
 * origins[loop] = 그 회차 재생 시간 0 의 실제 시각.
 */
export function raisedAlarms(run: PlaybackRun, origins: number[], reached: number) {
  const raised: ActiveAlarm[] = []

  origins.forEach((origin, loop) => {
    const current = loop === origins.length - 1

    for (const alarm of run.alarms) {
      if (current && alarm.t > reached) continue

      raised.push({ ...alarm, key: `${loop}-${alarm.id}`, at: origin + alarm.t * 1000 })
    }
  })

  return raised.sort((a, b) => b.at - a.at)
}

export function openAlarms(alarms: ActiveAlarm[], acked: ReadonlySet<string>) {
  return alarms.filter((alarm) => !acked.has(alarm.key))
}
