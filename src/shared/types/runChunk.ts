import type { EquipmentKind } from './'
import type { PlaybackState, RunCounts } from './playback'
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
  sampleHz?: number
  jointNames: string[]
  armMount?: 'pedestal' | 'ground'
  chunkSeconds: number
  equipment: RunManifestEquipment[]
  chunks: RunManifestChunk[]
  aggregates?: string
}

// [2] chunk-NNN.json

/** [boxId, parentKind, parentId, x, y, z (cm)] */
export type ChunkSnapshotBox = [id: string, parentKind: string, parentId: string | null, x: number, y: number, z: number]

/** [palletId, state, grade, boxes, [x, y, z] m, yaw rad, "carrierKind|carrierId|uuid"] */
export type ChunkSnapshotPallet = [id: string, state: string, grade: string, boxes: number, pos: [number, number, number], yaw: number, carrierKey: string]

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
  perMinute: RunAggregateMinute[]
  totals: Record<string, number>
  robots: Record<string, { cycles: number; utilization: number }>
  amrUtilization: Record<string, number>
  rackOccupancy: { stored: number; slots: number }
}
