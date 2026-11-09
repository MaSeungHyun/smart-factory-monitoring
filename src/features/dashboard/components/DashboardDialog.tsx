import { ChartNoAxesCombined, LayoutGrid, X } from 'lucide-react'

import { useDashboardView, usePlaybackPick } from '@/features/playback'
import Card from '@/shared/components/Card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs'
import { formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { dashboardDialogStore, useDashboardDialog } from '@/shared/stores/useDashboardDialogStore'

import EquipmentCard from './EquipmentCard'
import AlarmList from './AlarmList'

/** robot_IK DashboardDialog 와 같은 전체 대시보드 오버레이 (헤더 아래) */
export default function DashboardDialog() {
  const { open } = useDashboardDialog()

  const view = useDashboardView()

  const playing = usePlaybackPick((snap) => snap.playing)

  const time = usePlaybackPick((snap) => snap.time)

  if (!open) return null

  const kpis = view?.kpis ?? []

  const stages = view?.stages ?? []

  const equipment = view?.equipment ?? []

  const alarms = view?.alarms ?? []

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 bottom-0 z-[500]">
      <button
        type="button"
        aria-label="대시보드 닫기"
        className="pointer-events-auto absolute inset-0 bg-bg-base/80"
        onClick={() => dashboardDialogStore.getState().setOpen(false)}
      />

      <div
        role="dialog"
        aria-modal
        aria-label="대시보드"
        className="pointer-events-auto absolute inset-4 flex min-h-0 flex-col rounded border border-border-default bg-bg-base text-text-primary shadow-lg"
      >
        <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
          <div className="flex shrink-0 items-center gap-4 border-b border-border-default px-4 py-2">
            <span className="flex items-center gap-2 text-h2 text-text-primary">
              <ChartNoAxesCombined size={16} />
              대시보드
            </span>

            <TabsList className="grid-cols-3 w-auto auto-cols-auto" aria-label="대시보드 탭">
              <TabsTrigger value="overview" className="px-3">
                개요
              </TabsTrigger>

              <TabsTrigger value="equipment" className="px-3">
                설비
              </TabsTrigger>

              <TabsTrigger value="alarm" className="px-3">
                알람
              </TabsTrigger>
            </TabsList>

            <p className="ml-auto text-caption tabular-nums text-text-secondary">
              재생 {Math.floor(time / 60)}:{String(Math.floor(time % 60)).padStart(2, '0')} · {playing ? 'LIVE' : 'PAUSE'}
            </p>

            <button
              type="button"
              aria-label="닫기"
              onClick={() => dashboardDialogStore.getState().setOpen(false)}
              className="flex size-8 items-center justify-center rounded text-text-secondary hover:bg-bg-surface-2 hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>

          <div className="scroll-thin min-h-0 flex-1 overflow-auto p-4">
            <TabsContent value="overview" className="outline-none">
              {!view ? (
                <p className="py-10 text-center text-caption text-text-tertiary">재생 데이터가 없습니다</p>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {kpis.map((item) => (
                      <Card key={item.id} className="gap-1 p-3">
                        <p className="text-caption text-text-secondary">{item.label}</p>

                        <p className="text-h1 tabular-nums text-text-primary">
                          {item.value}
                          {item.unit ? <span className="ml-1 text-caption text-text-tertiary">{item.unit}</span> : null}
                        </p>

                        {item.sub ? <p className="text-caption text-text-tertiary">{item.sub}</p> : null}
                      </Card>
                    ))}
                  </div>

                  <Card className="gap-3 p-3">
                    <p className="text-body font-semibold text-text-primary">
                      오늘 처리량
                      <span className="ml-2 text-caption font-normal text-text-tertiary">
                        목표 {formatNumber(view.throughput.target)} {view.throughput.unit}
                      </span>
                    </p>

                    <p className="text-display tabular-nums text-text-primary">
                      {formatNumber(view.throughput.value)}
                      <span className="ml-1 text-caption text-text-tertiary">{view.throughput.unit}</span>
                    </p>
                  </Card>

                  <Card className="gap-3 p-3">
                    <p className="text-body font-semibold text-text-primary">공정 흐름</p>

                    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
                      {stages.map((stage) => (
                        <div
                          key={stage.id}
                          className={cn(
                            'rounded border p-2',
                            stage.status === 'error'
                              ? 'border-status-error/50 bg-status-error/10'
                              : stage.status === 'warning'
                                ? 'border-status-warning/40 bg-status-warning/10'
                                : 'border-border-default bg-bg-surface-2',
                          )}
                        >
                          <p className="text-caption text-text-secondary">{stage.name}</p>

                          <p className="mt-1 text-h2 tabular-nums text-text-primary">
                            {formatNumber(stage.value)}
                            <span className="ml-1 text-caption text-text-tertiary">{stage.unit}</span>
                          </p>

                          <p className="mt-1 flex justify-between text-caption text-text-tertiary">
                            <span>{stage.statusLabel}</span>
                            <span className="tabular-nums">{stage.percent}%</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="equipment" className="outline-none">
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {equipment.map((item) => (
                  <EquipmentCard key={item.id} item={item} selected={false} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="alarm" className="outline-none">
              <AlarmList alarms={alarms} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
