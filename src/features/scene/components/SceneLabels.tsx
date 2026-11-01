import { useMemo } from 'react'

import { useDashboardView } from '@/features/playback'
import { useUi } from '@/shared/hooks/useUi'

import { faultLabels } from '../lib/faultTargets'
import SceneLabel3D from './SceneLabel3D'

/** 실시간 데이터 기반 3D 라벨 (Canvas 안에서 사용) */
export default function SceneLabels() {
  const view = useDashboardView()

  const { labelsVisible } = useUi()

  const labels = useMemo(() => (view ? faultLabels(view.alarms, view.equipment) : []), [view])

  if (!labelsVisible) return null

  return (
    <>
      {labels.map((label) => (
        <SceneLabel3D key={label.id} label={label} />
      ))}
    </>
  )
}
