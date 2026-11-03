import type { Object3D } from 'three'

import { findGlbNode } from '@/shared/lib/three/glbNode'
import type { AnimatedPart, AnimatedPartValue } from '@/shared/types/animatedParts'

/**
 * 파츠 값 적용 규칙.
 * 기본은 channel 을 노드 로컬 변환에 그대로 넣고, 종류별 예외(procedural)는 핸들러로 등록한다.
 * 새 장비는 GLB 노드 이름만 맞으면 기본 규칙으로 바로 움직인다.
 */

// [1] 핸들러 레지스트리

export interface PartHandler {
  /** 이 파츠를 맡을지 */
  match: (part: AnimatedPart) => boolean
  /** 노드를 찾거나 만든다. null 이면 적용하지 않는다 */
  bind?: (root: Object3D, part: AnimatedPart) => Object3D | null
  apply: (node: Object3D, value: AnimatedPartValue, part: AnimatedPart, root: Object3D) => void
}

const handlers: PartHandler[] = []

/** 앞에 등록한 핸들러가 우선. 같은 핸들러를 두 번 넣지 않는다 (HMR) */
export function registerPartHandler(handler: PartHandler) {
  if (!handlers.includes(handler)) handlers.unshift(handler)
}

// [2] 기본 규칙 (노드 로컬 pos / rot / quat)

export function findPartNode(root: Object3D, name: string) {
  return findGlbNode(root, name) ?? null
}

export function applyChannel(node: Object3D, part: AnimatedPart, value: AnimatedPartValue) {
  if (Array.isArray(value)) {
    if (part.channel === 'quat') node.quaternion.set(value[0], value[1], value[2], value[3])

    return
  }

  switch (part.channel) {
    case 'posX':
      node.position.x = value
      break

    case 'posY':
      node.position.y = value
      break

    case 'posZ':
      node.position.z = value
      break

    case 'rotX':
      node.rotation.x = value
      break

    case 'rotY':
      node.rotation.y = value
      break

    case 'rotZ':
      node.rotation.z = value
      break

    default:
      // fraction / speed 는 핸들러가 없으면 의미를 모른다
      break
  }
}

const DEFAULT_HANDLER: PartHandler = {
  match: (part) => !part.procedural,
  apply: (node, value, part) => applyChannel(node, part, value),
}

// [3] 바인딩

export interface PartBinding {
  node: Object3D
  root: Object3D
  handler: PartHandler
}

/** 장비 그룹(root) 안에서 파츠 노드를 찾는다. 맡을 규칙이나 노드가 없으면 null */
export function bindPart(root: Object3D, part: AnimatedPart): PartBinding | null {
  const handler = handlers.find((entry) => entry.match(part)) ?? (DEFAULT_HANDLER.match(part) ? DEFAULT_HANDLER : null)

  if (!handler) return null

  const node = handler.bind ? handler.bind(root, part) : findPartNode(root, part.partName)

  return node ? { node, root, handler } : null
}