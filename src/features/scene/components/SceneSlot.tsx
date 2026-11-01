import { useLayoutEffect, useRef } from 'react'

import { sceneHost } from '../lib/sceneHost'

/** 상주 3D 뷰가 들어갈 자리 (부모 셀을 꽉 채움). 마운트 중인 슬롯 하나에 Canvas 가 붙는다 */
export default function SceneSlot() {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current

    if (!element) return

    sceneHost.attach(element)

    return () => sceneHost.detach(element)
  }, [])

  return <div ref={ref} className="absolute inset-0" />
}
