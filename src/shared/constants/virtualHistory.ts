import type { KpiSample, KpiScanCounts, KpiStage, KpiStageId } from '@/shared/types/kpi'

/**
 * 시작 시점 가상 이력 누계.
 * 녹화된 실제 집계에, 공장 가동 전부터 있던 것처럼 ~1000박스를 더한다.
 * false 로 바꾸면 가상 데이터 제거 (기존 녹화 값만 표시).
 *
 * 분당·시간당 추이 차트(throughputBuckets)에는 더하지 않는다 — 누계만 이동한다.
 */
export const VIRTUAL_HISTORY_ENABLED = true

/** 시작 시점 입고 누계에 더할 가상 박스 수 */
export const VIRTUAL_HISTORY_BOXES = 1000

/**
 * 비율 모수: 집계 totals 가 없을 때 쓴다.
 * run-2026-11-19-t10-8h-s12345 8시간 전체 합계 (aggregates.json totals).
 * 런타임에는 로드된 aggregates.totals 가 있으면 그 비율을 쓴다. wip 는 더하지 않음.
 */
export const VIRTUAL_HISTORY_RATIO_TOTALS: Record<string, number> = {
  inbound: 1672,
  scanned: 1561,
  defects: 156,
  placed: 1523,
  passed: 21,
  depalletized: 1564,
  palletsShipped: 0,
  outbound: 178,
  storedToRack: 379,
  shippedPallets: 168,
  carrierTrips: 33,
  forkliftStored: 379,
}

/**
 * 로봇 사이클 비율 모수 (같은 녹화 전체 합계, aggregates.robots).
 * 로드된 aggregates.robots 가 있으면 그쪽을 쓴다.
 */
export const VIRTUAL_HISTORY_ROBOT_TOTALS: Record<string, number> = {
  'robot-1': 44,
  'robot-5': 39,
  'robot-6': 52,
  'robot-7': 470,
  'robot-8': 513,
  'robot-9': 581,
  'robot-58': 416,
  'robot-59': 464,
  'robot-60': 508,
}

/**
 * 스캐너 비율 모수 (같은 녹화 끝 KPI scan.byScanner, 8h 합계).
 * aggregates 에 스캐너 합계가 없어 여기 값을 기본으로 쓰고, 장비 id 가 다르면 전달받은 비중을 쓴다.
 */
export const VIRTUAL_HISTORY_SCANNER_TOTALS: Record<string, { scanned: number; defect: number }> = {
  'scanner-16': { scanned: 469, defect: 47 },
  'scanner-17': { scanned: 512, defect: 43 },
  'scanner-18': { scanned: 580, defect: 66 },
}

/** KPI 공정 누계에 더할 counts 키 */
const STAGE_COUNT_EXTRA: Record<KpiStageId, string> = {
  inbound: 'inbound',
  depalletize: 'depalletized',
  scan: 'scanned',
  palletize: 'placed',
  rackStore: 'storedToRack',
  outbound: 'outbound',
  ship: 'shippedPallets',
}

export interface VirtualScannerExtra {
  scanned: number
  defect: number
}

/** 상태 프레임·KPI 샘플에 더할 시작 시점 가상 누계 */
export interface VirtualHistory {
  counts: Record<string, number>
  robots: Record<string, number>
  scanners: Record<string, VirtualScannerExtra>
}

/** 합이 total 이 되도록 비중대로 나눠 반올림하고, 남는 오차는 소수부가 큰 항목부터 보정 */
export function splitByShare(total: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights)

  const result: Record<string, number> = {}

  if (!ids.length) return result

  if (total <= 0) {
    for (const id of ids) result[id] = 0

    return result
  }

  const raw = ids.map((id) => Math.max(0, weights[id] ?? 0))

  const sum = raw.reduce((acc, value) => acc + value, 0)

  const parts = sum > 0 ? raw.map((value) => value / sum) : ids.map(() => 1 / ids.length)

  const floors = parts.map((part) => Math.floor(part * total))

  let remain = total - floors.reduce((acc, value) => acc + value, 0)

  const order = parts
    .map((part, index) => ({ index, frac: part * total - floors[index] }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index)

  for (const { index } of order) {
    if (remain <= 0) break

    floors[index] += 1

    remain -= 1
  }

  ids.forEach((id, index) => {
    result[id] = floors[index]
  })

  return result
}

