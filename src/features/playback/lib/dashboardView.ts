import { robotPercent } from '@/shared/constants/robotTargets'
import type {
  EquipmentItem,
  EquipmentStatus,
  KpiItem,
  ProcessStage,
  StatusCounts,
  Throughput,
} from '@/shared/types'
import { KPI_KEYS, KPI_STAGE_OF, KPI_UNIT_LABEL, kpiKey } from '@/shared/constants/kpi'
import type { KpiSample } from '@/shared/types/kpi'
import type { EquipmentStateSample, PlaybackEquipment, PlaybackRun, PlaybackState, StatusFrame } from '@/shared/types/playback'

import { openAlarms, raisedAlarms, type ActiveAlarm } from './alarms'
import { inspectionBoxMessage, isInspectionAlarm, isInspectionLabel } from './inspection'
import { statusAt } from './frameAt'
import { kpiAt, kpiNumber } from './kpi'

import { scanRecords, type ScanRecord } from '@/features/scan/lib/scanDetail'

/** 오늘 처리 목표 (박스) — 실제 목표치가 없어 고정값 */
export const RUN_TARGET = 10800

/** 이 배터리 미만이면 경고 (post-processing 조건 알람과 같은 값) */
const LOW_BATTERY = 60

export const STATE_LABEL: Record<PlaybackState, string> = {
  idle: '대기',
  moving: '작동',
  picking: '집기',
  placing: '적재',
  charging: '충전',
  error: '고장',
}

const PROCESS_LABEL: Record<string, string> = {
  robot: '팔레트 적재',
  amr: 'AMR 이송',
  scanner: '스캔 검사 · 분류',
  conveyor: '컨베이어 투입',
}

export interface DashboardView {
  throughput: Throughput
  kpis: KpiItem[]
  equipment: EquipmentItem[]
  equipmentTotal: number
  statusCounts: StatusCounts
  stages: ProcessStage[]
  alarms: ActiveAlarm[]
}

/** 0-100 으로 자른 비율. 워밍업 재공(wip)이 입고 수보다 많으면 음수가 나오므로 0 아래도 막는다 */
const pct = (value: number, total: number) => (total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0)

function statusOf(sample: EquipmentStateSample | undefined, faulted: boolean, inspecting: boolean): EquipmentStatus {
  if (inspecting) return 'running'

  if (faulted || sample?.state === 'error') return 'error'

  if (!sample || sample.state === 'idle') return 'idle'

  if (sample.battery !== undefined && sample.battery < LOW_BATTERY) return 'warning'

  return 'running'
}

function toItem(entry: PlaybackEquipment, sample: EquipmentStateSample | undefined, faulted: boolean, inbound: number): EquipmentItem {
  const inspecting = entry.kind === 'scanner' && isInspectionLabel(sample?.label)

  const status = statusOf(sample, faulted, inspecting)

  const state = inspecting ? 'moving' : faulted ? 'error' : (sample?.state ?? 'idle')

  const base = {
    id: entry.id,
    name: entry.name,
    process: PROCESS_LABEL[entry.kind] ?? entry.kind,
    status,
    statusLabel: STATE_LABEL[state],
  }

  if (entry.kind === 'amr') {
    const battery = Math.round(sample?.battery ?? 0)

    return {
      ...base,
      type: 'amr',
      statusLabel: status === 'warning' ? `배터리 ${battery}%` : base.statusLabel,
      metricLeft: sample?.hasBox ? '팔레트 이송' : (sample?.label ?? '—'),
      metricRight: `${sample?.count ?? 0} 회`,
      percent: battery,
    }
  }

  if (entry.kind === 'scanner') {
    return {
      ...base,
      type: 'scanner',
      metricLeft: inspecting ? `스캔 ${sample?.count ?? 0}` : (sample?.label ?? '—'),
      metricRight: `${sample?.count ?? 0} 개`,
      percent: pct(sample?.count ?? 0, inbound),
    }
  }

  return {
    ...base,
    type: 'robot',
    metricLeft: sample?.hasBox ? '박스 이송' : STATE_LABEL[state],
    metricRight: `${sample?.count ?? 0} 개`,
    // 개인 목표 대비 처리율
    percent: robotPercent(entry.id, sample?.count ?? 0),
  }
}

/** run -> 스캐너별 스캔 기록 (박스가 scanbelt 를 지난 기록). 상태 스트림에 스캐너 count 가 없는 run(v3)의 파생값 */
const scanCache = new WeakMap<PlaybackRun, ScanRecord[]>()

function scanCounts(run: PlaybackRun, time: number) {
  let records = scanCache.get(run)

  if (!records) {
    records = run.equipment.filter((entry) => entry.kind === 'scanner').flatMap((entry) => scanRecords(run, entry.id))

    scanCache.set(run, records)
  }

  let entered = 0

  let passed = 0

  let defects = 0

  for (const record of records) {
    if (record.enter > time) continue

    entered++

    if (record.at > time) continue

    if (record.defect) defects++
    else passed++
  }

  return { entered, passed, defects }
}

