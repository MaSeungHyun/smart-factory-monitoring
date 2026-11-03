/**
 * 패널 표시값 -> KPI 스키마 키 (manifest.kpiSchema.keys 의 점 경로).
 * 자리표시자 (<robotId> 등) 는 kpiKey() 로 채운다. 새 키는 여기만 추가하면 된다
 */
export const KPI_KEYS = {
  // 오늘 현황
  processed: 'throughput.processed',
  perHour: 'throughput.perHour',
  inbound: 'stages.inbound.count',
  outbound: 'stages.ship.count',
  defects: 'scan.defect',
  defectRate: 'scan.defectRate',

  // 공정 흐름
  stageCount: 'stages.<stage>.count',
  stageProgress: 'stages.<stage>.progress',
  stageWip: 'stages.<stage>.wip',

  // 스캔
  scanned: 'scan.scanned',
  scannerScanned: 'scan.byScanner.<scannerId>.scanned',
  scannerDefect: 'scan.byScanner.<scannerId>.defect',
  scannerPassRate: 'scan.byScanner.<scannerId>.passRate',
  scannerDefectRate: 'scan.byScanner.<scannerId>.defectRate',

  // 랙
  rackStored: 'rack.stored',
  rackSlots: 'rack.slots',
  rackOccupancy: 'rack.occupancy',

  // 운반 장비 · 설비
  vehicleUtilization: 'vehicles.byId.<vehicleId>.utilization',
  fleetUtilization: 'vehicles.utilization',
  deviceUtilization: 'devices.<deviceId>.utilization',
  deviceState: 'devices.<deviceId>.state',

  // 로봇
  robotCycles: 'robots.<robotId>.cycles',
  robotCycleLast: 'robots.<robotId>.cycleTimeLast',
  robotCycleAvg: 'robots.<robotId>.cycleTimeAvg',
  robotUtilization: 'robots.<robotId>.utilization',
} as const

export type KpiKeyName = keyof typeof KPI_KEYS

/** 자리표시자 채우기: kpiKey('robotCycles', { robotId: 'robot-1' }) -> 'robots.robot-1.cycles' */
export function kpiKey(name: KpiKeyName, params: Record<string, string> = {}) {
  return KPI_KEYS[name].replace(/<(\w+)>/g, (match, key: string) => params[key] ?? match)
}

/** 공정 흐름 카드 -> KPI 공정 (같은 단위로 맞춘 대응) */
export const KPI_STAGE_OF = {
  inbound: 'inbound',
  conveyor: 'depalletize',
  scan: 'scan',
  pallet: 'palletize',
  amr: 'rackStore',
  outbound: 'ship',
} as const

export const KPI_UNIT_LABEL: Record<string, string> = { boxes: '박스', pallets: '팔레트' }