/** 실제 전체 합계 비율로 카운터별 가상 가산분. inbound = VIRTUAL_HISTORY_BOXES, wip 제외 */
export function virtualCountExtras(totals?: Record<string, number>): Record<string, number> {
  const source = totals && (totals.inbound ?? 0) > 0 ? totals : VIRTUAL_HISTORY_RATIO_TOTALS

  const inboundTotal = source.inbound || 1

  const extras: Record<string, number> = {}

  for (const [key, value] of Object.entries(source)) {
    if (key === 'wip' || key === 'handled') continue

    extras[key] = key === 'inbound' ? VIRTUAL_HISTORY_BOXES : Math.round((VIRTUAL_HISTORY_BOXES * (value ?? 0)) / inboundTotal)
  }

  // conveyorIn 은 이 녹화 counts 에 키가 없다. 가산하면 폴백(conveyorIn ?? scanned)이 scanned 대신
  // 가산분만 보게 되므로 넣지 않는다. 컨베이어 카드는 KPI depalletize 누계(+depalletized 가산)를 쓴다.

  extras.handled = (extras.placed ?? 0) + (extras.depalletized ?? 0)

  return extras
}

function robotWeights(robots?: Record<string, { cycles?: number } | number>) {
  const source = robots && Object.keys(robots).length ? robots : VIRTUAL_HISTORY_ROBOT_TOTALS

  const weights: Record<string, number> = {}

  for (const [id, value] of Object.entries(source)) {
    weights[id] = typeof value === 'number' ? value : (value.cycles ?? 0)
  }

  return weights
}

/** 적재+디팔레타이즈 가산분을 로봇 실측 사이클 비중으로 나눈다 */
export function virtualRobotExtras(
  robots: Record<string, { cycles?: number } | number> | undefined,
  extras: Record<string, number>,
): Record<string, number> {
  const total = (extras.placed ?? 0) + (extras.depalletized ?? 0)

  return splitByShare(total, robotWeights(robots))
}

function scannerWeights(shares?: Record<string, { scanned?: number; defect?: number }> | null) {
  const ids = shares ? Object.keys(shares) : []

  const fallbackIds = Object.keys(VIRTUAL_HISTORY_SCANNER_TOTALS)

  // 녹화 장비 id 가 모수와 같으면 8h 합계를 써서 청크가 바뀌어도 가산분이 흔들리지 않게 한다
  const sameSet =
    ids.length === fallbackIds.length && fallbackIds.every((id) => Object.hasOwn(shares ?? {}, id))

  const source = sameSet || !ids.length ? VIRTUAL_HISTORY_SCANNER_TOTALS : shares!

  const scanned: Record<string, number> = {}

  const defect: Record<string, number> = {}

  for (const [id, value] of Object.entries(source)) {
    scanned[id] = value.scanned ?? 0

    defect[id] = value.defect ?? 0
  }

  return { scanned, defect }
}

/** 스캔·불량 가산분을 스캐너 실측 비중으로 나눈다 */
export function virtualScannerExtras(
  extras: Record<string, number>,
  shares?: Record<string, { scanned?: number; defect?: number }> | null,
): Record<string, VirtualScannerExtra> {
  const weights = scannerWeights(shares)

  const scanned = splitByShare(extras.scanned ?? 0, weights.scanned)

  const defect = splitByShare(extras.defects ?? 0, weights.defect)

  const result: Record<string, VirtualScannerExtra> = {}

  for (const id of new Set([...Object.keys(scanned), ...Object.keys(defect)])) {
    result[id] = { scanned: scanned[id] ?? 0, defect: defect[id] ?? 0 }
  }

  return result
}

