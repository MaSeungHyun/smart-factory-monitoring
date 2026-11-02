import { useEffect, useMemo, useState } from 'react'

import { playbackStore } from '@/features/playback'
import type { PlaybackRun } from '@/shared/types/playback'

import { decodeBoxes } from '../lib/decodeBoxes'
import { inboundPoints } from '../lib/inboundPoints'
import BoxDefectMarks from './BoxDefectMarks'
import BoxInstances from './BoxInstances'
import InboundPulses from './InboundPulses'
import RailPallets from './RailPallets'
import RejectZones from './RejectZones'

/** 재생 박스 (Canvas 안). 회차(run)가 바뀔 때만 다시 그리고, 시계 틱에는 구독하지 않는다 */
export default function BoxLayer() {
  const [run, setRun] = useState<PlaybackRun | null>(() => playbackStore.getState().run)

  useEffect(
    () =>
      playbackStore.subscribe((state, prev) => {
        if (state.run !== prev.run) setRun(state.run)
      }),
    [],
  )

  const boxes = useMemo(() => (run ? decodeBoxes(run) : []), [run])

  const points = useMemo(() => inboundPoints(boxes), [boxes])

  if (!boxes.length) return null

  return (
    <>
      <BoxInstances boxes={boxes} />

      <BoxDefectMarks boxes={boxes} />

      <RailPallets boxes={boxes} />

      <InboundPulses points={points} />

      <RejectZones boxes={boxes} />
    </>
  )
}
