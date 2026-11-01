import factoryGlbV2 from '@/assets/templates/06-factory-glb-v2.json'
import factoryGlbUrl from '@/assets/templates/factory.glb?url'
import type { SceneTemplate } from '@/shared/types'

/** smart-factory 템플릿 06 (factory-glb-v2) 원본 JSON */
export const FACTORY_TEMPLATE = factoryGlbV2 as unknown as SceneTemplate

/** 템플릿 props 의 source "factory" 가 가리키는 GLB */
export const FACTORY_GLB_URL = factoryGlbUrl
