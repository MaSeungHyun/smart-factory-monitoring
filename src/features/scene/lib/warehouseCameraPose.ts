import { Vector3 } from 'three'

import type { CameraPose } from './glbCameraPose'

/**
 * 창고 · AMR 탑뷰: factory.glb 에 창고 전용 카메라가 없어 직접 프레이밍.
 * 랙 구역(z -45 ~ -5) ~ 출고/입하 구역(z 60)을 가로로 놓도록 +x 쪽에서 아래를 내려다봄.
 */
const TARGET = new Vector3(-2, 0, -14)

const OFFSET = new Vector3(12, 60, 0)

const DEFAULT_FOV = 45

export function warehouseCameraPose(fov = DEFAULT_FOV): CameraPose {
  return { position: TARGET.clone().add(OFFSET), target: TARGET.clone(), fov }
}
