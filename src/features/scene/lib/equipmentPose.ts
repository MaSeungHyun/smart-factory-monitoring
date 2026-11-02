import type { SceneEquipment } from '@/shared/types'

import {
  AMR_DECK,
  BASE_FOOTPRINT,
  BASE_PALLET_POINT,
  ROBOT_PEDESTALS,
} from '../constants/modelPlacement'

/** 받침대가 있으면 팔 높이는 받침대 point 높이 */
function robotElevation(robot: SceneEquipment) {
  const pedestal = robot.settings?.robotPedestal

  return pedestal && pedestal !== 'none' ? ROBOT_PEDESTALS[pedestal].elevation : (robot.elevation ?? 0)
}

type Position = [number, number, number]

/** robot_IK palletPedestalPose: robot_base 받침대 위 고정 팔레트는 pallet_point 로 x/y/z 를 맞춘다 */
function palletPosition(pallet: SceneEquipment, all: SceneEquipment[]): Position {
  // 위에 AMR 이 실린 팔레트 (x/z 는 템플릿에서 이미 AMR 과 같다)
  if (pallet.settings?.mountedOn) return [pallet.x, AMR_DECK, pallet.z]

  for (const robot of all) {
    if (robot.kind !== 'robot' || robot.settings?.robotPedestal !== 'base') continue

    const yaw = robot.yaw + ((robot.settings.robotPedestalYaw ?? 0) * Math.PI) / 180

    const c = Math.cos(yaw)

    const sn = Math.sin(yaw)

    const dx = pallet.x - robot.x

    const dz = pallet.z - robot.z

    const x = dx * c - dz * sn

    const z = dx * sn + dz * c

    const f = BASE_FOOTPRINT

    if (x < f.minX || x > f.maxX || z < f.minZ || z > f.maxZ) continue

    const p = BASE_PALLET_POINT

    return [
      robot.x + p.x * c + p.z * sn,
      ROBOT_PEDESTALS.base.elevation + p.y,
      robot.z - p.x * sn + p.z * c,
    ]
  }

  return [pallet.x, pallet.elevation ?? 0, pallet.z]
}

/** 장비 그룹 위치 (yaw 는 템플릿 값 그대로) */
export function equipmentPosition(entity: SceneEquipment, all: SceneEquipment[]): Position {
  if (entity.kind === 'robot') return [entity.x, robotElevation(entity), entity.z]

  if (entity.kind === 'pallet') return palletPosition(entity, all)

  return [entity.x, entity.elevation ?? 0, entity.z]
}
