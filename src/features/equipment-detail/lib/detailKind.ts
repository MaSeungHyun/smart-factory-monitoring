import { sceneEquipment } from '@/features/scene/lib/sceneEquipment'
import type { PlaybackRun } from '@/shared/types/playback'
import { vehicleRoster } from '@/features/warehouse/lib/vehicles'

/** 장비 상세에서 패널·마커를 가르는 종류 */
export type DetailKind = 'robot' | 'agv' | 'amr' | 'forklift'

export type VehicleKind = Exclude<DetailKind, 'robot'>

const TITLE: Record<DetailKind, string> = {
  robot: '팔레트 적재 로봇',
  agv: '팔레트 운반 AGV',
  amr: '팔레트 운반 AMR',
  forklift: '지게차',
}

export function detailTitle(kind: DetailKind) {
  return TITLE[kind]
}

/** 재생 id → 상세 종류. 로봇·AMR 계열이 아니면 null */
export function detailKind(id: string): DetailKind | null {
  if (id.startsWith('robot-')) return 'robot'

  if (!id.startsWith('amr-')) return null

  const role = sceneEquipment.find((entry) => entry.id === id)?.settings?.amrRole

  if (role === 'agv') return 'agv'

  if (role === 'forklift') return 'forklift'

  return 'amr'
}

export interface DetailOption {
  id: string
  kind: DetailKind
  label: string
  badge: string
}

const badgeOf = (code: string) => String(Number(code.split('-')[1] ?? code.replace(/\D/g, '')) || 0)

/** 상세 화면에서 고를 수 있는 로봇 + 운반 장비 */
export function detailOptions(run: PlaybackRun): DetailOption[] {
  const robots = run.equipment
    .filter((entry) => entry.kind === 'robot')
    .map((entry): DetailOption => ({
      id: entry.id,
      kind: 'robot',
      label: `${TITLE.robot} · ${entry.name}`,
      badge: entry.id.replace(/\D/g, '').slice(-1) || '1',
    }))

  const vehicles = vehicleRoster(sceneEquipment, run)
    .filter((entry) => entry.category !== 'rack')
    .map((entry): DetailOption => {
      const kind = entry.category === 'agv' || entry.category === 'forklift' ? entry.category : 'amr'

      return {
        id: entry.id,
        kind,
        label: `${TITLE[kind]} · ${entry.code}`,
        badge: badgeOf(entry.code),
      }
    })

  return [...robots, ...vehicles]
}
