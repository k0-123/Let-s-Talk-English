/** Weekly goal as a radial meter: a track and a fill from the same hue. */
export const GoalRing = ({ value, goal, size = 96 }: { value: number; goal: number; size?: number }) => {
  const radius = 15.5
  const circumference = 2 * Math.PI * radius
  const ratio = goal > 0 ? Math.min(1, value / goal) : 0
  const reached = value >= goal
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" width={size} height={size} className="-rotate-90" role="img" aria-label={`${value} of ${goal} sets this week`}>
        <circle cx="18" cy="18" r={radius} fill="none" strokeWidth="3.5" className="stroke-chart-0" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          className={reached ? 'stroke-success' : 'stroke-primary'}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none tabular-nums">{value}</span>
        <span className="text-[11px] text-muted-foreground">of {goal}</span>
      </div>
    </div>
  )
}
