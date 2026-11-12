import { FACTORY_TEMPLATE, parseTemplate } from '@/features/template'
import { kpiAt, type ActiveAlarm } from '@/features/playback'
import { inspectionBoxMessage, isInspectionAlarm, isInspectionLabel } from '@/features/playback/lib/inspection'
import type { EquipmentStatus } from '@/shared/types'
import type { BoxTrack, PlaybackRun } from '@/shared/types/playback'

import { DEFECT_BUCKETS, PASS_TARGET, SCAN_TARGET, SCANNER_SHIFT_AT_START } from '../config/scan.config'

/** 스캐너 중심에서 이 거리 안을 지나면 판정이 난 것으로 본다 (m) */
const SCAN_REACH = 1.5

const SCANNERS = new Map(
  parseTemplate(FACTORY_TEMPLATE).equipment.filter((entry) => entry.kind === 'scanner').map((entry) => [entry.id, { x: entry.x, z: entry.z }]),
)

export type ScanVerdict = 'pass' | 'defect' | 'pending'

/** 박스 1개가 스캐너 벨트를 지난 기록 */
export interface ScanRecord {
  boxId: string
  /** 스캔 벨트 진입 (s) */
  enter: number
  /** 스캔 벨트 이탈 (s, 기록 끝까지 남으면 Infinity) */
  leave: number
  /** 판정 시각 (s): 정상 = 스캐너 도달, 불량 = 불량 감지 알람. 그 전에는 판독 중 */
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

/**
 * 정상 판정 시각. 벨트 진입이 아니라, 박스 포즈가 스캐너에 가장 가까워지는 시각.
 * 포즈 트랙이 이미 시계열이므로 판정용 트랙을 따로 두지 않는다.
 * 스캐너에 닿기 전에 구간이 끝나면 이탈 시각을 돌려 그때까지 판독 중으로 남긴다.
 */
function passAt(box: BoxTrack, frameTimes: number[], enter: number, leave: number, scanner: { x: number; z: number } | undefined) {
  const end = Number.isFinite(leave) ? leave : frameTimes[frameTimes.length - 1] ?? enter

  if (!scanner || frameTimes.length === 0) return end

  let frame = box.f0

  let bestT = end

  let bestD = Infinity

  let previous: { t: number; x: number; z: number } | null = null

  for (let index = 0; index < box.k.length; index++) {
    frame += box.k[index]

    const sample = {
      t: frameTimes[Math.min(frame, frameTimes.length - 1)],
      x: box.p[index * 4] / 100,
      z: box.p[index * 4 + 2] / 100,
    }

    const from = previous

    previous = sample

    if (!from || sample.t < enter || from.t > end) continue

    const t0 = Math.max(from.t, enter)

    const t1 = Math.min(sample.t, end)

    if (t1 < t0 || sample.t === from.t) continue

    const span = sample.t - from.t

    const ax = from.x + ((sample.x - from.x) * (t0 - from.t)) / span

    const az = from.z + ((sample.z - from.z) * (t0 - from.t)) / span

    const bx = from.x + ((sample.x - from.x) * (t1 - from.t)) / span

    const bz = from.z + ((sample.z - from.z) * (t1 - from.t)) / span

    const abx = bx - ax

    const abz = bz - az

    const len2 = abx * abx + abz * abz

    const raw = len2 === 0 ? 0 : ((scanner.x - ax) * abx + (scanner.z - az) * abz) / len2

    const k = Math.min(Math.max(raw, 0), 1)

    const distance = Math.hypot(ax + abx * k - scanner.x, az + abz * k - scanner.z)

    if (distance < bestD) {
      bestD = distance

      bestT = t0 + (t1 - t0) * k
    }
  }

  return bestD <= SCAN_REACH ? bestT : end
}

/** 재생 기록 전체에서 이 스캐너를 지난 박스 (시간순) */
export function scanRecords(run: PlaybackRun, id: string): ScanRecord[] {
  const belt = `scanbelt:${id}`

  const scanner = SCANNERS.get(id)

  const records: ScanRecord[] = []

  for (const box of run.boxes ?? []) {
    box.own.forEach((segment, index) => {
      if (segment[2] !== belt) return

      const defect = box.state === 'defect' && box.defect?.by === id

      const alarm = defect ? run.alarms.find((entry) => entry.id === box.defect?.alarm) : undefined

      const enter = segment[0]

      const leave = box.own[index + 1]?.[0] ?? Infinity

      records.push({
        boxId: box.id,
        enter,
        leave,
        at: defect ? (box.defect?.t ?? enter) : passAt(box, run.tracks.t, enter, leave, scanner),
        defect,
        reason: defect ? reasonOf(alarm?.message) : null,
        rejectBy: defect ? (box.reject?.robot ?? null) : null,
      })
    })
  }

  return records.sort((a, b) => a.enter - b.enter)
}

const verdictAt = (record: ScanRecord, time: number): ScanVerdict => (record.at > time ? 'pending' : record.defect ? 'defect' : 'pass')

/** 현재 벨트 위 박스, 없으면 마지막 판정 박스 */
export function currentScanBox(records: ScanRecord[], time: number): ScanBox | null {
  const done = records.filter((record) => record.at <= time).sort((a, b) => a.at - b.at)

  const onBelt = records.filter((record) => record.enter <= time && record.leave > time)

  const last = onBelt[onBelt.length - 1] ?? done[done.length - 1] ?? null

  return last ? { ...last, verdict: verdictAt(last, time) } : null
}

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

