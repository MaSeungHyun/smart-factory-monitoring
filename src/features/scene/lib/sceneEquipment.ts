import { FACTORY_TEMPLATE, parseTemplate } from '@/features/template'

/** 씬에 놓인 템플릿 장비 (id 는 재생 데이터와 같은 규칙) */
export const sceneEquipment = parseTemplate(FACTORY_TEMPLATE).equipment
