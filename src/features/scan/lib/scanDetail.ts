import type { ActiveAlarm } from '@/features/playback'
import type { EquipmentStatus } from '@/shared/types'
import type { PlaybackRun } from '@/shared/types/playback'

import { DEFECT_BUCKETS, PASS_TARGET, SCAN_TARGET } from '../config/scan.config'

export type ScanVerdict = 'pass' | 'defect' | 'pending'

/** 박스 1개가 스캐너 벨트를 지난 기록 */
export interface ScanRecord {
  boxId: string
  /** 스캔 벨트 진입 (s) */
  enter: number
  /** 스캔 벨트 이탈 (s, 기록 끝까지 남으면 Infinity) */
  leave: number
  /** 판정 시각 (s): 정상 = 진입, 불량 = 불량 감지 알람 */
  at: number
  defect: boolean
  reason: string | null
  /** 리젝트 배출 로봇 (불량) */
  rejectBy: string | null
}

export interface ScanBox extends ScanRecord {
  verdict: ScanVerdict
}

export interface DefectBucket {
  t0: number
  t1: number
  scans: number
  defects: number
  /** % (스캔 없으면 0) */
  rate: number
}

export interface ScanEvent {
  key: string
  text: string
  /** epoch ms */
  at: number
  tone: EquipmentStatus
}

export interface ScanDetail {
  id: string
  name: string
  status: EquipmentStatus
  statusLabel: string
  scans: number
  target: number
  percent: number
  /** 평균 스캔 간격 (s/박스), 2건 전 null */
  speed: number | null
  /** 직전 간격 - 그 전 간격 (s) */
  speedDelta: number | null
  /** 정상 판독률 %, 스캔 전 null */
  passRate: number | null
  passTarget: number
  defects: number
  /** 불량률 % */
  defectRate: number
  buckets: DefectBucket[]
  bucketSeconds: number
  /** 현재 벨트 위 박스, 없으면 마지막 판정 박스 */
  current: ScanBox | null
  recent: ScanBox[]
  lastDefect: ScanBox | null
  events: ScanEvent[]
  alarms: ActiveAlarm[]
}

const round1 = (value: number) => Math.round(value * 10) / 10

const round2 = (value: number) => Math.round(value * 100) / 100

const reasonOf = (message: string | undefined) => message?.match(/\(([^)]+)\)/)?.[1] ?? '판독 실패'

/** 재생 기록 전체에서 이 스캐너를 지난 박스 (시간순) */
export function scanRecords(run: PlaybackRun, id: string): ScanRecord[] {
  const belt = `scanbelt:${id}`

  const records: ScanRecord[] = []

  for (const box of run.boxes ?? []) {
    box.own.forEach((segment, index) => {
      if (segment[2] !== belt) return

      const defect = box.state === 'defect' && box.defect?.by === id

      const alarm = defect ? run.alarms.find((entry) => entry.id === box.defect?.alarm) : undefined

      records.push({
        boxId: box.id,
        enter: segment[0],
        leave: box.own[index + 1]?.[0] ?? Infinity,
        at: defect ? (box.defect?.t ?? segment[0]) : segment[0],
        defect,
        reason: defect ? reasonOf(alarm?.message) : null,
        rejectBy: defect ? (box.reject?.robot ?? null) : null,
      })
    })
  }

  return records.sort((a, b) => a.enter - b.enter)
}

const verdictAt = (record: ScanRecord, time: number): ScanVerdict => (record.at > time ? 'pending' : record.defect ? 'defect' : 'pass')

