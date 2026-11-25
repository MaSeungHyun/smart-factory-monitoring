import { Vector3 } from 'three'

import type { CameraPose } from './glbCameraPose'

/** 랙 적재 상세(왼쪽 레일 창고 보기) 기본 시점 */
const POSITION = new Vector3(12.559, 3.269, -49.166)

const TARGET = new Vector3(8.839, 2.971, -37.401)

const DEFAULT_FOV = 45

export function warehouseCameraPose(fov = DEFAULT_FOV): CameraPose {
  return { position: POSITION.clone(), target: TARGET.clone(), fov }
}
