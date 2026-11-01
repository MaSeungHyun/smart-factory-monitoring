import { useProgress } from '@react-three/drei'

import SegmentProgressBar from './SegmentProgressBar'

/** XD: 70칸 · 4×8 · 간격 3 → 487px */
const SEGMENT_COUNT = 70

const SEGMENT_WIDTH = 4

const SEGMENT_GAP = 3

export default function LoadingScreen() {
  const { active, progress } = useProgress()

  if (!active && progress >= 100) return null

  const percent = Math.round(progress)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-base">
      <div className="flex w-[487px] flex-col items-center">
        <p className="text-h2 font-normal text-text-tertiary">Smart Logistics Digital Twin</p>

        <h1 className="mt-1 text-[84px] leading-[117px] font-black tracking-wide text-text-primary">GRAPICAR</h1>

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
