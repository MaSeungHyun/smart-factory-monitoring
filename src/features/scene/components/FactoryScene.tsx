import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, type ReactNode } from "react";
import { AgXToneMapping, PCFShadowMap, WebGLRenderer } from "three";

import { BoxLayer } from "@/features/boxes";
import { AnimatedPartsDriver, PlaybackDriver } from "@/features/playback";
import PlaybackStart from "@/features/playback/components/PlaybackStart";
import { FACTORY_TEMPLATE, parseTemplate } from "@/features/template";
import { configureKTX2 } from "@/shared/lib/three/gltfLoader";
import { graphicsStore, QUALITY_DPR, useGraphics } from "@/shared/stores/useGraphicsStore";
import { uiStore } from "@/shared/stores/useUiStore";

import EquipmentLayer from "./EquipmentLayer";
import { registerScenePartHandlers } from "../lib/partHandlers";
import FactoryLighting from "./FactoryLighting";
import FactoryProps from "./FactoryProps";
import FactoryWarmup from "./FactoryWarmup";
import FaultHighlight from "./FaultHighlight";
import GlbCameraRig from "./GlbCameraRig";
import SceneBloom from "./SceneBloom";
import SceneLabels from "./SceneLabels";
import SceneReady from "./SceneReady";
import SelectionLayer from "./SelectionLayer";
import VisionInset from "./VisionInset";

const CAMERA = { fov: 45, near: 0.5, far: 2000 };

/** WebGPU 를 시도하고, 실패하면 같은 캔버스에서 WebGL 로 올린다 */
async function createWebGPU(props: ConstructorParameters<typeof WebGLRenderer>[0] = {}) {
  try {
    if (!("gpu" in navigator)) throw new Error("이 브라우저는 WebGPU를 지원하지 않습니다");

    const { WebGPURenderer } = await import("three/webgpu");

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

export default function FactoryScene({ children }: { children?: ReactNode }) {
  const template = useMemo(() => parseTemplate(FACTORY_TEMPLATE), []);

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
      <color attach="background" args={["#0a0b0d"]} />

      <Suspense fallback={null}>
        <FactoryLighting />

        <FactoryProps props={template.props} />

        <EquipmentLayer equipment={template.equipment} />

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

        <SceneReady />

        <FactoryWarmup />

        {children}
      </Suspense>
    </Canvas>
  );
}
