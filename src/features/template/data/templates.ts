import factoryGlbV2 from '@/assets/templates/06-factory-glb-v2.json'
import factoryGlbV2Optimized from '@/assets/templates/10-factory-glb-v2-optimized.json'
import factoryGlbUrl from '@/assets/templates/factory.glb?url'
import { ACTIVE_RUN, type ActiveRunConfig } from '@/shared/constants/activeRun'
import type { SceneTemplate } from '@/shared/types'

/**
 * 공장 배치 원본 JSON. 재생 녹화와 같은 템플릿이어야 장비 id(`${kind}-${index + 1}`)가 맞는다.
 * - 'v2': smart-factory 템플릿 06 (factory-glb-v2)
 * - 'v2-optimized': 템플릿 10 (factory-glb-v2-optimized)
 */
const TEMPLATES: Record<ActiveRunConfig['layout'], unknown> = {
  v2: factoryGlbV2,
  'v2-optimized': factoryGlbV2Optimized,
}

/** ACTIVE_RUN.layout 이 고른 배치 */
export const FACTORY_TEMPLATE = TEMPLATES[ACTIVE_RUN.layout] as SceneTemplate

/** 템플릿 props 의 source "factory" 가 가리키는 GLB */
export const FACTORY_GLB_URL = factoryGlbUrl
