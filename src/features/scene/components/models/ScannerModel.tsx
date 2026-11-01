import type { Object3D } from 'three'

import { SCAN_TUNNEL_LIFT } from '../../constants/modelPlacement'
import { MODEL_URL } from '../../constants/modelUrls'
import { useCloned } from '../../lib/useCloned'

const placeTunnel = (model: Object3D) => {
  model.children.forEach((child) => child.position.set(0, 0, 0))

  model.position.y = SCAN_TUNNEL_LIFT

  return model
}

/** ScanTunnel.glb: 출구 벨트가 레일 벨트 위에 오도록 들어 올림 (신호색 표시는 생략) */
export default function ScannerModel() {
  return <primitive object={useCloned(MODEL_URL.scanTunnel, placeTunnel)} />
}
