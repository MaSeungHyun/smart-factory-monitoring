import { useFrame } from '@react-three/fiber'
import { Vector3 } from 'three'

import { vehicleTags } from '../lib/vehicleTags'

const point = new Vector3()

/** Canvas 안: 콜아웃 DOM 을 장비 화면 위치로 매 프레임 이동 (React 렌더 없음) */
export default function VehicleTags3D() {
  useFrame(({ scene, camera, size }) => {
    for (const [id, element] of vehicleTags) {
      const object = scene.getObjectByName(id)

      if (!object) {
        element.style.visibility = 'hidden'

        continue
      }

      object.getWorldPosition(point)

      point.project(camera)

      const x = (point.x * 0.5 + 0.5) * size.width

      const y = (-point.y * 0.5 + 0.5) * size.height

      const visible = point.z < 1 && x > 0 && x < size.width && y > 40 && y < size.height

      element.style.visibility = visible ? 'visible' : 'hidden'

      element.style.transform = `translate(${x}px, ${y}px)`
    }
  })

  return null
}
