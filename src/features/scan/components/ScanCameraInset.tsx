import { CameraInset, type InsetBox } from '@/features/equipment-detail'

import { useScanDetail, useScannerOptions } from '../hooks/useScanDetail'
import type { ScanBox } from '../lib/scanDetail'

const SLOT = { width: 46, height: 40, gap: 50, top: 70 }

const LABEL = { pass: '정상 판독', defect: '제거 대상', pending: '판독 중' }

const TONE = { pass: 'success', defect: 'error', pending: 'info' } as const

const toInset = (box: ScanBox, index: number, count: number): InsetBox => ({
  label: `${LABEL[box.verdict]} · ${box.boxId}`,
  left: (5 - (count - 1 - index)) * SLOT.gap - 20,
  top: SLOT.top - (index % 2) * 34,
  width: SLOT.width,
  height: SLOT.height,
  tone: TONE[box.verdict],
})

/** 스캐너 카메라 인셋: 인식 박스는 최근 판독 결과 (영상 자체는 소스 없음) */
export default function ScanCameraInset() {
  const detail = useScanDetail()

  const options = useScannerOptions()

  const index = Math.max(0, options.findIndex((option) => option.id === detail?.id)) + 1

  const recent = detail?.recent ?? []

  return <CameraInset title={`CAM-0${index} · ${detail?.name ?? '스캐너'}`} meta="30fps · 1920×1080" boxes={recent.map((box, i) => toInset(box, i, recent.length))} />
}
