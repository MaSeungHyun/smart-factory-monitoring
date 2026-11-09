import { formatNumber } from '@/shared/lib/format'

export type FactoryInsightTone = 'neutral' | 'success' | 'warning' | 'error'

export interface FactoryInsight {
  tone: FactoryInsightTone
  text: string
}

/** KPI·알람·랙 점유 등으로 규칙 기반 시프트 요약 (LLM 연동 전) */
export function buildFactoryInsights(input: {
  progress: number
  processed: number
  target: number
  quality: number
  defectRate: number
  defectCount: number
  oee?: string
  rackPercent: number
  alarmCount: number
  errorCount: number
  idleCount: number
  runningCount: number
}): FactoryInsight[] {
  const insights: FactoryInsight[] = []

  if (input.progress >= 90) {
    insights.push({
      tone: 'success',
      text: `출고는 목표 대비 ${input.progress}%(${formatNumber(input.processed)}/${formatNumber(input.target)} 박스)로 시프트 목표에 근접했습니다.`,
    })
  } else if (input.progress >= 70) {
    insights.push({
      tone: 'neutral',
      text: `출고는 목표 대비 ${input.progress}%입니다. 현재 페이스를 유지하면 목표 달성이 가능합니다.`,
    })
  } else {
    insights.push({
      tone: 'warning',
      text: `출고가 목표 대비 ${input.progress}%로 낮습니다. 출고·운반 병목 여부를 확인하세요.`,
    })
  }

  if (input.defectCount > 0 || input.defectRate > 0) {
    insights.push({
      tone: input.defectRate >= 2 || input.quality < 95 ? 'error' : 'warning',
      text: `불량 ${formatNumber(input.defectCount)}개(불량률 ${input.defectRate.toFixed(1)}%, 품질 ${input.quality.toFixed(1)}%)가 집계되었습니다. 스캔·리젝트 라인을 점검하세요.`,
    })
  } else {
    insights.push({
      tone: 'success',
      text: `품질 ${input.quality.toFixed(1)}%로 스캔 기준 불량이 없습니다.`,
    })
  }

  if (input.alarmCount > 0 || input.errorCount > 0) {
    insights.push({
      tone: 'error',
      text: `열린 알람 ${input.alarmCount}건 · 고장 설비 ${input.errorCount}대입니다. 알람 탭에서 우선 조치가 필요합니다.`,
    })
  } else if (input.idleCount > input.runningCount) {
    insights.push({
      tone: 'warning',
      text: `대기 설비(${input.idleCount})가 작동(${input.runningCount})보다 많습니다. 공급·운반 지연 가능성을 확인하세요.`,
    })
  } else {
    insights.push({
      tone: 'success',
      text: `설비는 작동 ${input.runningCount} · 대기 ${input.idleCount} · 고장 0으로 안정적입니다${input.oee ? ` (OEE ${input.oee}%)` : ''}.`,
    })
  }

  if (input.rackPercent >= 85) {
    insights.push({
      tone: 'warning',
      text: `랙 점유 ${input.rackPercent}%로 여유가 적습니다. 출고·랙 순환을 앞당기는 편이 좋습니다.`,
    })
  } else if (input.rackPercent > 0) {
    insights.push({
      tone: 'neutral',
      text: `랙 점유 ${input.rackPercent}%로 보관 여유는 양호합니다.`,
    })
  }

  return insights.slice(0, 4)
}