/** 선택 스캐너 상세 (재생 시각 time 기준) */
export function scanDetail(
  run: PlaybackRun,
  records: ScanRecord[],
  time: number,
  origin: number,
  alarms: ActiveAlarm[],
  id: string,
): ScanDetail {
  const done = records.filter((record) => record.at <= time).sort((a, b) => a.at - b.at)

  const entered = records.filter((record) => record.enter <= time)

  const defects = done.filter((record) => record.defect)

  const intervals = entered.slice(1).map((record, index) => record.enter - entered[index].enter)

  const speed = intervals.length ? round1(intervals.reduce((sum, value) => sum + value, 0) / intervals.length) : null

  const speedDelta = intervals.length > 1 ? round1(intervals[intervals.length - 1] - intervals[intervals.length - 2]) : null

  const bucketSeconds = run.meta.duration / DEFECT_BUCKETS

  const buckets: DefectBucket[] = []

  for (let index = 0; index < DEFECT_BUCKETS && index * bucketSeconds <= time; index++) {
    const t0 = index * bucketSeconds

    const t1 = t0 + bucketSeconds

    const inside = done.filter((record) => record.at >= t0 && record.at < t1)

    const bad = inside.filter((record) => record.defect).length

    buckets.push({ t0, t1, scans: inside.length, defects: bad, rate: inside.length ? round2((bad / inside.length) * 100) : 0 })
  }

  const withVerdict = (record: ScanRecord): ScanBox => ({ ...record, verdict: verdictAt(record, time) })

  const onBelt = entered.filter((record) => record.leave > time)

  const last = onBelt[onBelt.length - 1] ?? done[done.length - 1] ?? null

  const open = alarms.filter((alarm) => alarm.equipmentId === id)

  const sample = run.status.filter((frame) => frame.t <= time).pop()?.equipment[id]

  const state = sample?.state ?? 'idle'

  const status: EquipmentStatus = open.some((alarm) => alarm.severity === 'error') || state === 'error'
    ? 'error'
    : state === 'idle'
      ? 'idle'
      : 'running'

  const statusLabel = status === 'error' ? '불량' : status === 'idle' ? '대기' : '검사 중'

  const at = (t: number) => origin + t * 1000

  const boxIds = new Set(records.map((record) => record.boxId))

  const events: ScanEvent[] = [
    ...done.map((record): ScanEvent => (record.defect
      ? { key: `d-${record.boxId}`, text: `${record.reason} 감지 → 선별 로봇암이 불량 박스 제거 · ${record.boxId}`, at: at(record.at), tone: 'error' }
      : { key: `p-${record.boxId}`, text: `바코드 판독 정상 · ${record.boxId}`, at: at(record.at), tone: 'running' })),
    ...run.alarms
      .filter((alarm) => alarm.t <= time && alarm.equipmentId !== id && [...boxIds].some((box) => alarm.message.includes(box)))
      .map((alarm): ScanEvent => ({ key: alarm.id, text: alarm.message, at: at(alarm.t), tone: 'warning' })),
    ...run.events
      .filter((event) => event.equipmentId === id && event.t <= time && event.from === 'idle')
      .map((event, index): ScanEvent => ({ key: `s-${index}`, text: '검사 시작', at: at(event.t), tone: 'idle' })),
    ...run.events
      .filter((event) => event.equipmentId === id && event.t <= time && event.from === 'error')
      .map((event, index): ScanEvent => ({ key: `r-${index}`, text: '불량 처리 완료 · 검사 재개', at: at(event.t), tone: 'running' })),
  ].sort((a, b) => b.at - a.at)

  return {
    id,
    name: run.equipment.find((entry) => entry.id === id)?.name ?? id,
    status,
    statusLabel,
    scans: done.length,
    target: SCAN_TARGET,
    percent: Math.round((done.length / SCAN_TARGET) * 100),
    speed,
    speedDelta,
    passRate: done.length ? round2(((done.length - defects.length) / done.length) * 100) : null,
    passTarget: PASS_TARGET,
    defects: defects.length,
    defectRate: done.length ? round2((defects.length / done.length) * 100) : 0,
    buckets,
    bucketSeconds,
    current: last ? withVerdict(last) : null,
    recent: entered.slice(-6).map(withVerdict),
    lastDefect: defects.length ? withVerdict(defects[defects.length - 1]) : null,
    events,
    alarms: open,
  }
}
