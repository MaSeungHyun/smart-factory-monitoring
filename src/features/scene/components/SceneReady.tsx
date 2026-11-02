import { addAfterEffect, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { Vector2 } from 'three'

import { sceneReady } from '@/shared/stores/sceneReady'

const buffer = new Vector2()

/** 에셋 로드 뒤 셰이더 컴파일·첫 프레임까지 끝난 뒤에 로딩 화면을 닫게 한다 */
export default function SceneReady() {
  const gl = useThree((state) => state.gl)

  const frames = useRef(0)

  useEffect(() => {
    return addAfterEffect(() => {
      if (sceneReady.getState().ready) return

      const canvas = gl.domElement

      if (canvas.clientWidth < 2 || canvas.clientHeight < 2) {
        frames.current = 0

        return
      }

      if ('getDrawingBufferSize' in gl) {
        gl.getDrawingBufferSize(buffer)

        if (buffer.x < 2 || buffer.y < 2) {
          frames.current = 0

          return
        }
      }

      frames.current += 1

      if (frames.current >= 2) sceneReady.getState().mark()
    })
  }, [gl])

  return null
}
