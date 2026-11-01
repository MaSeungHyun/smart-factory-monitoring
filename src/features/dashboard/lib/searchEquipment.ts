import type { EquipmentItem, SceneEquipment } from '@/shared/types'

export interface SearchEntry {
  id: string
  name: string
  detail: string
}

const KIND_LABEL: Record<string, string> = {
  conveyor: '컨베이어',
  rack: '랙',
  dock: '도크',
  transfer: '이송',
  pallet: '팔레트',
}

/** 검색 대상: 실시간 장비 목록 + 템플릿의 나머지 장비 (랙 · 컨베이어 …) */
export function searchEntries(equipment: EquipmentItem[], scene: SceneEquipment[]): SearchEntry[] {
  const known = new Set(equipment.map((item) => item.id))

  const live = equipment.map((item) => ({ id: item.id, name: item.name, detail: `${item.process} · ${item.statusLabel}` }))

  const rest = scene
    .filter((entity) => !known.has(entity.id))
    .map((entity) => ({ id: entity.id, name: entity.id, detail: KIND_LABEL[entity.kind] ?? entity.kind }))

  return [...live, ...rest]
}

export function filterEntries(entries: SearchEntry[], query: string, limit = 8) {
  const needle = query.trim().toLowerCase()

  if (!needle) return []

  return entries.filter((entry) => entry.id.toLowerCase().includes(needle) || entry.name.toLowerCase().includes(needle)).slice(0, limit)
}
