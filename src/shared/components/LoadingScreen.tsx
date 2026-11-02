import { useProgress } from "@react-three/drei";
import { useState } from "react";

/** Suspense fallback. 보이는 동안은 부모가 정하고, 여기서는 진행률만 그린다. */
export default function LoadingScreen() {
  const { progress } = useProgress();

  const [peak, setPeak] = useState(0);

  // 항목이 바뀌면 drei 진행률이 잠시 내려간다. 이미 찬 칸은 유지한다.
  if (progress > peak) setPeak(progress);

  const percent = Math.round(peak);

  return (
    <div
      data-factory-loader
      className="flex flex-col inset-0 z-[60] h-screen w-screen overflow-hidden bg-black"
    >
      <div className="relative flex-1 h-full w-full items-center justify-center">
        <img
          src="/images/bg@2x.png"
          alt=""
          className="inset-0 w-full object-cover"
        />

        <div className="absolute bottom-[65px] w-full px-24 max-[720px]:bottom-8 max-[720px]:px-8">
          <h1 className="whitespace-pre-line text-[clamp(36px,3.75vw,72px)] font-bold leading-[1.12] tracking-[-0.02em] text-[#F2F5F8]">
            {"See your factory.\nRun it in real time."}
          </h1>

          <p className="mt-8 text-[clamp(14px,0.94vw,18px)] font-normal leading-none text-text-tertiary">
            Smart Logistics Digital Twin
          </p>

          <div className="mt-8 flex items-center justify-between text-[14px] leading-none">
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
            className="mt-3 h-1 min-h-1 w-full bg-white/20"
          >
            <div
              className="h-full bg-[#4FA8D4]"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-text-tertiary mt-6.25">
            <p className="mt-3.5 text-[12px] font-normal leading-none">
              © 2026 GRAPICAR · Smart Logistics Digital Twin
            </p>
            <p className="text-[12px] font-normal leading-none">
              물류센터 A동 · v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
