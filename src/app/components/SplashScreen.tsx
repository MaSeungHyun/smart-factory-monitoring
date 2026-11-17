import { useEffect, useState } from 'react'

import { LOADING_BG_SRC } from '@/shared/constants/loadingImages'

/** 스플래시 진행률이 목표치까지 차오르는 예상 시간 (ms) */
const SPLASH_FILL_MS = 20_000

/** 실제 준비 완료 전까지 멈춰 있을 최대 진행률 (%) */
const SPLASH_FILL_MAX = 95

/** 진행률 갱신 간격 (ms) */
const SPLASH_TICK_MS = 100

/** ease-out (오버슈트 없음) */
const easeOut = (t: number) => 1 - (1 - t) ** 3

/** 일렉트론 스플래시 창(?splash=1). 기존 로딩 화면 디자인을 스플래시 크기에 맞춰 그린다 */
export default function SplashScreen() {
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const start = performance.now()

    const timer = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / SPLASH_FILL_MS)

      setPercent(Math.round(easeOut(t) * SPLASH_FILL_MAX))
    }, SPLASH_TICK_MS)

    return () => window.clearInterval(timer)
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
            className="h-full bg-[#4FA8D4] transition-[width] duration-100 ease-out"
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