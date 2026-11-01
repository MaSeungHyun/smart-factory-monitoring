import { Canvas } from "@react-three/fiber";
import { Suspense, useMemo, type ReactNode } from "react";
import { AgXToneMapping, PCFShadowMap } from "three";

import { BoxLayer } from "@/features/boxes";
import { PlaybackDriver } from "@/features/playback";
import { FACTORY_TEMPLATE, parseTemplate } from "@/features/template";
import { configureKTX2 } from "@/shared/lib/three/gltfLoader";

import EquipmentLayer from "./EquipmentLayer";
import FactoryLighting from "./FactoryLighting";
import FactoryProps from "./FactoryProps";
import FaultHighlight from "./FaultHighlight";
import GlbCameraRig from "./GlbCameraRig";
import SceneLabels from "./SceneLabels";
import SelectionLayer from "./SelectionLayer";
import { uiStore } from "@/shared/stores/uiStore";

const CAMERA = { fov: 45, near: 0.5, far: 2000 };

/** 템플릿 06 (factory-glb-v2) 읽기 전용 뷰어: factory.glb props + 장비 모델 + factory.glb main_cam/robot_cam 카메라 */
/** children: 페이지별 3D 오버레이 (Canvas 안) */
export default function FactoryScene({ children }: { children?: ReactNode }) {
  const template = useMemo(() => parseTemplate(FACTORY_TEMPLATE), []);

  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      camera={CAMERA}
      gl={{ toneMapping: AgXToneMapping }}
      onCreated={({ gl }) => configureKTX2(gl)}
      onPointerMissed={(event) => event.type === "click" && uiStore.select(null)}
    >
      <color attach="background" args={["#0a0b0d"]} />

      <Suspense fallback={null}>
        <FactoryLighting />

        <FactoryProps props={template.props} />

        <EquipmentLayer equipment={template.equipment} />

        <PlaybackDriver />

        <BoxLayer />

        <GlbCameraRig />

        <FaultHighlight />

        <SceneLabels />

        <SelectionLayer />

        {children}
      </Suspense>
    </Canvas>
  );
}
