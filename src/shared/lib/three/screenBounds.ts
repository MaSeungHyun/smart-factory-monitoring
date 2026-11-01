import { Box3, Vector3, type Camera, type Object3D } from 'three'

const box = new Box3()

const corner = new Vector3()

export interface ScreenRect {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 오브젝트 월드 바운딩 박스를 화면 픽셀 사각형으로 투영 (코너가 카메라 뒤로 가면 = 로봇이 화면을 감싼 상태 → 화면 전체) */
export function screenBounds(object: Object3D, camera: Camera, width: number, height: number, out: ScreenRect) {
  object.updateWorldMatrix(true, true)

  box.setFromObject(object)

  if (box.isEmpty()) return null

  out.minX = Infinity

  out.minY = Infinity

  out.maxX = -Infinity

  out.maxY = -Infinity

  for (let i = 0; i < 8; i++) {
    corner.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).project(camera)

    if (corner.z > 1) {
      out.minX = 0

      out.minY = 0

      out.maxX = width

      out.maxY = height

      return out
    }

    const x = ((corner.x + 1) / 2) * width

    const y = ((1 - corner.y) / 2) * height

    out.minX = Math.min(out.minX, x)

    out.minY = Math.min(out.minY, y)

    out.maxX = Math.max(out.maxX, x)

    out.maxY = Math.max(out.maxY, y)
  }

  return out
}
