import type { EquipmentItem } from '@/shared/types'

/** 대시보드 값이 갱신될 때 장비 항목은 매번 새 객체로 온다. 표시 값이 모두 같으면 같은 항목으로 본다 (카드 리렌더 생략용) */
export function sameEquipmentItem(a: EquipmentItem, b: EquipmentItem) {
  if (a === b) return true

  const keys = Object.keys(a) as Array<keyof EquipmentItem>

  if (keys.length !== Object.keys(b).length) return false

  return keys.every((key) => a[key] === b[key])
}
