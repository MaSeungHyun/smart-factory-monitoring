import { sceneEquipment } from './sceneEquipment'

/** 라벨·콜아웃 기준점을 장비 윗면 대신 바닥에 두는 AMR 역할. 지게차는 포크로 팔레트를 높이 올려 윗면 기준이면 라벨이 짐 · 랙과 함께 오르내리고 가린다 */
const LABEL_BELOW_ROLES = new Set(['forklift', 'rack'])

const cache = new Map<string, boolean>()

/** 이 장비의 호버 칩 · 선택 콜아웃 기준점을 바닥에 두는지 (라벨은 그대로 위로 뜬다. id 별로 한 번만 찾는다) */
export function labelsBelow(id: string) {
  const cached = cache.get(id)

  if (cached !== undefined) return cached

  const role = sceneEquipment.find((entry) => entry.id === id)?.settings?.amrRole

  const below = role !== undefined && LABEL_BELOW_ROLES.has(role)

  cache.set(id, below)

  return below
}
