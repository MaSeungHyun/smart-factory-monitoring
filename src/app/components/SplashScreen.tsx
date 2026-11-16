import { LOADING_BG_SRC } from '@/shared/constants/loadingImages'

/** 일렉트론 스플래시 창(?splash=1). three.js 없이 이 화면만 먼저 띄운다 */
export default function SplashScreen() {
  return (
    <main className="relative h-screen w-screen select-none overflow-hidden bg-bg-base">
      <img
        src={LOADING_BG_SRC}
        alt=""
        draggable={false}
        fetchPriority="high"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-bg-base via-bg-base/85 to-transparent px-8 pt-24 pb-7 text-text-primary">
        <h1 className="text-[32px] font-bold leading-none tracking-[-0.01em]">
          SMART FACTORY TWIN
        </h1>

        <p className="mt-2.5 text-label font-medium tracking-[0.08em] text-primary-on-dark">
          REAL-TIME FACTORY MONITORING
        </p>

        <div className="mt-6 flex items-center justify-between text-caption text-text-tertiary">
          <span>모니터링 화면을 준비하는 중</span>

          <span>© 2026 GRAPICAR</span>
        </div>

        <div
          role="progressbar"
          aria-label="모니터링 화면 준비 중"
          className="mt-2.5 h-0.5 overflow-hidden bg-text-primary/15"
        >
          <div className="splash-progress-segment h-full w-1/3 bg-primary-on-dark" />
        </div>
      </div>
    </main>
  )
}
