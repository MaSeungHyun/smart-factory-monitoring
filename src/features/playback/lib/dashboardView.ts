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
import { sceneEquipment } from '@/features/scene'
import { LOW_BATTERY } from '@/features/warehouse/config/warehouse.config'
import { rackGrid } from '@/features/warehouse/lib/rackMap'

import { openAlarms, raisedAlarms, type ActiveAlarm } from './alarms'
import { inspectionBoxMessage, isInspectionAlarm, isInspectionLabel } from './inspection'
import { statusAt } from './frameAt'
import { kpiAt, kpiNumber } from './kpi'

import { scanRecords, type ScanRecord } from '@/features/scan/lib/scanDetail'

/** 오늘 처리 목표 (박스) — 실제 목표치가 없어 고정값 */
export const RUN_TARGET = 10800

/** 메인 랙 베이 7×3 = 21 */
const RACK_BAYS = rackGrid(sceneEquipment).flat()

/** 21개 랙 베이 중 1칸이라도 적재된 베이 수 · 점유율 */
function rackBayOccupancy(run: PlaybackRun) {
  const total = RACK_BAYS.length || 21

  const byId = new Map((run.racks ?? []).map((rack) => [rack.id, rack.slots]))

  let filled = 0

  for (const bay of RACK_BAYS) {
    const slots = byId.get(bay.id)

    if (slots?.some((slot) => slot[0])) filled += 1
  }

  return { filled, total, percent: total ? Math.round((filled / total) * 100) : 0 }
}

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
  amr: '랙 보관',
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
  /** 미확인(오픈) 알람 — 뷰포트 실시간 패널 · 고장 강조 */
  alarms: ActiveAlarm[]
  /** 발생했던 전체 알람 이력 — 대시보드 알람 탭 (확인·해소 후에도 유지) */
  alarmHistory: ActiveAlarm[]
}

/** 0-100 으로 자른 비율. 워밍업 재공(wip)이 입고 수보다 많으면 음수가 나오므로 0 아래도 막는다 */
const pct = (value: number, total: number) => (total > 0 ? Math.max(0, Math.min(100, Math.round((value / total) * 100))) : 0)

