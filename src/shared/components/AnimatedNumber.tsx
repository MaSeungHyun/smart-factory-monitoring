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

/** 천 단위 포맷터는 소수 자리별로 하나만 만든다. toLocaleString(옵션) 은 호출마다 포맷터를 새로 만들어 매 프레임 쓰기엔 무겁다 */
const groupedFormats = new Map<number, Intl.NumberFormat>()

function groupedFormat(digits: number) {
  let formatter = groupedFormats.get(digits)

  if (!formatter) {
    formatter = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits })

    groupedFormats.set(digits, formatter)
  }

  return formatter
}

function format(value: number, digits: number, grouped: boolean) {
  // 반올림 결과가 0 이면 -0 대신 0
  const safe = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value

  return grouped ? groupedFormat(digits).format(safe) : safe.toFixed(digits)
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