'use client'

import { useState } from 'react'

import type { DayCount } from '@/lib/progress'
import { MONTHS, formatDayKey } from '@/lib/utils'

const CELL = 12
const GAP = 3
const LEVEL_CLASS = ['fill-chart-0', 'fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4']
const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', '']

const level = (count: number): number => (count <= 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : count <= 4 ? 3 : 4)

const formatDay = formatDayKey

/**
 * GitHub-style practice calendar: one column per week (Monday first), one
 * sequential hue from empty to most. Hover or tap a day for its count; a
 * table view lists every week for screen readers and anyone who prefers text.
 */
export const ActivityHeatmap = ({ days, today }: { days: DayCount[]; today: string }) => {
  const [hover, setHover] = useState<{ day: DayCount; x: number; y: number } | null>(null)
  const show = (day: DayCount, target: SVGRectElement) => {
    // The SVG scales with its card, so position the tooltip from the rendered box.
    const box = target.getBoundingClientRect()
    const container = target.ownerSVGElement?.parentElement?.parentElement?.getBoundingClientRect()
    if (!container) return
    setHover({ day, x: box.left - container.left + box.width / 2, y: box.top - container.top })
  }
  const weeks = Math.ceil(days.length / 7)
  const labelWidth = 28
  const width = labelWidth + weeks * (CELL + GAP)
  const height = 16 + 7 * (CELL + GAP)
  const total = days.reduce((sum, d) => sum + d.count, 0)
  const activeDays = days.filter((d) => d.count > 0).length

  const monthLabels: { x: number; label: string }[] = []
  for (let w = 0; w < weeks; w++) {
    const first = days[w * 7]
    if (!first) continue
    const date = new Date(`${first.day}T00:00:00Z`)
    if (w === 0 || date.getUTCDate() <= 7) {
      monthLabels.push({ x: labelWidth + w * (CELL + GAP), label: MONTHS[date.getUTCMonth()] })
    }
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          style={{ minWidth: width, maxWidth: width * 2.4 }}
          role="img"
          aria-label={`Practice calendar for the last ${weeks} weeks: ${total} sets on ${activeDays} days.`}
          className="block"
          onMouseLeave={() => setHover(null)}
        >
          {monthLabels.map((m, i) => (
            <text key={i} x={m.x} y={10} className="fill-muted-foreground text-[9px]">
              {m.label}
            </text>
          ))}
          {DAY_LABELS.map((label, i) =>
            label ? (
              <text key={label} x={0} y={16 + i * (CELL + GAP) + 9} className="fill-muted-foreground text-[9px]">
                {label}
              </text>
            ) : null,
          )}
          {days.map((d, i) => {
            const x = labelWidth + Math.floor(i / 7) * (CELL + GAP)
            const y = 16 + (i % 7) * (CELL + GAP)
            const future = d.day > today
            if (future) return null
            return (
              <rect
                key={d.day}
                x={x}
                y={y}
                width={CELL}
                height={CELL}
                rx={3}
                className={`${LEVEL_CLASS[level(d.count)]} ${d.day === today ? 'stroke-foreground/60' : ''}`}
                strokeWidth={d.day === today ? 1.5 : 0}
                onMouseEnter={(e) => show(d, e.currentTarget)}
                onClick={(e) => show(d, e.currentTarget)}
              >
                <title>{`${formatDay(d.day)}: ${d.count} ${d.count === 1 ? 'set' : 'sets'}`}</title>
              </rect>
            )
          })}
        </svg>
      </div>
      {hover && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-foreground px-2 py-1 text-xs font-medium whitespace-nowrap text-background shadow"
          style={{ left: hover.x, top: hover.y - 4 }}
        >
          {formatDay(hover.day.day)} · {hover.day.count} {hover.day.count === 1 ? 'set' : 'sets'}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {total} {total === 1 ? 'set' : 'sets'} on {activeDays} {activeDays === 1 ? 'day' : 'days'}
        </span>
        <span className="flex items-center gap-1" aria-hidden>
          Less
          {LEVEL_CLASS.map((cls) => (
            <svg key={cls} width={10} height={10}>
              <rect width={10} height={10} rx={2} className={cls} />
            </svg>
          ))}
          More
        </span>
      </div>
      <details className="mt-2 text-xs">
        <summary className="text-primary hover:underline">Show as a table</summary>
        <table className="mt-2 w-full text-left">
          <thead className="text-muted-foreground">
            <tr>
              <th className="py-1 font-medium">Week starting</th>
              <th className="py-1 text-right font-medium">Sets</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7))
              .reverse()
              .map((week) => (
                <tr key={week[0].day} className="border-t">
                  <td className="py-1">{formatDay(week[0].day)}</td>
                  <td className="py-1 text-right tabular-nums">{week.reduce((s, d) => s + d.count, 0)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
