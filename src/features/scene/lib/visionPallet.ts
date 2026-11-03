import { PALLET_SCAN_SWEEP_S, PALLET_TARGET_PULSE_S } from '@/shared/constants/animation'

import type { PalletPlan } from './palletPlan'

/** 화면 좌표 투영 (카메라 뒤면 null) */
export type Project = (x: number, y: number, z: number) => [number, number] | null

/** 박스 원점은 윗면 → 칸 바닥면은 이만큼 아래 */
const BOX_HEIGHT = 0.36

const SVG_NS = 'http://www.w3.org/2000/svg'

const COLOR = {
  target: '#34c77b',
  filled: '#4fa8d4',
  empty: 'rgba(255, 255, 255, 0.55)',
  text: 'rgba(255, 255, 255, 0.92)',
} as const

interface Nodes {
  plan: PalletPlan
  svg: SVGSVGElement
  cells: SVGPolygonElement[]
  scores: SVGTextElement[]
  sweep: SVGLineElement
  label: HTMLDivElement
}

const panels = new WeakMap<HTMLElement, Nodes>()

function build(host: HTMLElement, plan: PalletPlan) {
  host.replaceChildren()

  const svg = document.createElementNS(SVG_NS, 'svg')

  svg.setAttribute('style', 'position:absolute;inset:0;width:100%;height:100%;overflow:visible;')

  const cells = plan.cells.map(() => {
    const node = document.createElementNS(SVG_NS, 'polygon')

    svg.append(node)

    return node
  })

  const scores = plan.cells.map(() => {
    const node = document.createElementNS(SVG_NS, 'text')

    node.setAttribute('text-anchor', 'middle')

    node.setAttribute('dominant-baseline', 'middle')

    node.setAttribute('style', 'font-size:8px;font-weight:600;')

    svg.append(node)

    return node
  })

  const sweep = document.createElementNS(SVG_NS, 'line')

  sweep.setAttribute('stroke', COLOR.target)

  sweep.setAttribute('stroke-width', '1.5')

  sweep.setAttribute('stroke-opacity', '0.7')

  svg.append(sweep)

  const label = document.createElement('div')

  label.style.cssText = `position:absolute;font-size:9px;line-height:11px;font-weight:600;white-space:pre;color:${COLOR.text};background:rgba(10,14,20,0.55);padding:1px 4px;border-radius:2px;pointer-events:none;`

  host.append(svg, label)

  const nodes = { plan, svg, cells, scores, sweep, label }

  panels.set(host, nodes)

  return nodes
}

/**
 * 팔레타이징 인셋: 팔레트 실제 영역을 칸(네모) 으로 나눠 카메라 화면에 투영한다.
 * 채워진 칸 · 다음 적재 칸 · 후보 점수 · 층/신뢰도를 재생 시각에 맞춰 갱신
 */
