import { useSceneWarm } from "@/features/scene/lib/sceneWarm";
import { MonitoringPage } from "@/pages/monitoring";
import { isElectron } from "@/shared/lib/isElectron";

import TitleBar from "./components/TitleBar";

export default function App() {
  const sceneWarm = useSceneWarm();

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {sceneWarm && isElectron() && <TitleBar />}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MonitoringPage />
      </div>
    </div>
  );
}
