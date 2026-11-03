import { findPartNode, registerPartHandler, type PartHandler } from '@/shared/lib/animatedParts'

import { DOOR_OPEN_RATIO, TRANSFER_FORK_REST_Y } from '../constants/modelPlacement'

/**
 * 모델별 procedural 파츠 규칙 (robot_IK docs/sim-recording.md "Animated parts").
 * GLB 노드를 그대로 움직이는 파츠는 기본 규칙이 처리하므로 여기 넣지 않는다.
 */

// [1] 셔터 문: fraction 0..1 -> 커튼 scale.y = 1 - 0.5 * fraction

const doorCurtain: PartHandler = {
  match: (part) => part.kind === 'door' && part.channel === 'fraction',
  apply: (node, value) => {
    if (typeof value === 'number') node.scale.y = 1 - DOOR_OPEN_RATIO * value
  },
}

// [2] 레일 리프트: 포크 y 와 함께 carriage 가 (포크 y - 휴지 y) 만큼 움직인다

const transferFork: PartHandler = {
  match: (part) => part.kind === 'transfer' && !part.procedural && part.channel === 'posY',
  apply: (node, value, _part, root) => {
    if (typeof value !== 'number') return

    node.position.y = value

    const carriage = findPartNode(root, 'carriage')

    if (carriage) carriage.position.y = value - TRANSFER_FORK_REST_Y
  },
}

/** 스토퍼: carriage 기준 로컬 y */
const transferStopper: PartHandler = {
  match: (part) => part.kind === 'transfer' && part.procedural === true && part.parent !== undefined,
  bind: (root, part) => {
    const parent = findPartNode(root, part.parent ?? '')

    return parent ? findPartNode(parent, part.partName) : null
  },
  apply: (node, value) => {
    if (typeof value === 'number') node.position.y = value
  },
}

/** 씬 모듈이 불러올 때 한 번 등록 */
export function registerScenePartHandlers() {
  registerPartHandler(doorCurtain)

  registerPartHandler(transferFork)

  registerPartHandler(transferStopper)
}