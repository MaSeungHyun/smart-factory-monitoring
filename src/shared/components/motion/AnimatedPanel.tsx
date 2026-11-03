import { motion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

import { usePanelMotion } from '@/shared/hooks/usePanelMotion'
import { useIntroStarted } from '@/shared/stores/introClock'

import { itemVariants, listVariants, panelVariants, type PanelFrom } from './variants'

interface AnimatedPanelProps {
  from: PanelFrom
  className?: string
  children: ReactNode
}

/**
 * 화면 영역(패널) 마운트 애니메이션. AnimatePresence 안에서는 사라질 때도 짧게 페이드.
 * 설정이 꺼져 있거나 동작 줄이기면 처음부터 최종 상태로 그린다
 */
export function AnimatedPanel({ from, className, children }: AnimatedPanelProps) {
  const enabled = usePanelMotion()

  // 로딩 화면이 걷히기(T=0) 전에는 출발 위치에서 기다린다
  const started = useIntroStarted()

  return (
    <motion.section
      custom={from}
      variants={panelVariants}
      initial={enabled ? 'hidden' : false}
      animate={started || !enabled ? 'shown' : 'hidden'}
      exit={enabled ? 'exit' : undefined}
      className={className}
      // transform · opacity 만 움직이므로 합성 레이어로 올려 레이아웃 · 페인트를 피한다
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.section>
  )
}

/**
 * 카드 목록 컨테이너: 자식 AnimatedItem 을 순서대로 등장시킨다 (레이아웃 클래스는 그대로).
 * initial · animate 를 따로 주지 않아 부모 AnimatedPanel 의 hidden → shown 을 이어받는다.
 * 그래서 패널이 들어오기 시작하고 CARD_STAGGER_DELAY_S 뒤에 첫 카드가 출발한다
 */
export function AnimatedList(props: Omit<HTMLMotionProps<'div'>, 'variants' | 'initial' | 'animate'>) {
  return <motion.div {...props} variants={listVariants} />
}

/** 카드 한 장. 단일 셀 grid 로 감싸 원래 카드가 칸 전체를 채우게 둔다 */
export function AnimatedItem({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div variants={itemVariants} className={className ?? 'grid min-h-0 min-w-0'}>
      {children}
    </motion.div>
  )
}