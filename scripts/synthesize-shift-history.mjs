/**
 * 상세 20분 타임라인은 그대로 두고, KPI·OEE 용 5시간 가상 누계/분당 집계만 만든다.
 * 목표 10800 기준 약 5시간 경과 누적(shiftBaseline.ts 와 동일 숫자).
 *
 * node scripts/synthesize-shift-history.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = 'public/data/run-2026-11-03-t06-20m-w7200-s12345-v3'
const LEAD_MINUTES = 300 // 5h
const WINDOW_MINUTES = 20
const FACTORY_ELAPSED_AT_START = LEAD_MINUTES * 60 // 18000

/** src/features/playback/lib/shiftBaseline.ts 와 맞출 것 */
const VIRTUAL_COUNTS_AT_START = {
  inbound: 7200,
  conveyorIn: 7060,
  scanned: 6980,
  defects: 72,
  placed: 6750,
  passed: 6908,
  depalletized: 6820,
  palletsShipped: 670,
  outbound: 2680,
  storedToRack: 2140,
  shippedPallets: 670,
  carrierTrips: 1680,
  forkliftStored: 2140,
  wip: 96,
}

const COUNT_KEYS = [
  'inbound',
  'conveyorIn',
  'scanned',
  'defects',
  'placed',
  'passed',
  'depalletized',
  'palletsShipped',
  'outbound',
  'storedToRack',
  'shippedPallets',
  'carrierTrips',
  'forkliftStored',
  'wip',
]

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const round1 = (value) => Math.round(value * 10) / 10

/** 시드 고정 간단 노이즈 */
function noise(seed, minute) {
  const x = Math.sin(seed * 12.9898 + minute * 78.233) * 43758.5453

  return x - Math.floor(x)
}

/** 대기 로봇 100%, 가동 로봇은 고효율 대역으로 재매핑 */
function boostRobots(robots, minute, seed = 1) {
  const next = {}

  for (const [id, robot] of Object.entries(robots)) {
    const idle = !robot.cycles || robot.util <= 0 || robot.state === 'idle'

    if (idle && (!robot.cycles || robot.cycles === 0)) {
      next[id] = { cycles: robot.cycles ?? 0, util: 100, state: 'idle' }
      continue
    }

    const base = robot.util <= 1 ? robot.util * 100 : robot.util
    // 34%대 → 88~96% 로 끌어올려 시연 OEE 를 높게
    const mapped = 88 + (base / 40) * 8 + (noise(seed, minute + id.length) - 0.5) * 2

    next[id] = {
      cycles: robot.cycles ?? 0,
      util: round1(clamp(mapped, 86, 97)),
      state: robot.state === 'idle' ? 'working' : robot.state,
    }
  }

  return next
}

function boostTotals(robots) {
  const next = {}

  for (const [id, robot] of Object.entries(robots)) {
    const idle = !robot.cycles || robot.utilization <= 0

    next[id] = idle
      ? { cycles: robot.cycles ?? 0, utilization: 100 }
      : {
          cycles: robot.cycles,
          utilization: round1(clamp(88 + ((robot.utilization <= 1 ? robot.utilization * 100 : robot.utilization) / 40) * 8, 86, 97)),
        }
  }

  return next
}

function lerpCounts(start, end, ratio) {
  const out = {}

  for (const key of COUNT_KEYS) {
    const a = start[key] ?? 0
    const b = end[key] ?? 0

    out[key] = Math.round(a + (b - a) * ratio)
  }

  return out
}

function deltaCounts(prev, curr) {
  const out = {}

  for (const key of COUNT_KEYS) out[key] = (curr[key] ?? 0) - (prev[key] ?? 0)

  return out
}

