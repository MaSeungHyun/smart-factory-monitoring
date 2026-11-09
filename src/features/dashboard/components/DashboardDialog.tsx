import { useMemo } from 'react'

import { ChartNoAxesCombined, X } from 'lucide-react'

import { RUN_TARGET, useDashboardView, usePlayback, usePlaybackPick } from '@/features/playback'
import Card from '@/shared/components/Card'
import SegmentProgressBar from '@/shared/components/SegmentProgressBar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/Tabs'
import { formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'
import { dashboardDialogStore, useDashboardDialog } from '@/shared/stores/useDashboardDialogStore'

import AlarmList from './AlarmList'
import EquipmentCard from './EquipmentCard'
import FactoryInsightPanel from './FactoryInsightPanel'
import { BarLineChart, LineChart } from './charts'
import { buildFactoryInsights } from '../lib/factoryInsights'
import { throughputBuckets } from '../lib/throughputBuckets'

function KpiTile({ label, value, unit, sub, tone }: { label: string; value: string; unit?: string; sub?: string; tone?: 'error' | 'success' }) {
  return (
    <Card className="p-3">
      <p className="text-body text-text-secondary">{label}</p>

      <p
        className={cn(
          'mt-2 text-h1 tabular-nums',
          tone === 'error' ? 'text-status-error' : tone === 'success' ? 'text-status-success' : 'text-text-primary',
        )}
      >
        {value}
        {unit ? <span className="ml-1 text-caption text-text-tertiary">{unit}</span> : null}
      </p>

      {sub ? <p className="mt-1 text-caption text-text-tertiary">{sub}</p> : null}
    </Card>
  )
}

/** robot_IK DashboardDialog 스타일 — 개요 KPI·차트 · 추이 · 설비 · 알람 */
export default function DashboardDialog() {
  const { open } = useDashboardDialog()

  const view = useDashboardView()

  const { run } = usePlayback()

  const playing = usePlaybackPick((snap) => snap.playing)

  const time = usePlaybackPick((snap) => snap.time)

  const factoryElapsed = (run?.meta.factoryElapsedAtStart ?? run?.meta.simTimeOffset ?? 0) + time

  const hourly = useMemo(() => throughputBuckets(run, factoryElapsed, 60), [run, factoryElapsed])

  const fine = useMemo(() => throughputBuckets(run, factoryElapsed, 20), [run, factoryElapsed])

  if (!open) return null

  const kpis = view?.kpis ?? []

  const stages = view?.stages ?? []

  const equipment = view?.equipment ?? []

  const alarms = view?.alarms ?? []

  const alarmHistory = view?.alarmHistory ?? []

  const status = view?.statusCounts

  const oee = kpis.find((item) => item.id === 'oee')

  const defect = kpis.find((item) => item.id === 'defect')

  const inbound = kpis.find((item) => item.id === 'inbound')

  const outbound = kpis.find((item) => item.id === 'outbound')

  const processed = view?.throughput.value ?? 0

  const target = view?.throughput.target ?? RUN_TARGET

  const progress = Math.min(100, Math.round((processed / target) * 100))

  const rack = stages.find((stage) => stage.icon === 'amr')

  const defectRate = (() => {
    const scan = stages.find((stage) => stage.icon === 'scan')

    if (!scan || scan.value <= 0) return 0

    const count = Number(String(defect?.value ?? '0').replace(/,/g, ''))

    return Math.min(100, (count / scan.value) * 100)
  })()

  const quality = Math.max(0, 100 - defectRate)

  const hourRate = hourly.length ? Math.round(hourly.reduce((sum, row) => sum + row.placed, 0) / Math.max(hourly.length, 1)) : 0

  const defectCount = Number(String(defect?.value ?? '0').replace(/,/g, ''))

  const insights = buildFactoryInsights({
    progress,
    processed,
    target,
    quality,
    defectRate,
    defectCount,
    oee: oee?.value,
    rackPercent: rack?.percent ?? 0,
    alarmCount: alarms.length,
    errorCount: status?.error ?? 0,
    idleCount: status?.idle ?? 0,
    runningCount: status?.running ?? 0,
  })

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

            <TabsList className="grid-cols-4 w-auto auto-cols-auto" aria-label="대시보드 탭">
              <TabsTrigger value="overview" className="px-3">
                개요
              </TabsTrigger>

              <TabsTrigger value="trend" className="px-3">
                추이
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

          <div className="scroll-thin flex min-h-0 flex-1 flex-col overflow-auto p-4">
            <TabsContent value="overview" className="flex min-h-full flex-1 flex-col outline-none">
              {!view ? (
                <p className="py-10 text-center text-caption text-text-tertiary">재생 데이터가 없습니다</p>
              ) : (
                <div className="flex min-h-full flex-1 flex-col gap-4">
                  <div className="grid shrink-0 grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
                    <KpiTile label="오늘 처리량" value={formatNumber(processed)} unit="박스" sub={`목표 대비 ${progress}%`} />
                    <KpiTile label="시간당 적재" value={formatNumber(hourRate)} unit="개/h" sub="시간 버킷 평균" />
                    <KpiTile label="입고 누적" value={inbound?.value ?? '0'} unit="박스" />
                    <KpiTile label="출고 누적" value={outbound?.value ?? '0'} unit="박스" />
                    <KpiTile
                      label="불량"
                      value={defect?.value ?? '0'}
                      unit="개"
                      sub={`불량률 ${defectRate.toFixed(1)}%`}
                      tone={Number(String(defect?.value ?? '0').replace(/,/g, '')) > 0 ? 'error' : undefined}
                    />
                    <KpiTile label="품질" value={quality.toFixed(1)} unit="%" sub="1 − 불량률" tone={quality >= 95 ? 'success' : undefined} />
                    <KpiTile label="OEE" value={oee?.value ?? '0'} unit="%" tone="success" sub="로봇 가동률 평균" />
                    <KpiTile label="랙 점유" value={String(rack?.percent ?? 0)} unit="%" sub={rack?.statusLabel} />
                  </div>

                  <div className="grid shrink-0 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <Card className="p-3">
                      <p className="text-title text-text-primary">시간대별 투입 / 적재</p>
                      <p className="mt-2 text-caption text-text-tertiary">1시간 단위 · 시프트 경과</p>

                      <div className="mt-4">
                        <BarLineChart
                          labels={hourly.map((row) => row.label)}
                          a={hourly.map((row) => row.inbound)}
                          b={hourly.map((row) => row.placed)}
                          aLabel="투입"
                          bLabel="적재"
                        />
                      </div>
                    </Card>

                    <div className="grid gap-3">
                      <Card className="p-3">
                        <p className="text-title text-text-primary">설비 상태</p>

                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded border border-status-success/40 bg-status-success/10 px-2 py-3">
                            <p className="text-caption text-text-secondary">작동</p>
                            <p className="text-h1 tabular-nums text-status-success">{status?.running ?? 0}</p>
                          </div>

                          <div className="rounded border border-status-warning/40 bg-status-warning/10 px-2 py-3">
                            <p className="text-caption text-text-secondary">대기</p>
                            <p className="text-h1 tabular-nums text-status-warning">{status?.idle ?? 0}</p>
                          </div>

                          <div className="rounded border border-status-error/40 bg-status-error/10 px-2 py-3">
                            <p className="text-caption text-text-secondary">고장</p>
                            <p className="text-h1 tabular-nums text-status-error">{status?.error ?? 0}</p>
                          </div>
                        </div>

                        <p className="mt-2 text-caption text-text-tertiary">열린 알람 {alarms.length}건</p>
                      </Card>

                      <Card className="p-3">
                        <p className="text-title text-text-primary">목표 달성</p>

                        <p className="mt-4 text-display tabular-nums text-text-primary">
                          {progress}
                          <span className="ml-1 text-caption text-text-tertiary">%</span>
                        </p>

                        <SegmentProgressBar value={progress} count={70} fillClassName="fill-status-success" className="mt-2" />

                        <p className="mt-2 text-caption text-text-tertiary">
                          {formatNumber(processed)} / {formatNumber(target)} 박스
                        </p>
                      </Card>
                    </div>
                  </div>

                  <Card className="shrink-0 p-3">
                    <p className="text-title text-text-primary">공정 흐름</p>

                    <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
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

                  <FactoryInsightPanel insights={insights} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="trend" className="outline-none">
              {!run?.aggregates ? (
                <p className="py-10 text-center text-caption text-text-tertiary">추이 집계 데이터가 없습니다</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-3">
                  <Card className="p-3">
                    <p className="text-title text-text-primary">처리량 (적재 개/20분)</p>
                    <p className="mt-2 text-caption text-text-tertiary">시프트 경과 구간별</p>

                    <div className="mt-4">
                      <LineChart
                        values={fine.map((row) => row.placed)}
                        labels={fine.map((row) => row.label)}
                        label="적재"
                        unit=" 개"
                      />
                    </div>
                  </Card>

                  <Card className="p-3">
                    <p className="text-title text-text-primary">불량률 (%)</p>
                    <p className="mt-2 text-caption text-text-tertiary">스캔 대비</p>

                    <div className="mt-4">
                      <LineChart
                        values={fine.map((row) => (row.scanned > 0 ? (row.defects / row.scanned) * 100 : row.defects > 0 ? 100 : 0))}
                        labels={fine.map((row) => row.label)}
                        label="불량률"
                        unit="%"
                        max={100}
                      />
                    </div>
                  </Card>

                  <Card className="p-3">
                    <p className="text-title text-text-primary">OEE (%)</p>
                    <p className="mt-2 text-caption text-text-tertiary">가동률 × 품질</p>

                    <div className="mt-4">
                      <LineChart values={fine.map((row) => row.oee)} labels={fine.map((row) => row.label)} label="OEE" unit="%" max={100} />
                    </div>
                  </Card>

                  <Card className="p-3">
                    <p className="text-title text-text-primary">가동률 (%)</p>
                    <p className="mt-2 text-caption text-text-tertiary">로봇 평균 util</p>

                    <div className="mt-4">
                      <LineChart
                        values={fine.map((row) => row.util)}
                        labels={fine.map((row) => row.label)}
                        label="가동률"
                        unit="%"
                        max={100}
                      />
                    </div>
                  </Card>

                  <Card className="p-3">
                    <p className="text-title text-text-primary">품질 (%)</p>
                    <p className="mt-2 text-caption text-text-tertiary">1 − 불량률</p>

                    <div className="mt-4">
                      <LineChart
                        values={fine.map((row) => row.quality)}
                        labels={fine.map((row) => row.label)}
                        label="품질"
                        unit="%"
                        max={100}
                      />
                    </div>
                  </Card>

                  <Card className="p-3">
                    <p className="text-title text-text-primary">입고 (개/20분)</p>
                    <p className="mt-2 text-caption text-text-tertiary">시프트 경과 구간별</p>

                    <div className="mt-4">
                      <LineChart
                        values={fine.map((row) => row.inbound)}
                        labels={fine.map((row) => row.label)}
                        label="입고"
                        unit=" 개"
                      />
                    </div>
                  </Card>

                  <Card className="p-3 lg:col-span-3">
                    <p className="text-title text-text-primary">시간대별 적재 / 출고</p>
                    <p className="mt-2 text-caption text-text-tertiary">1시간 단위 · 가상 시프트 보정</p>

                    <div className="mt-4">
                      <BarLineChart
                        labels={hourly.map((row) => row.label)}
                        a={hourly.map((row) => row.placed)}
                        b={hourly.map((row) => row.outbound)}
                        aLabel="적재"
                        bLabel="출고"
                      />
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
              <AlarmList alarms={alarmHistory} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
