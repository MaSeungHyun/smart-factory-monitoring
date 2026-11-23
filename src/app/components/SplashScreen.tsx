import { useEffect, useRef, useState } from 'react'

import { LOADING_BG_SRC } from '@/shared/constants/loadingImages'

/** 실제 진행률을 따라가는 속도 (ms, 클수록 천천히). 값이 계단처럼 튀지 않게 부드럽게 따라간다 */
const SPLASH_FOLLOW_MS = 250

/** 준비 완료 신호 전까지 멈춰 있을 최대 진행률 (%) */
const SPLASH_REAL_MAX = 95

/** 준비 완료 신호를 받은 뒤 현재 값에서 100% 까지 채우는 시간 (ms) */
const SPLASH_FINISH_MS = 400

/** 100% 를 보여 준 채 머무는 시간 (ms). 이 뒤에 메인 창으로 넘어간다 */
const SPLASH_FINISH_HOLD_MS = 150

declare global {
  interface Window {
    /** 일렉트론 메인 프로세스가 메인 창의 실제 로딩 진행률(0~100)을 넘겨 준다 */
    __splashProgress?: (value: number) => void

    /** 일렉트론 메인 프로세스가 호출한다. 100% 까지 채우고 머문 뒤 resolve 된다 */
    __splashFinish?: () => Promise<void>
  }
}

/** ease-out (오버슈트 없음) */
const easeOut = (t: number) => 1 - (1 - t) ** 3

/** 일렉트론 스플래시 창(?splash=1). 기존 로딩 화면 디자인을 스플래시 크기에 맞춰 그린다 */
export default function SplashScreen() {
  const [percent, setPercent] = useState(0)

  const current = useRef(0)

  useEffect(() => {
    let target = 0

    let finishing: Promise<void> | null = null

    let frame = 0

    let last = performance.now()

    // 실제 진행률(target)을 지수 감쇠로 따라간다. 목표를 넘지 않아 오버슈트가 없다
    const follow = (now: number) => {
      const dt = now - last

      last = now

      current.current += (target - current.current) * (1 - Math.exp(-dt / SPLASH_FOLLOW_MS))

      setPercent(Math.round(current.current))

      frame = requestAnimationFrame(follow)
    }

    frame = requestAnimationFrame(follow)

    // 메인 창 진행률. 내려가는 값은 무시하고 완료 신호 전에는 SPLASH_REAL_MAX 에서 멈춘다
    window.__splashProgress = (value) => {
      if (finishing || !Number.isFinite(value)) return

      target = Math.max(target, Math.min(SPLASH_REAL_MAX, value))
    }

    // 준비 완료: 따라가기를 멈추고 현재 값에서 100% 까지 채운 뒤 잠시 머문다
    window.__splashFinish = () => {
      if (finishing) return finishing

      cancelAnimationFrame(frame)

      const from = current.current

      const begin = performance.now()

      finishing = new Promise<void>((resolve) => {
        const step = () => {
          const t = Math.min(1, (performance.now() - begin) / SPLASH_FINISH_MS)

          current.current = from + (100 - from) * easeOut(t)

          setPercent(Math.round(current.current))

          if (t < 1) frame = requestAnimationFrame(step)
          else window.setTimeout(resolve, SPLASH_FINISH_HOLD_MS)
        }

        frame = requestAnimationFrame(step)
      })

      return finishing
    }

    return () => {
      cancelAnimationFrame(frame)

      delete window.__splashProgress

      delete window.__splashFinish
    }
  }, [])

  return (
    <main className="relative h-screen w-screen select-none overflow-hidden bg-black">
      <img
        src={LOADING_BG_SRC}
        alt=""
        draggable={false}
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-7 z-10 w-full px-10">
        <h1 className="whitespace-pre-line text-[30px] font-bold leading-[1.12] tracking-[-0.02em] text-[#F2F5F8]">
          {"See your factory in Action,\nin Real time."}
        </h1>

        <p className="mt-4 text-[12px] font-normal leading-none text-text-tertiary">
          Smart Logistics Digital Twin
        </p>

        <div className="mt-5 flex items-center justify-between text-[11px] leading-none">
          <span className="font-normal text-text-tertiary">
            3D 공장 데이터를 불러오는 중
          </span>

          <span className="font-semibold text-[#F2F5F8] tabular-nums">
            {percent}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="3D 공장 데이터 로딩"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-2 h-1 min-h-1 w-full bg-white/20"
        >
          <div
            className="h-full bg-[#4FA8D4]"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-text-tertiary">
          <p className="text-[10px] font-normal leading-none">
            © 2026 GRAPICAR · Smart Logistics Digital Twin
          </p>

          <p className="text-[10px] font-normal leading-none">
            물류센터 A동 · v1.0
          </p>
        </div>
      </div>
    </main>
  )
}