/** aggregates(+ 스캐너 비중) -> 적용분. 플래그가 꺼져 있으면 undefined */
export function buildVirtualHistory(
  aggregates?: { totals?: Record<string, number>; robots?: Record<string, { cycles: number }> } | null,
  scannerShares?: Record<string, { scanned?: number; defect?: number }> | null,
): VirtualHistory | undefined {
  if (!VIRTUAL_HISTORY_ENABLED) return undefined

  const counts = virtualCountExtras(aggregates?.totals)

  return {
    counts,
    robots: virtualRobotExtras(aggregates?.robots, counts),
    scanners: virtualScannerExtras(counts, scannerShares),
  }
}

function rate(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

function withScanCounts(scan: KpiScanCounts, add: VirtualScannerExtra): KpiScanCounts {
  const scanned = scan.scanned + add.scanned

  const defect = scan.defect + add.defect

  const pass = scan.pass + (add.scanned - add.defect)

  return {
    ...scan,
    scanned,
    pass,
    defect,
    passRate: scanned > 0 ? rate(pass, scanned) : scan.passRate,
    defectRate: scanned > 0 ? rate(defect, scanned) : scan.defectRate,
  }
}

function withStage(stage: KpiStage, add: number, inboundCount: number, scaleProgress: boolean): KpiStage {
  const count = stage.count + add

  return {
    ...stage,
    count,
    progress: scaleProgress && inboundCount > 0 ? rate(count, inboundCount) : stage.progress,
  }
}

/**
 * 재고성 팔레트 잔량(적재 − 출고)에서 빼 줄 가상분.
 * 가상 박스는 화면에 없으므로, 공정 카드의 '남은 적재'는 실제 잔량만 유지한다.
 */
export function virtualOnHandExtra(history?: VirtualHistory | null) {
  if (!VIRTUAL_HISTORY_ENABLED || !history) return 0

  return (history.counts.placed ?? 0) - (history.counts.outbound ?? 0)
}

/** KPI 샘플의 누계 필드에만 가산. 재고·가동률·시간당 속도는 그대로 */
export function applyVirtualHistoryToKpiSample(sample: KpiSample, history?: VirtualHistory | null): KpiSample {
  if (!VIRTUAL_HISTORY_ENABLED || !history) return sample

  const { counts, robots, scanners } = history

  const inboundCount = (sample.stages?.inbound?.count ?? 0) + (counts.inbound ?? 0)

  const stages = sample.stages
    ? (Object.fromEntries(
        Object.entries(sample.stages).map(([id, stage]) => {
          if (!stage) return [id, stage]

          const add = counts[STAGE_COUNT_EXTRA[id as KpiStageId]] ?? 0

          const scaleProgress = id === 'depalletize' || id === 'scan' || id === 'palletize'

          return [id, withStage(stage, add, inboundCount, scaleProgress)]
        }),
      ) as KpiSample['stages'])
    : sample.stages

  const scan = sample.scan
    ? {
        ...withScanCounts(sample.scan, { scanned: counts.scanned ?? 0, defect: counts.defects ?? 0 }),
        scanners: sample.scan.scanners,
        byScanner: sample.scan.byScanner
          ? Object.fromEntries(
              Object.entries(sample.scan.byScanner).map(([id, entry]) => [
                id,
                withScanCounts(entry, scanners[id] ?? { scanned: 0, defect: 0 }),
              ]),
            )
          : sample.scan.byScanner,
      }
    : sample.scan

  const robotEntries = sample.robots
    ? Object.fromEntries(
        Object.entries(sample.robots).map(([id, entry]) => [
          id,
          robots[id] ? { ...entry, cycles: entry.cycles + robots[id] } : entry,
        ]),
      )
    : sample.robots

  return {
    ...sample,
    throughput: sample.throughput
      ? { ...sample.throughput, processed: sample.throughput.processed + (counts.placed ?? 0) }
      : sample.throughput,
    stages,
    boxes: sample.boxes ? { ...sample.boxes, passed: sample.boxes.passed + (counts.passed ?? 0) } : sample.boxes,
    scan,
    robots: robotEntries,
  }
}
