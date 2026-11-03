import { Fragment, Suspense } from "react";

import { AnimatePresence } from "motion/react";

import DashboardLayout from "@/app/layouts/DashboardLayout";
import {
  Header,
  IconRail,
  MainMonitor,
  TodayPanel,
} from "@/features/dashboard";
import { usePlaybackLoader } from "@/features/playback";
import { ProcessFlow } from "@/features/process-flow";
import { SceneHost } from "@/features/scene";
import SuspendFactoryAssets from "@/features/scene/components/SuspendFactoryAssets";
import WarmupScreen from "@/features/scene/components/WarmupScreen";
import LoadingScreen from "@/shared/components/LoadingScreen";
import { useMonitorView, type MonitorView } from "@/shared/stores/useMonitorViewStore";
import EquipmentDetailPage from "@/pages/equipment-detail/EquipmentDetailPage";
import ScanPage from "@/pages/scan/ScanPage";
import WarehousePage from "@/pages/warehouse/WarehousePage";

import { useIntroGate } from "./useIntroGate";
import ViewOverlays3D from "./ViewOverlays3D";

/** 화면 하나. 사라지는 동안에도 자기 탭을 그리도록 view 를 고정해서 받는다 */
function ViewScreen({ view }: { view: MonitorView }) {
  if (view === "robot") return <EquipmentDetailPage />;

  if (view === "scan") return <ScanPage />;

  if (view === "warehouse") return <WarehousePage />;

  return (
    <DashboardLayout
      rail={<IconRail />}
      header={<Header />}
      sidebar={<TodayPanel />}
      main={<MainMonitor />}
      bottom={<ProcessFlow />}
    />
  );
}

/**
 * 레일 탭 상태로 메인 관제 / 장비 상세 / 스캔 검사 전환 (재생 데이터는 여기서 한 번 로드).
 * 3D Canvas 는 SceneHost 로 한 번만 마운트, 화면은 SceneSlot 자리만 제공.
 */
export default function MonitoringPage() {
  usePlaybackLoader();

  // 화면이 모두 준비된 뒤에 인트로 시작
  useIntroGate();

  const view = useMonitorView();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <SuspendFactoryAssets />

      <SceneHost>
        <ViewOverlays3D />
      </SceneHost>

      {/* 탭이 바뀌면 이전 화면 패널이 짧게 사라진 뒤 새 화면 패널이 들어온다 */}
      <AnimatePresence mode="wait">
        <Fragment key={view}>
          <ViewScreen view={view} />
        </Fragment>
      </AnimatePresence>

      <WarmupScreen />
    </Suspense>
  );
}
