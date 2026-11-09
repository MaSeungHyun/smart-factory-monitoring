import { indexAt, type ActiveAlarm } from '@/features/playback'
import { sceneEquipment } from '@/features/scene/lib/sceneEquipment'
import type { EquipmentStatus } from '@/shared/types'
import type { PlaybackRun, PlaybackState, StatusFrame } from '@/shared/types/playback'
import { LOW_BATTERY, SPEED_WINDOW } from '@/features/warehouse/config/warehouse.config'
import { routeText, vehicleRoster } from '@/features/warehouse/lib/vehicles'

import { AGV_TARGET, LOAD_LIMIT, TEMP_LIMIT, motorCurrent, motorLoad, motorTemp } from '../data/vehicleDetail.mock'
import { detailTitle, type VehicleKind } from './detailKind'
import type { RobotEvent } from './robotDetail'

export interface TrendBar {
  t: number
  value: number
}

export interface VehicleChart {
  title: string
  unit: string
  bars: TrendBar[]
  average: number
  /** 이 값보다 큰 막대는 경고색. y축도 최소한 여기까지 잡는다 */
  floor: number
  limit?: number
  mock?: boolean
}

export interface VehicleDetail {
  id: string
  kind: VehicleKind
  code: string
  title: string
  badge: string
  status: EquipmentStatus
  statusLabel: string
  speed: number
  speedDelta: number
  battery: number
  count: number
  target?: number
  percent?: number
  route: string
  task: string
  load: number
  temp: number
  tempLimit: number
  current: number
  currentLabel: string
  overloaded: boolean
  chart: VehicleChart
  events: RobotEvent[]
  alarms: ActiveAlarm[]
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

const round1 = (value: number) => Math.round(value * 10) / 10

function speedAt(run: PlaybackRun, id: string, time: number) {
  const poses = run.tracks.poses[id]

  if (!poses) return 0

  const times = run.tracks.t

  const i = indexAt(times, time)

  const j = Math.max(0, i - SPEED_WINDOW)

  const a = poses[j]

  const b = poses[i]

  if (!a || !b || i === j) return 0

  return Math.round((Math.hypot(b[0] - a[0], b[2] - a[2]) / (times[i] - times[j])) * 10) / 10
}

function pickFrames(frames: StatusFrame[]) {
  if (frames.length <= MAX_BARS) return frames

  const step = (frames.length - 1) / (MAX_BARS - 1)

  return Array.from({ length: MAX_BARS }, (_, index) => frames[Math.round(index * step)])
}

function statusOf(state: PlaybackState, faulted: boolean, battery: number, kind: VehicleKind): [EquipmentStatus, string] {
  if (faulted || state === 'error') return ['error', kind === 'agv' ? '정지' : '고장']

  if (state === 'charging') return ['warning', '충전']

  if (battery < LOW_BATTERY) return ['warning', `배터리 ${battery}%`]

  if (state === 'idle') return ['idle', '대기']

  return ['running', '작동']
}

/** 선택 AMR · AGV · 지게차의 상세 (재생 시각 기준) */
export function vehicleDetail(
  run: PlaybackRun,
  time: number,
  origin: number,
  alarms: ActiveAlarm[],
  id: string,
  kind: VehicleKind,
): VehicleDetail {
  const frames = run.status.filter((frame) => frame.t <= time)

  const latest = frames[frames.length - 1]?.equipment[id]

  const listed = vehicleRoster(sceneEquipment, run).find((entry) => entry.id === id)

  const code = listed?.code ?? run.equipment.find((entry) => entry.id === id)?.name ?? id

  const badge = String(Number(code.split('-')[1] ?? '') || code.replace(/\D/g, '').slice(-1) || '1')

  const speed = speedAt(run, id, time)

  const speedDelta = round1(speed - speedAt(run, id, Math.max(0, time - 2)))

  const battery = Math.round(latest?.battery ?? 0)

  const count = latest?.count ?? 0

  const open = alarms.filter((alarm) => alarm.equipmentId === id)

  const faulted = open.some((alarm) => alarm.severity === 'error') || latest?.state === 'error'

  const [status, statusLabel] = statusOf(latest?.state ?? 'idle', faulted, battery, kind)

  const route = routeText(latest?.label, null)

  const task = latest?.hasBox ? '적재' : latest?.state === 'moving' ? '이동' : statusLabel

  const overloaded = status === 'error'

  const load = motorLoad(overloaded, speed)

  const faults = run.alarms.filter((alarm) => alarm.equipmentId === id && alarm.t <= time)

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

  const sampled = pickFrames(frames)

  const chart = chartOf(kind, id, run, sampled, overloaded)

  const current = motorCurrent(overloaded)

  return {
    id,
    kind,
    code,
    title: detailTitle(kind),
    badge,
    status,
    statusLabel,
    speed,
    speedDelta,
    battery,
    count,
    target: kind === 'agv' ? AGV_TARGET : undefined,
    percent: kind === 'agv' ? Math.round((count / AGV_TARGET) * 100) : undefined,
    route,
    task,
    load,
    temp: motorTemp(overloaded),
    tempLimit: TEMP_LIMIT,
    current: current.value,
    currentLabel: current.label,
    overloaded,
    chart,
    events: [...alarmEvents, ...transitions].sort((a, b) => b.at - a.at),
    alarms: open,
  }
}

function chartOf(kind: VehicleKind, id: string, run: PlaybackRun, frames: StatusFrame[], overloaded: boolean): VehicleChart {
  if (kind === 'amr') {
    const bars = frames.map((frame) => ({ t: frame.t, value: Math.round(frame.equipment[id]?.battery ?? 0) }))

    return { title: '이번 재생 · 배터리', unit: '단위 %', bars, average: mean(bars), floor: 100 }
  }

  if (kind === 'forklift') {
    const bars = frames.map((frame) => ({ t: frame.t, value: speedAt(run, id, frame.t) }))

    return { title: '이번 재생 · 주행 속도', unit: '단위 m/s', bars, average: mean(bars), floor: 1 }
  }

  const bars = frames.map((frame) => {
    const sample = frame.equipment[id]

    const errored = overloaded && frame === frames[frames.length - 1] ? true : sample?.state === 'error'

    return { t: frame.t, value: motorLoad(errored, speedAt(run, id, frame.t)) }
  })

  return {
    title: '최근 1시간 · 모터 부하',
    unit: '단위 %',
    bars,
    average: mean(bars),
    floor: 100,
    limit: LOAD_LIMIT,
    mock: true,
  }
}

function mean(bars: TrendBar[]) {
  if (!bars.length) return 0

  return Math.round((bars.reduce((sum, bar) => sum + bar.value, 0) / bars.length) * 10) / 10
}
