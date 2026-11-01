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

/** 고정 팔레트가 robot_base 받침대 윗면에 있으면 그 높이, 아니면 바닥 */
function palletElevation(pallet: SceneEquipment, all: SceneEquipment[]) {
  // 셔틀 AMR 에 실린 팔레트 (x/z 는 템플릿에서 이미 AMR 과 같다)
  if (pallet.settings?.mountedOn) return AMR_DECK

  for (const robot of all) {
    if (robot.kind !== 'robot' || robot.settings?.robotPedestal !== 'base') continue

    const yaw = robot.yaw + ((robot.settings.robotPedestalYaw ?? 0) * Math.PI) / 180

    const dx = pallet.x - robot.x

    const dz = pallet.z - robot.z

    const x = dx * Math.cos(yaw) - dz * Math.sin(yaw)

    const z = dx * Math.sin(yaw) + dz * Math.cos(yaw)

    const f = BASE_FOOTPRINT

    if (x >= f.minX && x <= f.maxX && z >= f.minZ && z <= f.maxZ) {
      return ROBOT_PEDESTALS.base.elevation + BASE_PALLET_POINT.y
    }
  }

  return pallet.elevation ?? 0
}

/** 장비 그룹의 y (x/z/yaw 는 템플릿 값 그대로) */
export function equipmentElevation(entity: SceneEquipment, all: SceneEquipment[]) {
  if (entity.kind === 'robot') return robotElevation(entity)

  if (entity.kind === 'pallet') return palletElevation(entity, all)

  return entity.elevation ?? 0
}
