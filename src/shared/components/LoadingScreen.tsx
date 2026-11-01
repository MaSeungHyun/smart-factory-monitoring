import { useProgress } from '@react-three/drei'
import { useState } from 'react'

import SegmentProgressBar from './SegmentProgressBar'

/** XD: 70칸 · 4×8 · 간격 3 → 487px */
const SEGMENT_COUNT = 70

const SEGMENT_WIDTH = 4

const SEGMENT_GAP = 3

export default function LoadingScreen() {
  const { active, progress } = useProgress()

  const [done, setDone] = useState(false)

  const finished = !active && progress >= 100

  /** 첫 로딩 완료 후엔 다시 띄우지 않음 (렌더 중 상태 갱신 패턴) */
  if (finished && !done) setDone(true)

  if (done || finished) return null

  const percent = Math.round(progress)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base">
      <div className="flex w-[487px] flex-col items-center">
        <p className="text-h2 font-normal text-text-tertiary">Smart Logistics Digital Twin</p>

        <img
          src="/images/logo_grapicar.png"
          srcSet="/images/logo_grapicar.png 1x, /images/logo_grapicar@2x.png 2x"
          alt="GRAPICAR"
          width={532}
          height={117}
          className="mt-1 h-[117px] w-[532px] max-w-none"
        />

        <SegmentProgressBar
          value={percent}
          count={SEGMENT_COUNT}
          segmentWidth={SEGMENT_WIDTH}
          gap={SEGMENT_GAP}
          label="3D 공장 데이터 로딩"
          className="mt-[46px]"
        />

        <div className="mt-[18px] flex w-full justify-between text-body">
          <span className="text-text-secondary">3D 공장 데이터를 불러오는 중</span>

          <span className="font-semibold text-text-primary tabular-nums">{percent}%</span>
        </div>
      </div>
    </div>
  )
}
