import type { TemplateProp } from '@/shared/types'

/** factory.glb 의 고정 랙(Prop_Rack_m*) — 이동형 Rack_m* 노드는 장비로 따로 배치되므로 제외 */
const FACTORY_PROP_RACK_NODES = ['Prop_Rack_m', 'Prop_Rack_m.001', 'Prop_Rack_m.002']

const SHELL_NODE = 'Enviroment'

/**
 * smart-factory factoryShellMigration 축약판:
 * - Enviroment 셸의 excludeMaterials 제거 (벽·바닥까지 GLB 그대로 표시)
 * - 누락된 고정 랙 노드 추가
 */
export function migrateFactoryShell(props: TemplateProp[]) {
  const migrated = props.map((prop) =>
    prop.node === SHELL_NODE ? { ...prop, excludeMaterials: undefined } : prop,
  )

  const nodes = new Set(migrated.map((prop) => prop.node))

  const missing = FACTORY_PROP_RACK_NODES.filter((node) => !nodes.has(node)).map(
    (node): TemplateProp => ({ source: 'factory', node }),
  )

  return [...migrated, ...missing]
}
