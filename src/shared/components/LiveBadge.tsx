interface LiveBadgeProps {
  playing: boolean;
}

/** 재생 상태 표시 배지. 클릭해도 재생을 바꾸지 않는다. */
export default function LiveBadge({ playing }: LiveBadgeProps) {
  return (
    <span
      role="status"
      aria-label={playing ? "실시간 재생 중" : "일시정지됨"}
      className="flex h-8 w-20 items-center justify-center gap-1 rounded bg-primary-fill text-label font-semibold text-text-primary"
    >
      <span
        className={`size-1.5 rounded-full bg-text-primary ${playing ? "animate-pulse" : "opacity-40"}`}
      />
      {playing ? "LIVE" : "PAUSE"}
    </span>
  );
}
