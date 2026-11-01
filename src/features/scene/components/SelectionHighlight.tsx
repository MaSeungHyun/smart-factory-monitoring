import { useFrame } from '@react-three/fiber'
import { Box3, BoxGeometry, Color, EdgesGeometry, LineBasicMaterial, LineSegments, Matrix4, Quaternion, Vector3, type Object3D } from 'three'

import { getHover, uiStore } from '@/shared/stores/useUiStore'

import { equipmentById, equipmentLocalBox, OUTLINE_PAD, refreshRobotBox } from '../lib/boundsRaycast'

const SELECTED = new Color('#4fa8d4')

const HOVER = new Color('#9aa4b2')

const center = new Vector3()

const size = new Vector3()

const fit = new Matrix4()

const padded = new Box3()

const identity = new Quaternion()

function makeOutline(color: Color) {
  const geometry = new EdgesGeometry(new BoxGeometry(2, 2, 2))

  const material = new LineBasicMaterial({ color, transparent: true })

  const lines = new LineSegments(geometry, material)

  lines.visible = false

  lines.matrixAutoUpdate = false

  lines.raycast = () => undefined

  return lines
}

/** 상주 씬은 하나뿐이라 모듈 단일 인스턴스 */
const selected = makeOutline(SELECTED)

const hover = makeOutline(HOVER)

const selectedMaterial = selected.material as LineBasicMaterial

const pairs: Array<[LineSegments, string | null]> = [
  [selected, null],
  [hover, null],
]

/** 장비 로컬 박스(픽과 같은 여유)를 장비 회전에 맞춰 그린다. 월드 AABB 는 모서리가 픽 밖으로 나가 선 위에서 호버가 풀린다 */
function placeOutline(lines: LineSegments, host: Object3D, local: Box3) {
  local.getCenter(center)

  local.getSize(size).multiplyScalar(0.5)

  fit.compose(center, identity, size)

  host.updateWorldMatrix(true, false)

  lines.matrix.copy(host.matrixWorld).multiply(fit)

  lines.matrixWorldNeedsUpdate = true

  lines.visible = true
}

function outlineBox(host: Object3D) {
  if (!equipmentLocalBox(host, padded)) return null

  return padded.expandByScalar(OUTLINE_PAD)
}

/** 선택 장비(맥동하는 파란 외곽) · 호버 장비(옅은 외곽). 움직이는 장비도 매 프레임 따라감 */
export default function SelectionHighlight() {
  useFrame(({ clock }) => {
    pairs[0][1] = uiStore.getState().selectedId

    pairs[1][1] = getHover()

    if (pairs[1][1] === pairs[0][1]) pairs[1][1] = null

    for (const [lines, id] of pairs) {
      const target = equipmentById(id)

      lines.visible = false

      if (!target?.visible) continue

      refreshRobotBox(target)

      const local = outlineBox(target)

      if (!local) continue

      placeOutline(lines, target, local)
    }

    selectedMaterial.opacity = 0.65 + 0.35 * Math.sin(clock.elapsedTime * 4)
  })

  return (
    <>
      <primitive object={selected} />

      <primitive object={hover} />
    </>
  )
}
