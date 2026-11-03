import { Focus, Minus, Plus } from "lucide-react";

import IconButton from "@/shared/components/IconButton";
import { cn } from "@/shared/lib/cn";
import { cameraBus } from "@/shared/stores/cameraBus";
import { uiStore, useUi } from "@/shared/stores/useUiStore";

/** 카메라: 확대 · 축소 · 맞춤(선택 장비 / 현재 시점) · 전체 보기(씬 확대) · Wireframe(와이어프레임 보기) */
export default function SceneControls() {
  const { wireframe, sceneExpanded, selectedId } = useUi();

  return (
    <div className="pointer-events-auto flex items-center gap-1">
      <IconButton
        aria-label="확대"
        title="확대"
        onClick={() => cameraBus.request({ kind: "zoom", factor: 0.75 })}
      >
        <Plus size={18} />
      </IconButton>

      <IconButton
        aria-label="축소"
        title="축소"
        onClick={() => cameraBus.request({ kind: "zoom", factor: 1.33 })}
      >
        <Minus size={18} />
      </IconButton>

      <IconButton
        aria-label="맞춤"
        title={selectedId ? "선택 장비에 맞춤" : "현재 화면 기본 시점"}
        onClick={() => cameraBus.request({ kind: "fit" })}
      >
        <Focus size={18} />
      </IconButton>

      <button
        type="button"
        aria-pressed={sceneExpanded}
        title="헤더와 사이드바를 남기고 씬을 크게 보기"
        onClick={uiStore.getState().toggleSceneExpanded}
        className={cn(
          "h-11 w-[92px] rounded text-label font-semibold text-text-primary hover:brightness-110",
          sceneExpanded
            ? "bg-primary-fill ring-2 ring-primary-on-dark"
            : "bg-primary-fill",
        )}
      >
        전체 보기
      </button>

      <button
        type="button"
        aria-pressed={wireframe}
        title={wireframe ? "실제 모델로 보기" : "와이어프레임으로 보기"}
        onClick={uiStore.getState().toggleWireframe}
        className={cn(
          "h-11 w-[92px] rounded border text-label hover:border-text-tertiary",
          wireframe
            ? "border-primary-on-dark bg-bg-surface text-text-primary"
            : "border-border-default bg-bg-surface text-text-tertiary",
        )}
      >
        {wireframe ? "Wireframe" : "View"}
      </button>
    </div>
  );
}
