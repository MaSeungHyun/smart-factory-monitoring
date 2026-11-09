import { VIRTUAL_COUNTS_AT_START } from '@/features/playback/lib/shiftBaseline'
import type { PlaybackRun } from '@/shared/types/playback'

export interface ThroughputBucket {
  /** 시프트 시작 기준 라벨 (예: 01:00) */
  label: string
  /** 버킷 끝 시각 (공장 경과 초) */
  t: number
  inbound: number
  placed: number
  outbound: number
  scanned: number
  defects: number
  /** 로봇 평균 가동률 % */
  util: number
  /** 품질 % = 1 − 불량률 */
  quality: number
  /** OEE 근사 % = 가동률 × 품질 */
  oee: number
}

const pad = (value: number) => String(value).padStart(2, '0')

function clockLabel(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds))

  return `${pad(Math.floor(whole / 3600))}:${pad(Math.floor((whole % 3600) / 60))}`
}

function scaleOf(actual: number, target: number) {
  if (actual <= 0 || target <= 0) return 1

  return target / actual
}

/**
 * aggregates.perMinute 을 bucketMinutes 단위로 묶어 투입·적재·출고 추이를 만든다.
 * factoryElapsed 이후 분은 자른다 (재생 시각까지만).
 * 가상 시프트 누적(VIRTUAL_COUNTS)에 맞춰 출고·적재 등을 스케일해 차트 공백을 메운다.
 */
export function throughputBuckets(run: PlaybackRun | null | undefined, factoryElapsed: number, bucketMinutes = 60): ThroughputBucket[] {
  const minutes = run?.aggregates?.perMinute

  if (!minutes?.length) return []

  const limit = Math.max(1, Math.min(minutes.length, Math.floor(factoryElapsed / 60) + 1))

  const sliceAll = minutes.slice(0, limit)

  let rawInbound = 0

  let rawPlaced = 0

  let rawOutbound = 0

  let rawScanned = 0

  let rawDefects = 0

  for (const row of sliceAll) {
    rawInbound += row.inbound ?? 0

    rawPlaced += row.placed ?? 0

    rawOutbound += row.outbound ?? 0

    rawScanned += row.scanned ?? 0

    rawDefects += row.defects ?? 0
  }

  // 경과 비율로 가상 누적 목표를 보간한 뒤, 분당 합계가 그에 맞게 보이도록 스케일
  const progress = Math.min(1, limit / Math.max(minutes.length, 1))

  const target = {
    inbound: VIRTUAL_COUNTS_AT_START.inbound * progress,
    placed: VIRTUAL_COUNTS_AT_START.placed * progress,
    outbound: VIRTUAL_COUNTS_AT_START.outbound * progress,
    scanned: VIRTUAL_COUNTS_AT_START.scanned * progress,
    defects: VIRTUAL_COUNTS_AT_START.defects * progress,
  }

  const scale = {
    inbound: scaleOf(rawInbound, target.inbound),
    placed: scaleOf(rawPlaced, target.placed),
    outbound: scaleOf(rawOutbound, target.outbound),
    scanned: scaleOf(rawScanned, target.scanned),
    defects: scaleOf(rawDefects, target.defects),
  }

  const size = Math.max(1, bucketMinutes)

  const out: ThroughputBucket[] = []

  let lastUtil = 90

  for (let start = 0; start < limit; start += size) {
    const slice = minutes.slice(start, Math.min(start + size, limit))

    if (!slice.length) continue

    let inbound = 0

    let placed = 0

    let outbound = 0

    let scanned = 0

    let defects = 0

    let utilSum = 0

    let utilN = 0

    for (const row of slice) {
      inbound += (row.inbound ?? 0) * scale.inbound

      placed += (row.placed ?? 0) * scale.placed

      outbound += (row.outbound ?? 0) * scale.outbound

      scanned += (row.scanned ?? 0) * scale.scanned

      defects += (row.defects ?? 0) * scale.defects

      const robots = Object.values(row.robots ?? {})

      if (robots.length) {
        utilSum += robots.reduce((sum, robot) => sum + (robot.util <= 1 ? robot.util * 100 : robot.util), 0) / robots.length

        utilN += 1
      }
    }

    const util = utilN ? utilSum / utilN : lastUtil

    lastUtil = util

    const quality = scanned > 0 ? Math.max(0, 100 - (defects / scanned) * 100) : 100

    const oee = Math.max(0, Math.min(100, (util * quality) / 100))

    const endSec = Math.min((start + slice.length) * 60, factoryElapsed)

    out.push({
      label: clockLabel(endSec),
      t: endSec,
      inbound: Math.round(inbound),
      placed: Math.round(placed),
      outbound: Math.round(outbound),
      scanned: Math.round(scanned),
      defects: Math.round(defects),
      util: Math.round(util * 10) / 10,
      quality: Math.round(quality * 10) / 10,
      oee: Math.round(oee * 10) / 10,
    })
  }

  return out
}
