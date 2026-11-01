import { cn } from '@/shared/lib/cn'

import type { DefectBucket, ScanBox } from '../lib/scanDetail'

interface Props {
  buckets: DefectBucket[]
  average: number
  bucketSeconds: number
  lastDefect: ScanBox | null
  label: (t: number) => string
}

const HEIGHT = 120

/** 구간별 불량률 막대 (%), 평균선, 마지막 불량 주석 */
export default function DefectRateChart({ buckets, average, bucketSeconds, lastDefect, label }: Props) {
  const max = Math.max(average * 1.6, ...buckets.map((bucket) => bucket.rate), 10)

  const scanned = buckets.some((bucket) => bucket.scans > 0)

  return (
    <div className="rounded border border-border-default bg-bg-surface-2 p-3">
      <div className="flex text-caption text-text-secondary">
        이번 재생 · 불량률

        <span className="ml-auto text-text-tertiary">{Math.round(bucketSeconds)}초 단위 · %</span>
      </div>

      {!scanned ? (
        <div style={{ height: HEIGHT }} className="mt-2 flex items-center justify-center text-caption text-text-tertiary">
          검사 기록 없음 (0건)
        </div>
      ) : (
        <div style={{ height: HEIGHT }} className="relative mt-2 flex items-end gap-1">
          <div style={{ bottom: `${(average / max) * 100}%` }} className="absolute inset-x-0 border-t border-dashed border-text-tertiary">
            <span className="absolute -top-4 right-0 text-[10px] text-text-tertiary">평균 {average.toFixed(1)}%</span>
          </div>

          {buckets.map((bucket) => (
            <div
              key={bucket.t0}
              title={`${label(bucket.t0)} · ${bucket.scans}건 중 불량 ${bucket.defects}건`}
              style={{ height: bucket.scans === 0 ? 2 : `${Math.max((bucket.rate / max) * 100, 3)}%` }}
              className={cn('min-w-0 flex-1 rounded-t-sm', bucket.defects ? 'bg-status-error' : bucket.scans ? 'bg-primary-on-dark/80' : 'bg-border-default')}
            />
          ))}
        </div>
      )}

      {lastDefect && (
        <p className="mt-1 text-[10px] text-status-error tabular-nums">
          {label(lastDefect.at)} {lastDefect.reason} · 1건
        </p>
      )}
    </div>
  )
}