  const open = alarms.filter((alarm) => alarm.equipmentId === id && !isInspectionAlarm(alarm))

  const sample = run.status.filter((frame) => frame.t <= time).pop()?.equipment[id]

  const state = sample?.state ?? 'idle'

  const inspecting = isInspectionLabel(sample?.label)

  const status: EquipmentStatus = !inspecting && (open.some((alarm) => alarm.severity === 'error') || state === 'error')
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
      .map((alarm): ScanEvent => ({ key: alarm.id, text: inspectionBoxMessage(run, alarm) ?? alarm.message, at: at(alarm.t), tone: 'warning' })),
    ...run.events
      .filter((event) => event.equipmentId === id && event.t <= time && event.from === 'idle')
      .map((event, index): ScanEvent => ({ key: `s-${index}`, text: '검사 시작', at: at(event.t), tone: 'idle' })),
    ...run.events
      .filter((event) => event.equipmentId === id && event.t <= time && event.from === 'error')
      .map((event, index): ScanEvent => ({ key: `r-${index}`, text: '불량 처리 완료 · 검사 재개', at: at(event.t), tone: 'running' })),
  ].sort((a, b) => b.at - a.at)

  // v4: 공장이 기록한 스캐너별 집계 (없으면 박스 트랙으로 계산)
  const recorded = kpiAt(run.kpi, time)?.scan?.byScanner?.[id]

  // 시프트 가상 누적 + 재생 구간 증가분 (로봇 처리량과 같은 스케일)
  const windowScans = recorded ? Math.round(recorded.scanned) : done.length

  const scans = SCANNER_SHIFT_AT_START + windowScans

  const defectCount = recorded ? Math.round(recorded.defect) : defects.length

  const passRate = recorded ? (recorded.passRate === null ? null : round2(recorded.passRate)) : done.length ? round2(((done.length - defects.length) / done.length) * 100) : null

  const defectRate = recorded ? round2(recorded.defectRate ?? 0) : done.length ? round2((defects.length / done.length) * 100) : 0

  return {
    id,
    name: run.equipment.find((entry) => entry.id === id)?.name ?? id,
    status,
    statusLabel,
    scans,
    target: SCAN_TARGET,
    percent: Math.min(100, Math.round((scans / SCAN_TARGET) * 100)),
    speed,
    speedDelta,
    passRate,
    passTarget: PASS_TARGET,
    defects: defectCount,
    defectRate,
    buckets,
    bucketSeconds,
    current: currentScanBox(records, time),
    recent: entered.slice(-6).map(withVerdict),
    lastDefect: defects.length ? withVerdict(defects[defects.length - 1]) : null,
    events,
    alarms: open,
  }
}
