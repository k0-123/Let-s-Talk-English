/** Tiny 8-week activity line for tables. Values are listed in the accessible label. */
export const Sparkline = ({ values, width = 88, height = 24 }: { values: number[]; width?: number; height?: number }) => {
  if (values.length === 0) return null
  const max = Math.max(1, ...values)
  const step = values.length > 1 ? (width - 4) / (values.length - 1) : 0
  const points = values.map((v, i) => [2 + i * step, height - 3 - (v / max) * (height - 6)] as const)
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height - 1} L${points[0][0].toFixed(1)},${height - 1} Z`
  const last = points[points.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Sets per week, oldest first: ${values.join(', ')}`}>
      <title>{`Last ${values.length} weeks: ${values.join(', ')}`}</title>
      <path d={area} className="fill-primary/10" />
      <path d={line} fill="none" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" className="stroke-primary" />
      <circle cx={last[0]} cy={last[1]} r={2.5} className="fill-primary" />
    </svg>
  )
}
