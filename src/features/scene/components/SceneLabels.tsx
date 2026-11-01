import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'

import { dashboardAt, playbackStore } from '@/features/playback'
import { useUi } from '@/shared/stores/useUiStore'

import { faultLabels, type FaultLabel } from '../lib/faultTargets'
import SceneLabel3D from './SceneLabel3D'

function labelKey(labels: FaultLabel[]) {
  return labels.map((label) => `${label.id}:${label.status}:${label.text}`).join('|')
}

/** 실시간 데이터 기반 3D 라벨 (Canvas 안에서 사용). 문구가 바뀔 때만 다시 그린다 */
export default function SceneLabels() {
  const { labelsVisible } = useUi()

  const [labels, setLabels] = useState<FaultLabel[]>(() => {
    const view = dashboardAt(playbackStore.getState())

    return view ? faultLabels(view.alarms, view.equipment) : []
  })

  const sig = useRef(labelKey(labels))

  useFrame(() => {
    const view = dashboardAt(playbackStore.getState())

    const next = view ? faultLabels(view.alarms, view.equipment) : []

    const key = labelKey(next)

    if (key === sig.current) return

    sig.current = key

    setLabels(next)
  })

  if (!labelsVisible) return null

  return (
    <>
      {labels.map((label) => (
        <SceneLabel3D key={label.id} label={label} />
      ))}
    </>
  )
}
