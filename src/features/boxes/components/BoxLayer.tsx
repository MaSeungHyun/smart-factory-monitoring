import { useMemo } from 'react'

import { usePlayback } from '@/features/playback'

import { decodeBoxes } from '../lib/decodeBoxes'
import { inboundPoints } from '../lib/inboundPoints'
import BoxInstances from './BoxInstances'
import InboundPulses from './InboundPulses'
import RejectZones from './RejectZones'

/** 재생 박스 (Canvas 안) */
export default function BoxLayer() {
  const { run } = usePlayback()

  const boxes = useMemo(() => (run ? decodeBoxes(run) : []), [run])

  const points = useMemo(() => inboundPoints(boxes), [boxes])

  if (!boxes.length) return null

  return (
    <>
      <BoxInstances boxes={boxes} />

      <InboundPulses points={points} />

      <RejectZones boxes={boxes} />
    </>
  )
}
