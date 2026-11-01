import type { SceneEquipment, SceneTemplate, TemplateEquipment, TemplateProp } from '@/shared/types'

import { migrateFactoryShell } from './migrateFactoryShell'

export interface ParsedTemplate {
  id: string
  camera: SceneTemplate['camera']
  equipment: SceneEquipment[]
  props: TemplateProp[]
}

/**
 * smart-factory migrateTemplateDocks 와 동일하게, 빈 팔레트 적치장(palletSource)이 아닌 dock 은
 * 장비 목록에서 빠진다 (원본은 정지 지점으로 옮김). id 순번이 원본과 맞도록 같은 규칙을 적용.
 */
const isRemovedDock = (entry: TemplateEquipment) =>
  entry.kind === 'dock' && (entry.settings?.dockRole ?? 'ship') !== 'palletSource'

/**
 * 템플릿 JSON -> 표시용 데이터.
 * 장비 id 는 smart-factory loadTemplate 과 같은 `${kind}-${index + 1}` (index = 마이그레이션 후 전체 배열 순번).
 * 예: equipment[2] 가 amr 이면 "amr-3". JSON 재생 시 이 id 로 매칭.
 */
export function parseTemplate(template: SceneTemplate): ParsedTemplate {
  const source = template.equipment

  const kept = source.filter((entry) => !isRemovedDock(entry))

  // 원본 index -> 새 index (mountedOn 같은 id 참조를 다시 맞추기 위함)
  const remap = new Map<number, number>()

  source.forEach((entry, index) => {
    if (!isRemovedDock(entry)) remap.set(index, remap.size)
  })

  const retarget = (value: string | undefined) => {
    const match = value?.match(/^(\w+)-(\d+)$/)

    if (!match) return value

    const next = remap.get(Number(match[2]) - 1)

    return next === undefined ? value : `${match[1]}-${next + 1}`
  }

  const equipment = kept.map((entry, index): SceneEquipment => {
    const settings = entry.settings?.mountedOn
      ? { ...entry.settings, mountedOn: retarget(entry.settings.mountedOn) }
      : entry.settings

    return { ...entry, settings, id: `${entry.kind}-${index + 1}` }
  })

  return {
    id: template.id,
    camera: template.camera,
    equipment,
    props: migrateFactoryShell(template.props ?? []),
  }
}