const RANK: Record<EquipmentStatus, number> = { error: 0, warning: 1, running: 2, idle: 3 }

function utilizationAt(frame: StatusFrame) {
  const robots = Object.entries(frame.equipment).filter(([id]) => id.startsWith('robot-'))

  return robots.length ? robots.reduce((sum, [, sample]) => sum + (sample.utilization ?? 0), 0) / robots.length : 0
}

function stage(
  id: ProcessStage['icon'],
  name: string,
  value: number,
  percent: number,
  members: EquipmentItem[],
): ProcessStage {
  const error = members.some((item) => item.status === 'error')

  const active = members.some((item) => item.status === 'running' || item.status === 'warning')

  const status: EquipmentStatus = error ? 'error' : active ? 'running' : 'idle'

  return {
    id,
    name,
    icon: id,
    value,
    unit: '박스',
    percent,
    status,
    statusLabel: error ? '고장' : active ? '작동' : '대기',
  }
}

export function dashboardView(
  run: PlaybackRun,
  time: number,
  reached: number,
  origins: number[],
  acked: ReadonlySet<string>,
): DashboardView {
  const frame = statusAt(run.status, time)

  const counts = frame?.counts ?? { handled: 0, inbound: 0, placed: 0, passed: 0, palletsShipped: 0, outbound: 0, defects: 0, wip: 0 }

  const alarms = openAlarms(raisedAlarms(run, origins, reached), acked).map((alarm) => {
    const message = inspectionBoxMessage(run, alarm)

    return message ? { ...alarm, message } : alarm
  })

  // 확인 전 고장 알람이 있는 장비는 고장으로 유지
  const faulted = new Set(
    alarms.filter((alarm) => alarm.severity === 'error' && !isInspectionAlarm(alarm)).map((alarm) => alarm.equipmentId),
  )

  const all = run.equipment
    .filter((entry) => entry.kind !== 'conveyor')
    .map((entry) => toItem(entry, frame?.equipment[entry.id], faulted.has(entry.id), counts.inbound))

  const conveyors = run.equipment
    .filter((entry) => entry.kind === 'conveyor')
    .map((entry) => toItem(entry, frame?.equipment[entry.id], faulted.has(entry.id), counts.inbound))

  const everything = [...all, ...conveyors]

  const statusCounts: StatusCounts = {
    running: everything.filter((item) => item.status === 'running' || item.status === 'warning').length,
    idle: everything.filter((item) => item.status === 'idle').length,
    error: everything.filter((item) => item.status === 'error').length,
  }

  const history = run.status.filter((entry) => entry.t <= time)

  const step = Math.max(1, Math.floor(history.length / 8))

  const sparkline = history.filter((_, index) => index % step === 0).slice(-8).map(utilizationAt)

  const oee = frame ? utilizationAt(frame) : 0

  const kpis: KpiItem[] = [
    { id: 'oee', label: '장비 효율 (OEE)', value: oee.toFixed(1), unit: '%', sparkline: sparkline.length > 1 ? sparkline : undefined },
    {
      id: 'defect',
      label: '불량',
      value: String(counts.defects),
      unit: '개',
      sub: `· ${counts.inbound ? ((counts.defects / counts.inbound) * 100).toFixed(2) : '0.00'}%`,
      tone: counts.defects > 0 ? 'error' : 'default',
    },
    { id: 'inbound', label: '입고', value: counts.inbound.toLocaleString('ko-KR'), unit: '박스' },
    { id: 'outbound', label: '출고', value: counts.outbound.toLocaleString('ko-KR'), unit: '박스' },
  ]

  const byKind = (kind: string) => everything.filter((item) => run.equipment.find((entry) => entry.id === item.id)?.kind === kind)

  const statusScanned = all.filter((item) => item.type === 'scanner').reduce((sum, item) => sum + (frame?.equipment[item.id]?.count ?? 0), 0)

  // 상태 스트림에 스캐너 count 가 없으면(v3) 박스 scanbelt 기록에서 판정 수(정상 + 불량)를 센다. 진행률 = 판정 / 벨트 진입
  const scan = statusScanned ? null : scanCounts(run, time)

  const scanned = scan ? scan.passed + scan.defects : statusScanned

  const amrTrips = all.filter((item) => item.type === 'amr').reduce((sum, item) => sum + (frame?.equipment[item.id]?.count ?? 0), 0)

  const stages: ProcessStage[] = [
    stage('inbound', '입고', counts.inbound, pct(counts.inbound - counts.wip, counts.inbound), []),
    stage('conveyor', '컨베이어 투입', counts.wip, pct(counts.wip, counts.inbound), byKind('conveyor')),
    stage('scan', '스캔 검사 · 분류', scanned, scan ? pct(scanned, scan.entered) : pct(scanned, counts.inbound), byKind('scanner')),
    stage('pallet', '팔레트 적재', counts.handled, pct(counts.handled, counts.inbound), byKind('robot')),
    stage('amr', 'AMR 이송', amrTrips, pct(amrTrips, counts.inbound), byKind('amr')),
    stage('outbound', '출고', counts.outbound, pct(counts.outbound, counts.inbound), []),
  ]

  stages[0] = { ...stages[0], status: counts.inbound > 0 ? 'running' : 'idle', statusLabel: counts.inbound > 0 ? '작동' : '대기' }

  // 파생 스캔: 판정이 진행 중이면 작동, 불량이 있으면 불량 N
  if (scan) {
    const active = scan.entered > scanned

    stages[2] = scan.defects
      ? { ...stages[2], status: 'error', statusLabel: `불량 ${scan.defects}` }
      : stages[2].status === 'idle' && (active || scanned > 0)
        ? { ...stages[2], status: 'running', statusLabel: active ? '판독 중' : '작동' }
        : stages[2]
  }

  stages[5] = { ...stages[5], status: counts.outbound > 0 ? 'running' : 'idle', statusLabel: counts.outbound > 0 ? '작동' : '대기' }

  const view: DashboardView = {
    throughput: { value: counts.handled, target: RUN_TARGET, unit: '박스' },
    kpis,
    equipment: all,
    equipmentTotal: all.length,
    statusCounts,
    stages,
    alarms,
  }

  // v4 녹화: 공장이 기록한 KPI 로 덮어쓴다 (없으면 위 파생값 그대로)
  const kpi = kpiAt(run.kpi, time)

  const result = kpi ? withKpi(view, kpi, run) : view

  return { ...result, equipment: [...result.equipment].sort((a, b) => RANK[a.status] - RANK[b.status] || b.percent - a.percent) }
}

