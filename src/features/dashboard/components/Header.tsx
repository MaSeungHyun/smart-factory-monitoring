import { Clock } from "lucide-react";

import { useNow } from "@/shared/hooks/useNow";

import AlarmBell from "./AlarmBell";
import EquipmentSearch from "./EquipmentSearch";
import logo from "./../../../../public/images/logo_grapicar@2x.png";

function formatDateTime(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");

  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  return `${day} ${time}`;
}

export default function Header() {
  const now = useNow(1000);

  return (
    <header className="flex h-full max-h-16 items-center border-b border-border-default bg-bg-base pr-6 pl-3">
      <span className="w-[256px] shrink-0 text-h1 font-black tracking-wide text-text-primary">
        <img src={logo} alt="GRAPICAR" height={65} />
      </span>

      <div className="flex-1 ml-52">
        <EquipmentSearch />
      </div>

      <div className="ml-auto flex items-center gap-2 text-body text-text-secondary tabular-nums mr-17.5">
        <Clock size={14} />

        {formatDateTime(now)}
      </div>

      <AlarmBell />
    </header>
  );
}