function syntheticLeadMinute({ m, robotTemplate, amrTemplate, endCounts, rackSlots, seed }) {
  // ease-out: 초반 빠르게 쌓이고 후반 안정
  const ratio = 1 - (1 - m / LEAD_MINUTES) ** 1.35
  const prevRatio = m === 1 ? 0 : 1 - (1 - (m - 1) / LEAD_MINUTES) ** 1.35
  const curr = lerpCounts({}, endCounts, ratio)
  const prev = lerpCounts({}, endCounts, prevRatio)
  const delta = deltaCounts(prev, curr)

  const robots = {}

  for (const [id, robot] of Object.entries(robotTemplate)) {
    const idle = !robot.cycles

    if (idle) {
      robots[id] = { cycles: 0, util: 100, state: 'idle' }
      continue
    }

    const progress = robot.cycles * ratio
    const util = 90 + (noise(seed, m + id.length) - 0.5) * 6

    robots[id] = {
      cycles: Math.round(progress),
      util: round1(clamp(util, 86, 97)),
      state: noise(seed + 3, m) > 0.22 ? 'working' : 'idle',
    }
  }

  const amrBusy = {}

  for (const [id, busy] of Object.entries(amrTemplate)) {
    amrBusy[id] = noise(seed + 7, m + id.length) < 0.55 + busy * 0.2 ? 1 : 0
  }

  const rackOccupancy = Math.round((endCounts.storedToRack ?? 90) * ratio * 0.93)

  return {
    m,
    tSim: m * 60,
    scans: { normal: Math.max(0, delta.scanned ?? 0), defect: Math.max(0, delta.defects ?? 0) },
    ...delta,
    wip: curr.wip,
    robots,
    amrBusy,
    rackOccupancy,
    rackSlots,
  }
}

const dir = path.resolve(ROOT)
const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf8'))
const source = JSON.parse(await readFile(path.join(dir, 'aggregates.json'), 'utf8'))
const rackSlots = manifest.rackOccupancyAtStart?.slots ?? source.rackOccupancy?.slots ?? 450
// 원본 20분만 있을 수도, 이미 320분이면 뒤 20분을 창으로 쓴다
const recordedWindow = source.historyLeadMinutes
  ? source.perMinute.slice(source.historyLeadMinutes)
  : source.perMinute
const robotTemplate = recordedWindow[0].robots
const amrTemplate = recordedWindow[0].amrBusy ?? {}

const lead = Array.from({ length: LEAD_MINUTES }, (_, index) =>
  syntheticLeadMinute({
    m: index + 1,
    robotTemplate,
    amrTemplate,
    endCounts: VIRTUAL_COUNTS_AT_START,
    rackSlots,
    seed: 12345,
  }),
)

const window = recordedWindow.map((row, index) => {
  const m = LEAD_MINUTES + index + 1

  return {
    ...row,
    m,
    tSim: FACTORY_ELAPSED_AT_START + (index + 1) * 60,
    robots: boostRobots(row.robots, m, 12345),
  }
})

const perMinute = [...lead, ...window]

const robotTotals = {}

for (const id of Object.keys(robotTemplate)) {
  const last = perMinute.at(-1).robots[id]

  robotTotals[id] = { cycles: last?.cycles ?? 0, utilization: last?.util ?? 100 }
}

const amrUtilization = {}

for (const id of Object.keys(amrTemplate)) {
  const busy = perMinute.reduce((sum, row) => sum + (row.amrBusy?.[id] ?? 0), 0)

  amrUtilization[id] = round1((busy / perMinute.length) * 100)
}

const endTotals = { ...VIRTUAL_COUNTS_AT_START }

for (const row of window) {
  for (const key of COUNT_KEYS) {
    if (key === 'wip') endTotals.wip = row.wip ?? endTotals.wip
    else endTotals[key] = (endTotals[key] ?? 0) + (row[key] ?? 0)
  }
}

const aggregates = {
  runId: source.runId,
  sampleMinutes: LEAD_MINUTES + WINDOW_MINUTES,
  historyLeadMinutes: LEAD_MINUTES,
  syntheticLead: true,
  perMinute,
  totals: endTotals,
  robots: boostTotals(robotTotals),
  amrUtilization,
  rackOccupancy: source.rackOccupancy,
}

manifest.factoryElapsedAtStart = FACTORY_ELAPSED_AT_START
manifest.historyLeadMinutes = LEAD_MINUTES
manifest.virtualCountsAtStart = VIRTUAL_COUNTS_AT_START
manifest.aggregatesNote = 'synthetic 5h cumulative stats for KPI; playback timeline remains the recorded 20m window'

await writeFile(path.join(dir, 'aggregates.json'), `${JSON.stringify(aggregates)}\n`)
await writeFile(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`)

const avgUtil =
  Object.values(perMinute.at(-1).robots).reduce((sum, robot) => sum + robot.util, 0) /
  Object.keys(perMinute.at(-1).robots).length

console.log(
  JSON.stringify(
    {
      sampleMinutes: aggregates.sampleMinutes,
      factoryElapsedAtStart: FACTORY_ELAPSED_AT_START,
      lead: LEAD_MINUTES,
      window: WINDOW_MINUTES,
      lastMinuteOeeApprox: round1(avgUtil),
      lastRobots: perMinute.at(-1).robots,
    },
    null,
    2,
  ),
)
