import { kpiAt, kpiNumber, type ActiveAlarm } from '@/features/playback'
import { kpiKey } from '@/shared/constants/kpi'
import type { EquipmentStatus } from '@/shared/types'
import type { PlaybackRun, PlaybackState } from '@/shared/types/playback'

import { robotPercent, robotTarget } from '@/shared/constants/robotTargets'

export interface CycleBar {
  /** 재생 시각 (s) */
  t: number
  seconds: number
  paused: boolean
}

export interface RobotEvent {
  key: string
  text: string
  /** epoch ms */
  at: number
  tone: EquipmentStatus
}

export interface RobotDetail {
  id: string
  name: string
  status: EquipmentStatus
  statusLabel: string
  count: number
  target: number
  percent: number
  /** 마지막 완료 사이클 (s), 첫 사이클 전 null */
  cycle: number | null
  /** 완료 사이클 평균 (s) */
  average: number
  cycleDelta: number
  /** 완료 / 시도 (%), 시도 전 null */
  success: number | null
  /** 최근 60초 비대기 비율 (%) */
  load: number | null
  bars: CycleBar[]
  events: RobotEvent[]
  alarms: ActiveAlarm[]
  running: boolean
}

const STATE_TEXT: Record<PlaybackState, string> = {
  idle: '대기',
  moving: '이동',
  picking: '집기',
  placing: '적재',
  charging: '충전',
  error: '고장',
}

const MAX_BARS = 16

const LOAD_WINDOW = 60

const round1 = (value: number) => Math.round(value * 10) / 10

/**
 * 선택 로봇의 상세 값 (재생 시각 기준).
 * 사이클 = 이송 완료(count 증가) 간격, 알람 구간은 0초 '일시 정지' 막대.
 * 성공률 = 완료 / (완료 + 이 로봇 고장 알람) — 완료와 알람이 모두 0 이면 0.
 */
export function robotDetail(run: PlaybackRun, time: number, origin: number, alarms: ActiveAlarm[], id: string): RobotDetail {
  const frames = run.status.filter((frame) => frame.t <= time)

  const latest = frames[frames.length - 1]?.equipment[id]

  const bars: CycleBar[] = []

  let lastCount = 0

  let since: number | null = null

  for (const frame of frames) {
    const sample = frame.equipment[id]

    if (!sample) continue

    if (since === null && sample.state !== 'idle') since = frame.t

    const count = sample.count ?? 0

    if (count > lastCount && since !== null) {
      bars.push({ t: frame.t, seconds: round1(frame.t - since), paused: false })

      since = frame.t
    }

    lastCount = count
  }

  const faults = run.alarms.filter((alarm) => alarm.equipmentId === id && alarm.t <= time)

  faults.forEach((alarm) => bars.push({ t: alarm.t, seconds: 0, paused: true }))

  bars.sort((a, b) => a.t - b.t)

  const cycles = bars.filter((bar) => !bar.paused)

  // v4: 공장이 기록한 사이클 시간 (없으면 상태 프레임으로 계산)
  const kpi = kpiAt(run.kpi, time)

  const recorded = kpi?.robots?.[id]

  const derivedAverage = cycles.length ? round1(cycles.reduce((sum, bar) => sum + bar.seconds, 0) / cycles.length) : 0

  const derivedCycle = cycles.length ? cycles[cycles.length - 1].seconds : null

  const average = recorded ? round1(kpiNumber(kpi, kpiKey('robotCycleAvg', { robotId: id })) ?? 0) : derivedAverage

  const cycle = recorded ? (kpiNumber(kpi, kpiKey('robotCycleLast', { robotId: id })) ?? null) : derivedCycle

  const recent = frames.filter((frame) => frame.t > time - LOAD_WINDOW).map((frame) => frame.equipment[id]).filter(Boolean)

  const busy = recent.filter((sample) => sample.state !== 'idle').length

  const load = recent.length ? Math.round((busy / recent.length) * 100) : null

  const cycleDelta = cycles.length > 1 ? round1(cycles[cycles.length - 1].seconds - cycles[cycles.length - 2].seconds) : 0

  const open = alarms.filter((alarm) => alarm.equipmentId === id)

  const state = latest?.state ?? 'idle'

  const status: EquipmentStatus = open.some((alarm) => alarm.severity === 'error') || state === 'error'
    ? 'error'
    : state === 'idle'
      ? 'idle'
      : 'running'

  const transitions = run.events
    .filter((event) => event.equipmentId === id && event.t <= time)
    .map((event, index): RobotEvent => ({
      key: `e${index}`,
      text: `${STATE_TEXT[event.from]} → ${STATE_TEXT[event.to]}`,
      at: origin + event.t * 1000,
      tone: event.to === 'error' ? 'error' : event.to === 'idle' ? 'idle' : 'running',
    }))

  const alarmEvents = faults.map((alarm): RobotEvent => ({
    key: alarm.id,
    text: alarm.until ? `${alarm.message} → ${Math.round(alarm.until - alarm.t)}초 후 재기동` : alarm.message,
    at: origin + alarm.t * 1000,
    tone: alarm.severity === 'error' ? 'error' : 'warning',
  }))

  const count = Math.round(kpiNumber(kpi, kpiKey('robotCycles', { robotId: id })) ?? latest?.count ?? 0)

  return {
    id,
    name: run.equipment.find((entry) => entry.id === id)?.name ?? id,
    status,
    statusLabel: status === 'error' ? '고장' : status === 'idle' ? '대기' : '작동',
    count,
    target: robotTarget(id),
    percent: robotPercent(id, count),
    cycle,
    average,
    cycleDelta,
    success: count + faults.length ? round1((count / (count + faults.length)) * 100) : null,
    load,
    bars: bars.slice(-MAX_BARS),
    events: [...alarmEvents, ...transitions].sort((a, b) => b.at - a.at),
    alarms: open,
    running: status !== 'error' && state !== 'idle',
  }
}
