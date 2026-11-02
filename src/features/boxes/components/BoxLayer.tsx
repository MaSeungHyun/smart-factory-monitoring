import { useEffect, useMemo, useState } from 'react'

import { playbackStore } from '@/features/playback'
import type { PlaybackRun } from '@/shared/types/playback'

import { useBoxSync } from '../hooks/useBoxSync'
import { decodeBoxes, type DecodedBox } from '../lib/decodeBoxes'
import { inboundPoints } from '../lib/inboundPoints'
import { readStreams } from '../lib/runStreams'
import BoxDefectMarks from './BoxDefectMarks'
import BoxInstances from './BoxInstances'
import EventPallets from './EventPallets'
import InboundPulses from './InboundPulses'
import RailPallets from './RailPallets'
import RejectZones from './RejectZones'

function BoxScene({ run, boxes }: { run: PlaybackRun; boxes: DecodedBox[] }) {
  const sync = useBoxSync(run, boxes)

  const points = useMemo(() => inboundPoints(boxes), [boxes])

  const pallets = readStreams(run).palletEvents

  return (
    <>

      {pallets?.length ? <EventPallets events={pallets} /> : <RailPallets boxes={boxes} sync={sync} />}
      <BoxInstances boxes={boxes} sync={sync} />

      <BoxDefectMarks boxes={boxes} />

      <InboundPulses points={points} />

      <RejectZones boxes={boxes} />
    </>
  )
}

/** 재생 박스 (Canvas 안). 차수(run)가 바뀔 때만 다시 그리고 프레임마다 구독하지 않는다 */
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

  if (!run || !boxes.length) return null

  return <BoxScene run={run} boxes={boxes} />
}