// [KPI] 공장 기록값 적용

const fmt = (value: number) => Math.round(value).toLocaleString('ko-KR')

/** 대시보드 표시값 중 KPI 키가 있는 것만 바꾼다. 키가 빠진 값은 파생값 유지 */
function withKpi(view: DashboardView, kpi: KpiSample, run: PlaybackRun): DashboardView {
  const num = (key: string) => kpiNumber(kpi, key)

  const processed = num(KPI_KEYS.processed)

  const inbound = num(KPI_KEYS.inbound)

  const outbound = num(KPI_KEYS.outbound)

  const defects = num(KPI_KEYS.defects)

  const defectRate = num(KPI_KEYS.defectRate)

  const robots = Object.values(kpi.robots ?? {}).map((robot) => robot.utilization)

  const oee = robots.length ? robots.reduce((sum, value) => sum + value, 0) / robots.length : undefined

  const kpis = view.kpis.map((item): KpiItem => {
    if (item.id === 'oee' && oee !== undefined) return { ...item, value: oee.toFixed(1) }

    if (item.id === 'defect' && defects !== undefined) {
      return { ...item, value: fmt(defects), sub: `· ${(defectRate ?? 0).toFixed(2)}%`, tone: defects > 0 ? 'error' : 'default' }
    }

    if (item.id === 'inbound' && inbound !== undefined) return { ...item, value: fmt(inbound) }

    if (item.id === 'outbound' && outbound !== undefined) return { ...item, value: fmt(outbound), unit: '팔레트' }

    return item
  })

  const units = new Map(run.kpi?.schema?.stages.map((entry) => [entry.id, entry.unit]) ?? [])

  const stages = view.stages.map((item): ProcessStage => {
    const id = KPI_STAGE_OF[item.icon as keyof typeof KPI_STAGE_OF]

    if (!id) return item

    const valueKey = kpiKey('stageCount', { stage: id })

    const percentKey = kpiKey('stageProgress', { stage: id })

    const value = num(valueKey)

    const percent = num(percentKey)

    if (value === undefined) return item

    const next: ProcessStage = {
      ...item,
      value: Math.round(value),
      percent: Math.max(0, Math.min(100, Math.round(percent ?? item.percent))),
      unit: KPI_UNIT_LABEL[units.get(id) ?? (id === 'rackStore' || id === 'ship' ? 'pallets' : 'boxes')],
      valueKey,
      percentKey: percent === undefined ? undefined : percentKey,
    }

    // 장비가 묶이지 않은 입고 · 출고 카드는 수량으로 작동 여부 표시
    if (item.icon === 'inbound' || item.icon === 'outbound') {
      return { ...next, status: value > 0 ? 'running' : 'idle', statusLabel: value > 0 ? '작동' : '대기' }
    }

    return next
  })

  const equipment = view.equipment.map((item): EquipmentItem => {
    if (item.type === 'robot') {
      const cycles = num(kpiKey('robotCycles', { robotId: item.id }))

      return {
        ...item,
        percent: cycles === undefined ? item.percent : robotPercent(item.id, cycles),
        metricRight: cycles === undefined ? item.metricRight : `${fmt(cycles)} 개`,
      }
    }

    if (item.type === 'scanner') {
      const scanned = num(kpiKey('scannerScanned', { scannerId: item.id }))

      if (scanned === undefined) return item

      return { ...item, metricRight: `${fmt(scanned)} 개`, percent: pct(scanned, inbound ?? 0) }
    }

    return item
  })

  return {
    ...view,
    throughput: processed === undefined ? view.throughput : { ...view.throughput, value: Math.round(processed) },
    kpis,
    stages,
    equipment,
  }
}
