import { Fragment, lazy, Suspense, useEffect } from "react";

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
import { useSceneWarm } from "@/features/scene/lib/sceneWarm";
import SuspendFactoryAssets from "@/features/scene/components/SuspendFactoryAssets";
import WarmupScreen from "@/features/scene/components/WarmupScreen";
import LoadingScreen from "@/shared/components/LoadingScreen";
import { useDashboardDialog } from "@/shared/stores/useDashboardDialogStore";
import { useMonitorView, type MonitorView } from "@/shared/stores/useMonitorViewStore";
import EquipmentDetailPage from "@/pages/equipment-detail/EquipmentDetailPage";
import ScanPage from "@/pages/scan/ScanPage";
import WarehousePage from "@/pages/warehouse/WarehousePage";

import { useIntroGate } from "./useIntroGate";
import ViewOverlays3D from "./ViewOverlays3D";

/** 대시보드 다이얼로그(차트 포함)는 첫 화면에 필요 없어 별도 청크로 받는다 */
const loadDashboardDialog = () => import("@/features/dashboard/components/DashboardDialog");

const DashboardDialog = lazy(loadDashboardDialog);

/** 열릴 때만 마운트. 씬 준비가 끝나면 미리 받아 두어 처음 열 때 기다리지 않는다 */
function DashboardDialogSlot() {
  const { open } = useDashboardDialog();

  const warm = useSceneWarm();

  useEffect(() => {
    if (warm) void loadDashboardDialog();
  }, [warm]);

  if (!open) return null;

  return (
    <Suspense fallback={null}>
      <DashboardDialog />
    </Suspense>
  );
}

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

      <DashboardDialogSlot />

      <WarmupScreen />
    </Suspense>
  );
}