function statusOf(sample: EquipmentStateSample | undefined, faulted: boolean, inspecting: boolean): EquipmentStatus {
  if (inspecting) return 'running'

  if (faulted || sample?.state === 'error') return 'error'

  // 대기여도 배터리 부족이면 경고 (idle 보다 배터리 판정을 먼저)
  if (sample?.battery !== undefined && sample.battery < LOW_BATTERY) return 'warning'

  if (!sample || sample.state === 'idle') return 'idle'

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
    // 상태는 배지(고장/작동/대기), 여기선 누적 처리량만 표시 — 고장 중이어도 오늘 완료 건수는 유지됨
    metricLeft: '처리량',
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

/** 로봇 가동률 평균(%). utilization 없는 샘플·고장 장비는 0 으로 넣어 끌어내린다 */
function utilizationAt(frame: StatusFrame, faulted: ReadonlySet<string> = new Set()) {
  const robots = Object.entries(frame.equipment).filter(([id, sample]) => id.startsWith('robot-') && sample.utilization !== undefined)

  if (!robots.length) return 0

  return robots.reduce((sum, [id, sample]) => sum + (faulted.has(id) ? 0 : (sample.utilization ?? 0)), 0) / robots.length
}

/** 분당 집계 로봇 util 평균 (가상 5h 이력 스파크라인용) */
function utilizationFromMinute(robots: Record<string, { util: number }> | undefined, faulted: ReadonlySet<string>) {
  if (!robots) return 0

  const entries = Object.entries(robots)

  if (!entries.length) return 0

  return entries.reduce((sum, [id, robot]) => sum + (faulted.has(id) ? 0 : robot.util), 0) / entries.length
}

/** 공장 경과 기준 최근 8개 분당 OEE. 집계가 없으면 상태 프레임으로 대체 */
function oeeSparkline(run: PlaybackRun, time: number, faulted: ReadonlySet<string>) {
  const aggregates = run.aggregates?.perMinute

  if (aggregates?.length) {
    const elapsed = (run.meta.factoryElapsedAtStart ?? run.meta.simTimeOffset ?? 0) + time

    const end = Math.min(Math.max(Math.floor(elapsed / 60), 0), aggregates.length - 1)

    const start = Math.max(0, end - 7)

    return aggregates.slice(start, end + 1).map((minute) => utilizationFromMinute(minute.robots, faulted))
  }

  const history = run.status.filter((entry) => entry.t <= time)

  const step = Math.max(1, Math.floor(history.length / 8))

  return history.filter((_, index) => index % step === 0).slice(-8).map((entry) => utilizationAt(entry, faulted))
}

function stage(
  id: ProcessStage['icon'],
  name: string,
  value: number,
  percent: number,
  members: EquipmentItem[],
): ProcessStage {
  const errors = members.filter((item) => item.status === 'error')

  const active = members.some((item) => item.status === 'running' || item.status === 'warning')

  // 장비 1대 고장으로 공정 전체를 '고장' 처리하지 않음 (일부만 이상이면 warning)
  const status: EquipmentStatus =
    errors.length === 0 ? (active ? 'running' : 'idle') : errors.length >= members.length && members.length > 0 ? 'error' : 'warning'

  return {
    id,
    name,
    icon: id,
    value,
    unit: '박스',
    percent,
    status,
    statusLabel:
      errors.length === 0 ? (active ? '작동' : '대기') : errors.length >= members.length ? '고장' : `이상 ${errors.length}`,
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

  const alarmHistory = raisedAlarms(run, origins, reached).map((alarm) => {
    const message = inspectionBoxMessage(run, alarm)

    return message ? { ...alarm, message } : alarm
  })

  const alarms = openAlarms(alarmHistory, acked)

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

  const sparkline = oeeSparkline(run, time, faulted)

  const oee = frame ? utilizationAt(frame, faulted) : 0

  const byKind = (kind: string) => everything.filter((item) => run.equipment.find((entry) => entry.id === item.id)?.kind === kind)

  const statusScanned = all.filter((item) => item.type === 'scanner').reduce((sum, item) => sum + (frame?.equipment[item.id]?.count ?? 0), 0)

  // enter = 벨트 투입, at = 스캐너 도달·판정 완료 (이동 시간만큼 투입이 앞선다)
  const windowScan = scanCounts(run, time)

  const countsExtra = counts as RunCounts & { scanned?: number; conveyorIn?: number; processed?: number }

  const shiftConveyor = Number(countsExtra.conveyorIn ?? countsExtra.scanned ?? 0)

  const shiftScanned = Number(countsExtra.scanned ?? 0)

  // 컨베이어 투입: 벨트 진입 누계
  const conveyorIn = shiftConveyor + windowScan.entered

  // 스캔 검사: 실제 판정이 난 누계
  const scanned = statusScanned > 0 ? statusScanned : shiftScanned + windowScan.passed + windowScan.defects

  // 가상 누계 defects + 창 구간 신규 불량
  const defectCount = counts.defects + windowScan.defects

  const classified = Math.max(scanned, 0)

  // 스캔 정상률 = 정상 판정 / 전체 판정
  const classifySuccess = classified > 0 ? ((classified - defectCount) / classified) * 100 : 100

  // 오늘 처리량 = 출고 누적 (일일 목표 대비 출고 달성)
  const processed = Math.max(0, counts.outbound)

  const kpis: KpiItem[] = [
    { id: 'oee', label: '장비 효율 (OEE)', value: oee.toFixed(1), unit: '%', sparkline: sparkline.length > 1 ? sparkline : undefined },
    {
      id: 'defect',
      label: '불량',
      value: defectCount.toLocaleString('ko-KR'),
      unit: '개',
      sub: `${classified > 0 ? ((defectCount / classified) * 100).toFixed(1) : '0.0'}%`,
      tone: defectCount > 0 ? 'error' : 'default',
    },
    { id: 'inbound', label: '입고', value: counts.inbound.toLocaleString('ko-KR'), unit: '박스' },
    { id: 'outbound', label: '출고', value: counts.outbound.toLocaleString('ko-KR'), unit: '박스' },
  ]

  const rackBay = rackBayOccupancy(run)

  const stages: ProcessStage[] = [
    // 입고: 일일 목표 대비 진행률
    stage('inbound', '입고', counts.inbound, pct(counts.inbound, RUN_TARGET), []),
    // 컨베이어 투입: 입고 대비
    stage('conveyor', '컨베이어 투입', conveyorIn, pct(conveyorIn, counts.inbound), byKind('conveyor')),
    // 스캔 검사: 컨베이어 투입 대비 판정 완료
    stage('scan', '스캔 검사 · 분류', scanned, pct(scanned, conveyorIn), byKind('scanner')),
    // 팔레트 적재 = 누적 적재 − 출고 (아직 공장에 남은 적재분)
    stage(
      'pallet',
      '팔레트 적재',
      Math.max(0, (counts.placed ?? counts.handled) - counts.outbound),
      pct(Math.max(0, (counts.placed ?? counts.handled) - counts.outbound), scanned || counts.inbound),
      byKind('robot'),
    ),
    // 랙 보관: 메인 베이 7×3=21 중 적재된 칸 수 · 점유율
    stage('amr', '랙 보관', rackBay.filled, rackBay.percent, byKind('amr')),
    stage('outbound', '출고', counts.outbound, pct(counts.outbound, RUN_TARGET), []),
  ]

  stages[4] = {
    ...stages[4],
    unit: `/${rackBay.total}`,
    status: rackBay.filled > 0 ? (stages[4].status === 'idle' ? 'running' : stages[4].status) : stages[4].status,
    statusLabel: `${rackBay.filled}/${rackBay.total} · ${rackBay.percent}%`,
  }

  stages[0] = { ...stages[0], status: counts.inbound > 0 ? 'running' : 'idle', statusLabel: counts.inbound > 0 ? '작동' : '대기' }

  stages[1] = {
    ...stages[1],
    status: conveyorIn > 0 || counts.wip > 0 ? 'running' : 'idle',
    statusLabel: conveyorIn > scanned ? `이동 ${conveyorIn - scanned}` : conveyorIn > 0 ? '작동' : counts.wip > 0 ? `재공 ${counts.wip}` : '대기',
  }

  {
    const active = windowScan.entered > windowScan.passed + windowScan.defects

    // 분류 성공률이 높으면 정상(녹색). 불량 건수만으로 경고하지 않는다
    const scanStatus: EquipmentStatus =
      classifySuccess < 90 ? 'error' : classifySuccess < 95 ? 'warning' : scanned > 0 || active ? 'running' : stages[2].status

    stages[2] = {
      ...stages[2],
      status: scanStatus,
      statusLabel:
        classifySuccess >= 95
          ? `정상 ${classifySuccess.toFixed(0)}%`
          : classifySuccess >= 90
            ? `주의 ${classifySuccess.toFixed(0)}%`
            : `저하 ${classifySuccess.toFixed(0)}%`,
    }
  }

  stages[5] = { ...stages[5], status: counts.outbound > 0 ? 'running' : 'idle', statusLabel: counts.outbound > 0 ? '작동' : '대기' }

  const view: DashboardView = {
    // 오늘 처리량 = 출고 박스 누적 / 일일 목표
    throughput: { value: processed, target: RUN_TARGET, unit: '박스' },
    kpis,
    equipment: all,
    equipmentTotal: all.length,
    statusCounts,
    stages,
    alarms,
    alarmHistory,
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

  const inbound = num(KPI_KEYS.inbound)

  const defects = num(KPI_KEYS.defects)

  const defectRate = num(KPI_KEYS.defectRate)

  const robots = Object.values(kpi.robots ?? {}).map((robot) => robot.utilization)

  const oee = robots.length ? robots.reduce((sum, value) => sum + value, 0) / robots.length : undefined

  const kpis = view.kpis.map((item): KpiItem => {
    if (item.id === 'oee' && oee !== undefined) return { ...item, value: oee.toFixed(1) }

    if (item.id === 'defect' && defects !== undefined) {
      return {
        ...item,
        label: '불량',
        value: fmt(defects),
        unit: '개',
        sub: defectRate !== undefined ? `${defectRate.toFixed(1)}%` : item.sub,
        tone: defects > 0 ? 'error' : 'default',
      }
    }

    if (item.id === 'inbound' && inbound !== undefined) return { ...item, value: fmt(inbound) }

    // 출고·오늘 처리량은 counts.outbound(박스) 유지 — KPI ship(팔레트)으로 덮지 않음
    return item
  })

  const units = new Map(run.kpi?.schema?.stages.map((entry) => [entry.id, entry.unit]) ?? [])

  const stagesRaw = view.stages.map((item): ProcessStage => {
    // 랙 보관·출고·팔레트 적재(적재−출고)는 counts 기준 유지 — KPI로 덮지 않음
    if (item.icon === 'amr' || item.icon === 'outbound' || item.icon === 'pallet') return item

    const id = KPI_STAGE_OF[item.icon as keyof typeof KPI_STAGE_OF]

    if (!id) return item

    const valueKey = kpiKey('stageCount', { stage: id })

    const value = num(valueKey)

    if (value === undefined) return item

    const next: ProcessStage = {
      ...item,
      value: Math.round(value),
      // % 는 아래 공정 체인 기준으로 다시 계산 (KPI stageProgress 덮어쓰기 방지)
      unit: KPI_UNIT_LABEL[units.get(id) ?? (id === 'rackStore' || id === 'ship' ? 'pallets' : 'boxes')],
      valueKey,
    }

    // 장비가 묶이지 않은 입고 · 출고 카드는 수량으로 작동 여부 표시
    if (item.icon === 'inbound' || item.icon === 'outbound') {
      return { ...next, status: value > 0 ? 'running' : 'idle', statusLabel: value > 0 ? '작동' : '대기' }
    }

    return next
  })

  const stageValue = (icon: ProcessStage['icon']) => stagesRaw.find((item) => item.icon === icon)?.value ?? 0

  const inboundValue = stageValue('inbound')

  const conveyorValue = stageValue('conveyor')

  const scannedValue = stageValue('scan')

  const outboundValue = stageValue('outbound')

  // KPI 누적 적재가 있으면 팔레트 적재 = 적재 − 출고 로 재계산
  const placedRaw = num(kpiKey('stageCount', { stage: KPI_STAGE_OF.pallet }))

  const stages = stagesRaw.map((item) => {
    if (item.icon === 'inbound' || item.icon === 'outbound') return { ...item, percent: pct(item.value, RUN_TARGET) }

    if (item.icon === 'conveyor') return { ...item, percent: pct(item.value, inboundValue) }

    if (item.icon === 'scan') return { ...item, percent: pct(item.value, conveyorValue) }

    if (item.icon === 'pallet') {
      const onHand = placedRaw === undefined ? item.value : Math.max(0, Math.round(placedRaw) - outboundValue)

      return { ...item, value: onHand, percent: pct(onHand, scannedValue || inboundValue) }
    }

    return item
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

  const shipped = stages.find((item) => item.icon === 'outbound')?.value ?? view.throughput.value

  return {
    ...view,
    // 오늘 처리량 = 출고 박스 (공정 출고·KPI 출고와 동일 소스)
    throughput: { ...view.throughput, value: shipped },
    kpis: kpis.map((item) =>
      item.id === 'outbound' ? { ...item, value: shipped.toLocaleString('ko-KR'), unit: '박스' } : item,
    ),
    stages,
    equipment,
  }
}
