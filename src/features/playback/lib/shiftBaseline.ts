import type { RunCounts } from '@/shared/types/playback'

/**
 * 시연용: 목표 10800 박스 기준으로 약 5시간 가동 뒤 누적 통계.
 * 상세 청크(20분) 타임라인은 그대로 두고, KPI·공정 카드 숫자만 이 값에서 이어진다.
 */
export const VIRTUAL_COUNTS_AT_START: RunCounts & Record<string, number> = {
  handled: 0, // expand 시 placed+depalletized 로 재계산
  inbound: 7200,
  /** 컨베이어 투입 (스캔 벨트 진입). 스캔 완료보다 앞서 있음 */
  conveyorIn: 7060,
  /** 스캔 판정 완료 */
  scanned: 6980,
  defects: 72,
  /** 팔레트 적재 — 출고·랙 용량 대비 과하지 않게 */
  placed: 6200,
  passed: 6908,
  depalletized: 6820,
  palletsShipped: 900,
  /** 랙 베이 용량이 작아 대부분은 출고로 나감 */
  outbound: 5400,
  storedToRack: 480,
  shippedPallets: 900,
  /** (참고) 운반 트립 — 공정 카드는 storedToRack 을 씀 */
  carrierTrips: 920,
  forkliftStored: 480,
  wip: 96,
}

/** 저부하·대기 라인 — 목표·배분 비중을 동일하게 */
export const LOW_LOAD_ROBOTS = ['robot-1', 'robot-5', 'robot-6'] as const

/** 녹화에서 관측된 상대 처리 비중 (창 시작 count). 0 인 저부하는 동일 소량 배분 */
export const ROBOT_WEIGHTS: Record<string, number> = {
  'robot-1': 0,
  'robot-5': 0,
  'robot-6': 0,
  'robot-7': 137,
  'robot-8': 128,
  'robot-9': 126,
  'robot-67': 130,
  'robot-68': 120,
  'robot-69': 118,
}

/** 일일 공장 목표 — 로봇 개인 목표 배분의 모수 */
export const FACTORY_DAY_TARGET = 10800

/** 저부하 로봇 공통 일일 목표 */
export const LOW_LOAD_DAY_TARGET = 120

/**
 * 전체 처리량을 로봇에게 나눈다.
 * - 저부하: 동일 몫
 * - 메인: 녹화 비중대로 나머지 배분 (합이 total 이 되도록 마지막에 보정)
 */
export function allocateRobotShares(total: number, weights: Record<string, number> = ROBOT_WEIGHTS, lowEach?: number) {
  const ids = Object.keys(weights)

  const low = ids.filter((id) => (LOW_LOAD_ROBOTS as readonly string[]).includes(id))

  const active = ids.filter((id) => !(LOW_LOAD_ROBOTS as readonly string[]).includes(id))

  const lowQuota = lowEach ?? Math.max(1, Math.round((total / FACTORY_DAY_TARGET) * LOW_LOAD_DAY_TARGET))

  const lowTotal = lowQuota * low.length

  const activePool = Math.max(0, total - lowTotal)

  const weightSum = active.reduce((sum, id) => sum + Math.max(weights[id] ?? 0, 0), 0)

  const result: Record<string, number> = {}

  for (const id of low) result[id] = lowQuota

  let used = 0

  active.forEach((id, index) => {
    const weight = Math.max(weights[id] ?? 0, 0)

    const share =
      index === active.length - 1
        ? activePool - used
        : weightSum > 0
          ? Math.round((activePool * weight) / weightSum)
          : Math.round(activePool / Math.max(active.length, 1))

    result[id] = Math.max(0, share)

    used += result[id]
  })

  return result
}

/** 창 시작 로봇 누적 = 팔레트 적재 총량을 로봇이 나눈 값 */
export function virtualRobotCountsAtStart(weights: Record<string, number> = ROBOT_WEIGHTS) {
  return allocateRobotShares(VIRTUAL_COUNTS_AT_START.placed, weights)
}

/** 녹화 스냅샷 누계 → 가상 시프트 누계로 맞추는 가산 오프셋 */
export function countsOffsetFrom(snapshot: Record<string, number> | undefined) {
  const offset: Record<string, number> = {}

  for (const [key, target] of Object.entries(VIRTUAL_COUNTS_AT_START)) {
    if (key === 'handled') continue

    offset[key] = target - (snapshot?.[key] ?? 0)
  }

  return offset
}

export function applyCountsOffset(counts: Record<string, number>, offset: Record<string, number>) {
  const next = { ...counts }

  for (const [key, add] of Object.entries(offset)) {
    next[key] = (next[key] ?? 0) + add
  }

  next.handled = (next.placed ?? 0) + (next.depalletized ?? 0)

  return next
}

/**
 * 로봇 count 오프셋.
 * 표시 = (전체 처리량 배분 몫) + (시나리오 구간에서 늘어난 실측치)
 *      = share + (recorded - recordedAtStart)
 *      = recorded + (share - recordedAtStart)
 */
export function robotCountOffsetFrom(startCounts: Record<string, number | undefined>) {
  const weights = { ...ROBOT_WEIGHTS }

  for (const [id, count] of Object.entries(startCounts)) {
    if (count !== undefined) weights[id] = count
  }

  const shares = virtualRobotCountsAtStart(weights)

  const offset: Record<string, number> = {}

  for (const [id, share] of Object.entries(shares)) {
    offset[id] = share - (startCounts[id] ?? 0)
  }

  return offset
}

export function applyRobotCountOffset(
  equipment: Record<string, { count?: number; [key: string]: unknown }>,
  offset: Record<string, number>,
) {
  const next = { ...equipment }

  for (const [id, add] of Object.entries(offset)) {
    const sample = next[id]

    if (!sample) continue

    next[id] = { ...sample, count: (sample.count ?? 0) + add }
  }

  return next
}
