import { useEffect, useRef, useState } from 'react'

import { Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

import Card from '@/shared/components/Card'
import { cn } from '@/shared/lib/cn'

import type { FactoryInsight, FactoryInsightTone } from '../lib/factoryInsights'

const INSIGHT_DOT: Record<FactoryInsightTone, string> = {
  neutral: 'bg-text-tertiary',
  success: 'bg-status-success',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
}

const ANALYZE_MS = 1400

function SkeletonLines() {
  return (
    <div className="mt-4 flex flex-col gap-3" aria-hidden>
      {[92, 78, 86, 64].map((width, index) => (
        <div key={width} className="flex items-center gap-2" style={{ animationDelay: `${index * 120}ms` }}>
          <span className="size-1.5 shrink-0 rounded-full bg-bg-surface" />
          <span className="insight-shimmer h-3.5 rounded" style={{ width: `${width}%` }} />
        </div>
      ))}
    </div>
  )
}

/** AI 공장 분석: 대시보드를 연 직후 한 번만 스켈레톤 → 요약 고정 */
export default function FactoryInsightPanel({ insights }: { insights: FactoryInsight[] }) {
  const [ready, setReady] = useState(false)

  const [shown, setShown] = useState<FactoryInsight[] | null>(null)

  const latest = useRef(insights)

  latest.current = insights

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShown(latest.current)

      setReady(true)
    }, ANALYZE_MS)

    return () => window.clearTimeout(timer)
  }, [])

  const rows = shown ?? insights

  return (
    <Card className="flex min-h-52 flex-1 flex-col p-3">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className={cn('text-primary-on-dark', !ready && 'animate-pulse')} />
        <p className="text-title text-text-primary">AI 공장 분석</p>
        {!ready ? <span className="ml-auto text-label text-text-tertiary">분석 중…</span> : null}
      </div>

      <p className="mt-2 text-label text-text-tertiary">현재 시프트 기준 요약</p>

      <div className="relative mt-4 min-h-0 flex-1">
        <AnimatePresence mode="wait">
          {!ready ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SkeletonLines />
            </motion.div>
          ) : (
            <motion.ul
              key="insights"
              initial="hidden"
              animate="shown"
              variants={{
                hidden: {},
                shown: { transition: { staggerChildren: 0.12 } },
              }}
              className="flex flex-col gap-3"
            >
              {rows.map((item) => (
                <motion.li
                  key={item.text}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    shown: { opacity: 1, y: 0, transition: { duration: 0.28 } },
                  }}
                  className="flex items-start gap-2 text-body text-text-secondary"
                >
                  <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', INSIGHT_DOT[item.tone])} />
                  <span>{item.text}</span>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
