import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, type ReactNode } from "react";
import { AgXToneMapping, PCFShadowMap, WebGLRenderer } from "three";

import { BoxLayer } from "@/features/boxes";
import { AnimatedPartsDriver, PlaybackDriver, usePlaybackPick } from "@/features/playback";
import PlaybackStart from "@/features/playback/components/PlaybackStart";
import { FACTORY_TEMPLATE, parseTemplate } from "@/features/template";
import { isVisibleEquipment } from "../lib/sceneEquipment";
import { configureKTX2 } from "@/shared/lib/three/gltfLoader";
import { loadWebGPU, prefetchWebGPU } from "@/shared/lib/three/webgpuPrefetch";
import { graphicsStore, QUALITY_DPR, useGraphics } from "@/shared/stores/useGraphicsStore";
import { uiStore } from "@/shared/stores/useUiStore";

import EquipmentLayer from "./EquipmentLayer";
import { registerScenePartHandlers } from "../lib/partHandlers";
import FactoryLighting from "./FactoryLighting";
import FactoryProps from "./FactoryProps";
import FactoryWarmup from "./FactoryWarmup";
import FactoryWireframe from "./FactoryWireframe";
import FaultHighlight from "./FaultHighlight";
import FrameLoopGate from "./FrameLoopGate";
import GlbCameraRig from "./GlbCameraRig";
import SceneBloom from "./SceneBloom";
import SceneLabels from "./SceneLabels";
import SceneReady from "./SceneReady";
import SelectionLayer from "./SelectionLayer";
import ShadowUpdateGate from "./ShadowUpdateGate";
import VisionInset from "./VisionInset";

const CAMERA = { fov: 45, near: 0.5, far: 2000 };

/** 씬 배경색 (기준 씬: 검정). HDR 을 배경으로 쓰면(Environment background) 가려진다 */
const SCENE_BACKGROUND = "#000000";

/** WebGPU 를 시도하고, 실패하면 같은 캔버스에서 WebGL 로 올린다 */
async function createWebGPU(props: ConstructorParameters<typeof WebGLRenderer>[0] = {}) {
  try {
    if (!("gpu" in navigator)) throw new Error("이 브라우저는 WebGPU를 지원하지 않습니다");

    const { WebGPURenderer } = await loadWebGPU();

    const antialias = graphicsStore.getState().antialias;

    const gpu = new WebGPURenderer({
      canvas: props.canvas as HTMLCanvasElement | undefined,
      antialias,
      alpha: props.alpha,
    });

    await gpu.init();

    graphicsStore.getState().markActive("webgpu", null);

    return gpu;
  } catch (error) {
    const message = error instanceof Error ? error.message : "WebGPU를 시작하지 못했습니다";

    graphicsStore.getState().markActive("webgl", message);

    return new WebGLRenderer({ ...props, antialias: graphicsStore.getState().antialias });
  }
}

/** 템플릿 06 (factory-glb-v2) 읽기 전용 뷰어: factory.glb props + 장비 모델 + factory.glb main_cam/robot_cam 카메라 */
/** children: 페이지별 3D 오버레이 (Canvas 안) */
registerScenePartHandlers();

// WebGPU 를 고른 경우: 에셋을 받는 동안 three/webgpu 청크 · GPU 어댑터를 함께 준비한다 (캔버스 마운트 뒤에 줄지어 기다리지 않게)
if (graphicsStore.getState().renderer === "webgpu") prefetchWebGPU();

export default function FactoryScene({ children }: { children?: ReactNode }) {
  const template = useMemo(() => parseTemplate(FACTORY_TEMPLATE), []);

  // 팔레트 이벤트(위치 포함)가 있는 run 은 EventPallets 가 그린다 → 템플릿 고정 팔레트는 숨긴다
  const eventPallets = usePlaybackPick((state) => !!state.run?.recording?.pallets?.some((row) => row[4]));

  const equipment = useMemo(
    () =>
      template.equipment.filter((item) => {
        if (!isVisibleEquipment(item)) return false

        if (eventPallets && item.kind === "pallet") return false

        return true
      }),
    [eventPallets, template],
  );

  const { quality, shadow, renderer, antialias } = useGraphics();

  return (
    <Canvas
      key={`${renderer}:${antialias ? "aa" : "off"}`}
      shadows={shadow === "off" ? false : { type: PCFShadowMap }}
      dpr={QUALITY_DPR[quality]}
      camera={CAMERA}
      gl={renderer === "webgpu" ? createWebGPU : { antialias, toneMapping: AgXToneMapping }}
      onCreated={({ gl }) => {
        gl.toneMapping = AgXToneMapping;

        if (gl instanceof WebGLRenderer) {
          configureKTX2(gl);

          graphicsStore.getState().markActive("webgl", graphicsStore.getState().fallback);
        }
      }}
      onPointerMissed={(event) => event.type === "click" && uiStore.getState().select(null)}
    >
      <color attach="background" args={[SCENE_BACKGROUND]} />

        
      <Suspense fallback={null}>
        <FactoryLighting />

        <FactoryProps props={template.props} />

        <EquipmentLayer equipment={equipment} />

        <PlaybackDriver />

        <AnimatedPartsDriver />

        <PlaybackStart />

        <BoxLayer />

        <GlbCameraRig />

        <FaultHighlight />

        <SceneLabels />

        <SelectionLayer />

        <SceneBloom />

        <VisionInset />

        <FactoryWireframe />


        <SceneReady />

        <FactoryWarmup />

        {/* 성능 게이트: 일시정지 · 다이얼로그일 때 렌더 쉬기 / 그림자는 움직인 프레임만 */}
        <FrameLoopGate />

        <ShadowUpdateGate />

        {children}
      </Suspense>
    </Canvas>
  );
}
