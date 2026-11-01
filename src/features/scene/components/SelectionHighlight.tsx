import { useFrame } from '@react-three/fiber'
import { Box3, Box3Helper, Color } from 'three'

import { useUi } from '@/shared/hooks/useUi'

const SELECTED = new Color('#4fa8d4')

const HOVER = new Color('#9aa4b2')

function makeHelper(color: Color) {
  const helper = new Box3Helper(new Box3(), color)

  helper.visible = false

  helper.raycast = () => undefined

  const material = helper.material as { transparent: boolean }

  material.transparent = true

  return helper
}

/** 상주 씬은 하나뿐이라 모듈 단일 인스턴스 */
const selected = makeHelper(SELECTED)

const hover = makeHelper(HOVER)

const selectedMaterial = selected.material as { opacity: number }

/** 선택 장비(맥동하는 파란 외곽) · 호버 장비(옅은 외곽) 바운딩 박스. 움직이는 장비도 매 프레임 따라감 */
export default function SelectionHighlight() {
  const { selectedId, hoverId } = useUi()

  useFrame(({ scene, clock }) => {
    const pairs: Array<[Box3Helper, string | null]> = [
      [selected, selectedId],
      [hover, hoverId !== selectedId ? hoverId : null],
    ]

    for (const [helper, id] of pairs) {
      const target = id ? scene.getObjectByName(id) : null

      helper.visible = Boolean(target?.visible)

      if (target) helper.box.setFromObject(target).expandByScalar(0.15)
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
