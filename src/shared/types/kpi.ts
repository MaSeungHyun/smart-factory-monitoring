/**
 * robot_IK 녹화 KPI 스트림 (manifest.kpiSchema + chunk tracks.kpi).
 * 수량은 시뮬 t=0 부터의 하루 누계 (워밍업 포함, 단조 증가).
 */

// [1] manifest.kpiSchema

export type KpiStageId = 'inbound' | 'depalletize' | 'scan' | 'palletize' | 'rackStore' | 'outbound' | 'ship'

export interface KpiSchemaStage {
  id: KpiStageId
  unit: 'boxes' | 'pallets'
  count?: string
  wip?: string
  progressOf?: string
}

export interface KpiSchemaKey {
  /** 점 경로. <stage> 같은 자리표시자 포함 */
  key: string
  unit: string
  type: string
  meaning?: string
}

export interface KpiSchema {
  version: number
  sampleHz: number
  encoding?: string
  placeholders?: Record<string, string>
  stages: KpiSchemaStage[]
  keys: KpiSchemaKey[]
}

// [2] 샘플 (1Hz, 전체 객체)

export interface KpiStage {
  count: number
  wip: number
  progress: number
}

export interface KpiScanCounts {
  scanned: number
  pass: number
  defect: number
  passRate: number | null
  defectRate: number | null
}

export interface KpiSample {
  t: number
  throughput?: { processed: number; perHour: number; perMinute: number; avgPerHour: number }
  stages?: Partial<Record<KpiStageId, KpiStage>>
  wip?: { boxes: number; pallets: number }
  pallets?: { full: number }
  boxes?: { passed: number }
  scan?: KpiScanCounts & { scanners: number; byScanner?: Record<string, KpiScanCounts> }
  rack?: { stored: number; reserved: number; slots: number; occupancy: number }
  vehicles?: { total: number; busy: number; utilization: number; byId?: Record<string, { utilization: number; state: string }> }
  devices?: Record<string, { kind: 'robot' | 'vehicle' | 'scanner'; state: string; utilization: number | null }>
  robots?: Record<string, { cycles: number; cycleTimeLast: number | null; cycleTimeAvg: number | null; busyPerCycle: number | null; utilization: number }>
}

/** chunk tracks.kpi 한 행: [절대 시뮬 시각 s, 샘플] */
export type KpiRow = [t: number, sample: KpiSample]

/** 재생 시간 기준으로 옮긴 KPI 트랙 (t 오름차순) */
export interface KpiTrack {
  t: number[]
  samples: KpiSample[]
  schema?: KpiSchema
}
