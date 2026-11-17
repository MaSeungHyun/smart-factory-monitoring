import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'

import { dashboardAt, playbackStore } from '@/features/playback'

import { faultLabels, type FaultLabel } from '../lib/faultTargets'
import SceneLabel3D from './SceneLabel3D'

function labelKey(labels: FaultLabel[]) {
  return labels.map((label) => `${label.id}:${label.status}:${label.text}`).join('|')
}

/** 실시간 데이터 기반 3D 라벨 (Canvas 안에서 사용). 문구가 바뀔 때만 다시 그린다 */
export default function SceneLabels() {

  const [labels, setLabels] = useState<FaultLabel[]>(() => {
    const view = dashboardAt(playbackStore.getState())

    return view ? faultLabels(view.alarms, view.equipment) : []
  })

  const sig = useRef(labelKey(labels))

  // dashboardAt 은 상태 샘플이 그대로면 같은 객체를 돌려준다. 그때는 라벨 목록 · 키 문자열을 매 프레임 만들지 않는다
  const seenView = useRef<ReturnType<typeof dashboardAt> | undefined>(undefined)

  useFrame(() => {
    const view = dashboardAt(playbackStore.getState())

    if (view === seenView.current) return

    seenView.current = view

    const next = view ? faultLabels(view.alarms, view.equipment) : []

    const key = labelKey(next)

    if (key === sig.current) return

    sig.current = key

    setLabels(next)
  })


  return (
    <>
      {labels.map((label) => (
        <SceneLabel3D key={label.id} label={label} />
      ))}
    </>
  )
}
