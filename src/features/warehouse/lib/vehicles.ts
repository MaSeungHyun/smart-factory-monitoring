import { indexAt, kpiAt, kpiNumber, type ActiveAlarm } from '@/features/playback'
import { kpiKey } from '@/shared/constants/kpi'
import type { Tone } from '@/shared/constants/status'
import type { SceneEquipment } from '@/shared/types'
import type { EquipmentStateSample, PlaybackRun, StatusFrame } from '@/shared/types/playback'

import { LOW_BATTERY, MOCK_MOBILE_RACK, ROUTE_TEXT, SPEED_WINDOW } from '../config/warehouse.config'

export type VehicleCategory = 'amr' | 'agv' | 'forklift' | 'rack'

export interface Vehicle {
  id: string
  /** 화면 표시 코드 (AMR-01 …) */
  code: string
  category: VehicleCategory
  route: string
  /** 콜아웃 짧은 문구 */
  short: string
  tone: Tone
  statusLabel: string
  /** m/s (포즈 없는 장비 0) */
  speed: number
  /** 배터리 % (랙은 적재 %) */
  percent: number
  moving: boolean
  /** 목업 (재생 데이터에 없음) */
  mock?: boolean
  usedSlots?: string
  /** v4 KPI 가동률 (%), 예전 녹화면 없음 */
  utilization?: number
}

const PREFIX: Record<VehicleCategory, string> = { amr: 'AMR', agv: 'AGV', forklift: 'FORK', rack: 'RACK' }

const ORDER: VehicleCategory[] = ['amr', 'agv', 'forklift', 'rack']

const num = (id: string) => Number(id.split('-')[1])

const categoryOf = (entry: SceneEquipment): VehicleCategory => {
  const role = entry.settings?.amrRole

  if (role === 'forklift') return 'forklift'

  if (role === 'agv') return 'agv'

  return 'amr'
}

/** 템플릿 AMR (amrRole) + 활성 이동형 랙 → 종류별 표시 코드 */
export function vehicleRoster(equipment: SceneEquipment[], run: PlaybackRun) {
  const recorded = new Set(run.equipment.map((entry) => entry.id))

  const vehicles = equipment.filter((entry) => entry.kind === 'amr' && recorded.has(entry.id))

  const racks = equipment.filter((entry) => entry.kind === 'rack' && entry.settings?.rackType === 'mobile' && entry.settings?.enabled !== false)

  const list = [
    ...vehicles.map((entry) => ({ id: entry.id, category: categoryOf(entry) })),
    ...racks.map((entry) => ({ id: entry.id, category: 'rack' as const })),
  ].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category) || num(a.id) - num(b.id))

  const seen: Partial<Record<VehicleCategory, number>> = {}

  return list.map((entry) => {
    const n = (seen[entry.category] = (seen[entry.category] ?? 0) + 1)

    return { ...entry, code: `${PREFIX[entry.category]}-${String(n).padStart(2, '0')}` }
  })
}

export type Roster = ReturnType<typeof vehicleRoster>

/** 포즈 델타 속도 (m/s) */
function speedAt(run: PlaybackRun, id: string, time: number) {
  const poses = run.tracks.poses[id]

  if (!poses) return 0

  const times = run.tracks.t

  const i = indexAt(times, time)

  const j = Math.max(0, i - SPEED_WINDOW)

  const a = poses[j]

  const b = poses[i]

  if (!a || !b || i === j) return 0

  const speed = Math.hypot(b[0] - a[0], b[2] - a[2]) / (times[i] - times[j])

  return Math.round(speed * 10) / 10
}

const strip = (label: string) => label.replace(/^\[|\]/g, '').trim()

export function routeText(label: string | undefined, rack: string | null) {
  if (!label) return '—'

  for (const [pattern, text] of ROUTE_TEXT) {
    const match = label.match(pattern)

    if (match) return text.replace('$1', match[1] ?? '').replace('{rack}', rack ?? '').replace(/\s+·\s*$/, '').trim()
  }

  return strip(label)
}

function statusOf(sample: EquipmentStateSample | undefined, faulted: boolean): [Tone, string] {
  if (faulted || sample?.state === 'error') return ['error', '고장']

  if (sample?.state === 'charging') return ['warning', '충전 중']

  if (sample?.battery !== undefined && sample.battery < LOW_BATTERY) {
    return ['warning', `배터리 ${Math.round(sample.battery)}%`]
  }

  if (!sample || sample.state === 'idle') return ['warning', '대기']

  return ['running', '작동']
}

/** 재생 시각의 운반 장비 상태 (rackOf: 지게차가 향하는 랙 칸 이름) */
export function vehiclesAt(
  run: PlaybackRun,
  roster: Roster,
  frame: StatusFrame | null,
  time: number,
  alarms: ActiveAlarm[],
  rackOf: (id: string) => string | null,
): Vehicle[] {
  const faulted = new Set(alarms.filter((alarm) => alarm.severity === 'error').map((alarm) => alarm.equipmentId))

  const kpi = kpiAt(run.kpi, time)

  return roster.map(({ id, code, category }): Vehicle => {
    if (category === 'rack') {
      const percent = Math.round((MOCK_MOBILE_RACK.used / MOCK_MOBILE_RACK.slots) * 100)

      return {
        id,
        code,
        category,
        route: `임시 보관 ${MOCK_MOBILE_RACK.used}/${MOCK_MOBILE_RACK.slots} · 도크 대기`,
        short: '임시 보관',
        tone: 'warning',
        statusLabel: '대기',
        speed: 0,
        percent,
        moving: false,
        mock: true,
        usedSlots: `${MOCK_MOBILE_RACK.used} / ${MOCK_MOBILE_RACK.slots}`,
      }
    }

    const sample = frame?.equipment[id]

    const [tone, statusLabel] = statusOf(sample, faulted.has(id))

    const route = routeText(sample?.label, rackOf(id))

    const speed = speedAt(run, id, time)

    return {
      id,
      code,
      category,
      route,
      short: route.split('→').pop()?.trim() ?? route,
      tone,
      statusLabel,
      speed,
      percent: Math.round(sample?.battery ?? 0),
      moving: speed > 0.05,
      utilization: kpiNumber(kpi, kpiKey('vehicleUtilization', { vehicleId: id })) ?? kpiNumber(kpi, kpiKey('deviceUtilization', { deviceId: id })),
    }
  })
}
