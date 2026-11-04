import InfoCard from '@/shared/components/InfoCard'
import StatusBadge from '@/shared/components/StatusBadge'
import { TONE_TEXT } from '@/shared/constants/status'
import { cn } from '@/shared/lib/cn'

import type { ScanBox } from '../lib/scanDetail'
import { VERDICT_BADGE, VERDICT_TONE } from '../lib/scanTone'

const READ_TEXT = { pass: '성공', defect: '실패', pending: '대기' }

const actionOf = (box: ScanBox) => {
  if (box.verdict === 'pending') return '판독 대기'

  if (box.verdict === 'pass') return '다음 공정 이송'

  return box.rejectBy ? '선별 로봇암이 제거' : '리젝트 대기'
}

/** 스캔 콜아웃 카드 254x136: 박스 id, 판정 배지, 판독 / 사유 / 조치 */
export default function ScanCallout({ box, color }: { box: ScanBox; color?: string }) {
  const tone = VERDICT_TONE[box.verdict]

  const rows = [
    ['판독', READ_TEXT[box.verdict], box.verdict === 'defect' ? TONE_TEXT.error : 'text-text-primary'],
    ['사유', box.reason ?? '—', 'text-text-primary'],
    ['조치', actionOf(box), 'text-text-primary'],
  ]

  return (
    <InfoCard className="w-[254px]" color={color}>
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full border border-text-secondary text-caption text-text-primary">3</span>

        <span className="text-label font-bold text-text-primary">{box.boxId.replace('B-', 'BOX-')}</span>

        <span className="ml-auto">
          <StatusBadge tone={tone} label={VERDICT_BADGE[box.verdict]} />
        </span>
      </div>

      <dl className="mt-2 flex flex-col gap-1.5 border-t border-border-default pt-2">
        {rows.map(([label, value, className]) => (
          <div key={label} className="flex text-caption">
            <dt className="text-text-tertiary">{label}</dt>

            <dd className={cn('ml-auto font-semibold', className)}>{value}</dd>
          </div>
        ))}
      </dl>
    </InfoCard>
  )
}
