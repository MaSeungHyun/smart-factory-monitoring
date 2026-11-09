import { FACTORY_TEMPLATE, parseTemplate } from '@/features/template'
import type { SceneEquipment } from '@/shared/types'

/**
 * 창고 D라인 (x≈34.9). 미사용이라 씬·맵에서만 숨긴다.
 * id 순번은 재생 데이터와 맞춰야 해서 템플릿에서 지우지 않는다.
 */
const HIDDEN_EQUIPMENT_IDS = new Set([
  'rack-20',
  'rack-21',
  'rack-22',
  'rack-23',
  'rack-24',
  'rack-25',
  'rack-26',
  'rack-27',
  'rack-28',
])

export function isVisibleEquipment(item: SceneEquipment) {
  return !HIDDEN_EQUIPMENT_IDS.has(item.id)
}

/** 씬에 놓인 템플릿 장비 (id 는 재생 데이터와 같은 규칙, 숨긴 D라인 제외) */
export const sceneEquipment = parseTemplate(FACTORY_TEMPLATE).equipment.filter(isVisibleEquipment)
