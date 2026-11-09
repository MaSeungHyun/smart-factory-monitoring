import type { EquipmentKind } from './'
import type { PlaybackState, RunCounts } from './playback'
import type { AnimatedPart, AnimatedPartRow, AnimatedPartValue } from './animatedParts'
import type { KpiRow, KpiSample, KpiSchema } from './kpi'
import type { SimRecording } from './runEvents'

/**
 * robot_IK 헤드리스 녹화 (manifest + chunk + aggregates) 원본 형식.
 * t 는 절대 시뮬 시간이라 manifest.simTimeOffset 을 빼서 재생 시간으로 쓴다.
 */

// [1] manifest.json

export interface RunManifestEquipment {
  id: string
  kind: EquipmentKind
  name: string
  /** [x, z] m */
  pos: [number, number]
  yaw: number
  elevation: number
}

export interface RunManifestChunk {
  i: number
  t0: number
  t1: number
  file: string
  bytes: number
}

export interface RunManifest {
  version: 1
  runId: string
  template?: string
  duration: number
  simTimeOffset: number
  /** UI·집계용 공장 가동 경과(초). 없으면 simTimeOffset. 상세 청크보다 긴 가상 이력을 붙일 때 사용 */
  factoryElapsedAtStart?: number
  historyLeadMinutes?: number
  sampleHz?: number | Record<string, number>
  jointNames: string[]
  armMount?: 'pedestal' | 'ground'
  chunkSeconds: number
  equipment: RunManifestEquipment[]
  chunks: RunManifestChunk[]
  aggregates?: string
  /** v3: 장비별 움직이는 파츠 (없으면 예전 녹화) */
  animatedParts?: AnimatedPart[]
  animatedPartsEncoding?: string
  /** v4: KPI 스트림 스키마 (없으면 예전 녹화, 파생값 사용) */
  kpiSchema?: KpiSchema
  kpiEncoding?: string
}

// [2] chunk-NNN.json

/** [boxId, parentKind, parentId, x, y, z (cm)] */
export type ChunkSnapshotBox =
  | [id: string, parentKind: string, parentId: string | null, x: number, y: number, z: number]
  | [id: string, parentKind: string, parentId: string | null, x: number, y: number, z: number, qx: number, qy: number, qz: number, qw: number, ...local: number[]]

/** [palletId, state, grade, boxes, [x, y, z] m, yaw rad, "carrierKind|carrierId|uuid"] */
export type ChunkSnapshotPallet = [id: string, state: string, grade: string, boxes: number, pos: [number, number, number], yaw: number, carrierKey: string | null]

/** [occupied 0/1, palletId, grade, boxes] */
export type ChunkRackSlot = [occupied: number, palletId: string | null, grade: string | null, boxes: number]

export interface ChunkSnapshot {
  t: number
  boxes: ChunkSnapshotBox[]
  pallets: ChunkSnapshotPallet[]
  racks: { id: string; slots: ChunkRackSlot[] }[]
  /** robotId -> 흡착 중인 boxId */
  suction: Record<string, string | null>
  counts: Record<string, number>
  /** v3: animatedParts[i] 의 청크 시작 값 (null = 아직 없음) */
  parts?: (AnimatedPartValue | null)[]
  /** v4: 청크 시작 시점 KPI 샘플 */
  kpi?: KpiSample
}

export interface ChunkStatusRow {
  t: number
  counts?: Partial<Record<string, number>>
  /** 변화한 설비만 (첫 행은 전체) */
  equipment?: Record<string, { state: PlaybackState; label: string; count?: number; [key: string]: unknown }>
}

export interface RunChunk {
  meta: { chunk: number; t0: number; t1: number; poseHz: number; statusHz: number; jointNames: string[] }
  snapshot: ChunkSnapshot
  tracks: {
    t: number[]
    /** robotId -> 프레임별 관절 (0.1 deg 정수) */
    joints: Record<string, number[][]>
    /** amrId -> 프레임별 [x cm, z cm, yaw 0.1 deg] */
    amrs: Record<string, ([number, number, number] | null)[]>
    /** v3: [t, part index, value] (변화가 threshold 이상일 때만) */
    parts?: AnimatedPartRow[]
    /** v4: 1Hz KPI 행 [t, 샘플] */
    kpi?: KpiRow[]
  }
  status: ChunkStatusRow[]
  events: { t: number; equipmentId: string; from: PlaybackState | null; to: PlaybackState }[]
  alarms?: { id: string; t: number; until?: number; equipmentId: string; severity: string; message: string; source?: string }[]
  recording: SimRecording
}

// [3] aggregates.json

export interface RunAggregateMinute extends Partial<RunCounts> {
  m: number
  tSim: number
  robots: Record<string, { cycles: number; util: number; state: string }>
  amrBusy?: Record<string, number>
  rackOccupancy?: number
  rackSlots?: number
}

export interface RunAggregates {
  runId: string
  sampleMinutes: number
  /** 상세 창 앞쪽 가상 이력 분 수 (없으면 0) */
  historyLeadMinutes?: number
  syntheticLead?: boolean
  perMinute: RunAggregateMinute[]
  totals: Record<string, number>
  robots: Record<string, { cycles: number; utilization: number }>
  amrUtilization: Record<string, number>
  rackOccupancy: { stored: number; slots: number }
}
