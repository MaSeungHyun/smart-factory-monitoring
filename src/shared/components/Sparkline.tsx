interface SparklineProps {
  points: number[]
  width?: number
  height?: number
}

export default function Sparkline({ points, width = 64, height = 24 }: SparklineProps) {
  const min = Math.min(...points)

  const max = Math.max(...points)

  const range = max - min || 1

  const path = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * width

      const y = height - ((point - min) / range) * height

      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline points={path} fill="none" stroke="var(--color-status-success)" strokeWidth={1.5} />
    </svg>
  )
}