export function paintPallet(host: HTMLElement, plan: PalletPlan | null, time: number, project: Project, halfX: number, halfZ: number) {
  if (!plan) {
    host.replaceChildren()

    panels.delete(host)

    return
  }

  let nodes = panels.get(host)

  if (!nodes || nodes.plan !== plan) nodes = build(host, plan)

  const nextIndex = plan.slots.findIndex((slot) => slot.at > time)

  const target = nextIndex >= 0 ? plan.slots[nextIndex] : null

  const layer = target?.layer ?? plan.layers - 1

  const top = new Map<number, number>()

  for (const slot of plan.slots) {
    if (slot.at <= time && time < slot.leave) top.set(slot.cell, Math.max(top.get(slot.cell) ?? -1, slot.layer))
  }

  const previous = nextIndex > 0 ? plan.slots[nextIndex - 1].at : (target?.at ?? time) - 6

  const progress = target ? Math.min(1, Math.max(0, (time - previous) / Math.max(target.at - previous, 0.5))) : 1

  const pulse = 0.55 + 0.45 * Math.abs(Math.sin((time / PALLET_TARGET_PULSE_S) * Math.PI))

  // 칸 평면 높이: 이번 층 박스의 바닥면
  const layerTop = plan.slots.find((slot) => slot.layer === layer)?.y ?? plan.slots[0].y

  const planeY = layerTop - BOX_HEIGHT

  let minX = Infinity

  let maxX = -Infinity

  let minY = Infinity

  let visible = 0

  plan.cells.forEach((cell, index) => {
    const polygon = nodes.cells[index]

    const score = nodes.scores[index]

    const cos = Math.cos(cell.yaw)

    const sin = Math.sin(cell.yaw)

    const points: [number, number][] = []

    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const dx = u * halfX * 0.94

      const dz = v * halfZ * 0.94

      const point = project(cell.x + dx * cos + dz * sin, planeY, cell.z - dx * sin + dz * cos)

      if (point) points.push(point)
    }

    if (points.length < 4) {
      polygon.setAttribute('points', '')

      score.textContent = ''

      return
    }

    visible += 1

    polygon.setAttribute('points', points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' '))

    for (const [x, y] of points) {
      minX = Math.min(minX, x)

      maxX = Math.max(maxX, x)

      minY = Math.min(minY, y)
    }

    const cx = points.reduce((sum, [x]) => sum + x, 0) / 4

    const cy = points.reduce((sum, [, y]) => sum + y, 0) / 4

    score.setAttribute('x', cx.toFixed(1))

    score.setAttribute('y', cy.toFixed(1))

    const filled = (top.get(index) ?? -1) >= layer

    if (target && index === target.cell) {
      polygon.setAttribute('style', `fill:rgba(52,199,123,${(0.3 * pulse).toFixed(2)});stroke:${COLOR.target};stroke-width:1.5;`)

      score.textContent = `${Math.round(70 + 28 * progress)}`

      score.setAttribute('fill', COLOR.target)
    } else if (filled) {
      polygon.setAttribute('style', `fill:rgba(79,168,212,0.28);stroke:${COLOR.filled};stroke-width:1;`)

      score.textContent = ''
    } else {
      polygon.setAttribute('style', `fill:rgba(255,255,255,0.04);stroke:${COLOR.empty};stroke-width:1;stroke-dasharray:3 2;`)

      const distance = target ? Math.hypot(cell.x - target.x, cell.z - target.z) : 1

      // 후보 칸 점수: 목표 칸보다 낮게, 분석이 진행될수록 차이가 벌어진다
      const value = 70 + 20 * progress - distance * 40 * (0.4 + progress) + 4 * Math.sin(time * 3 + index)

      score.textContent = target ? `${Math.max(12, Math.round(value))}` : ''

      score.setAttribute('fill', COLOR.empty)
    }
  })

  if (visible === 0) {
    nodes.sweep.setAttribute('visibility', 'hidden')

    nodes.label.style.display = 'none'

    return
  }

  // 팔레트 위를 가로지르는 분석 스캔 선 (재생 시각 기준이라 일시정지하면 멈춘다)
  const phase = (time % PALLET_SCAN_SWEEP_S) / PALLET_SCAN_SWEEP_S

  const sweepX = minX + (maxX - minX) * phase

  nodes.sweep.setAttribute('visibility', target ? 'visible' : 'hidden')

  nodes.sweep.setAttribute('x1', sweepX.toFixed(1))

  nodes.sweep.setAttribute('x2', sweepX.toFixed(1))

  nodes.sweep.setAttribute('y1', (minY - 4).toFixed(1))

  nodes.sweep.setAttribute('y2', (minY + (maxX - minX) * 0.6).toFixed(1))

  nodes.label.style.display = ''

  nodes.label.style.left = `${Math.max(2, minX).toFixed(1)}px`

  nodes.label.style.top = `${Math.max(2, minY - 26).toFixed(1)}px`

  nodes.label.textContent = target
    ? `최적 위치 분석 · ${layer + 1}/${plan.layers}층 · 신뢰도 ${(80 + 18 * progress + Math.sin(time * 5)).toFixed(1)}%\nX ${target.x.toFixed(2)} Z ${target.z.toFixed(2)} m`
    : '적재 완료 · 대기'
}