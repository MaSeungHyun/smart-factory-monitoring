import { useRef } from 'react'

import { useSmoothValue, type SmoothTarget } from '@/shared/hooks/useSmoothValue'

interface AnimatedNumberProps {
  value: SmoothTarget
  /** 소수 자리 (기본 정수) */
  digits?: number
  /** 천 단위 구분 */
  grouped?: boolean
  suffix?: string
}

function format(value: number, digits: number, grouped: boolean) {
  // 반올림 결과가 0 이면 -0 대신 0
  const safe = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value

  return grouped
    ? safe.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })
    : safe.toFixed(digits)
}

/** 변하는 값(현재 수량 · %)을 막대와 같은 스무딩으로 카운트업. 매 프레임 textContent 만 바꾼다 */
export default function AnimatedNumber({ value, digits = 0, grouped = false, suffix = '' }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const shown = useRef('')

  useSmoothValue(value, (current) => {
    const text = format(current, digits, grouped) + suffix

    if (text === shown.current || !ref.current) return

    shown.current = text

    ref.current.textContent = text
  })

  return <span ref={ref}>{format(0, digits, grouped) + suffix}</span>
}