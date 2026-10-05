import { cn } from '@/lib/utils'

const palette = ['bg-indigo-500', 'bg-emerald-600', 'bg-sky-600', 'bg-rose-500', 'bg-amber-600', 'bg-violet-600', 'bg-teal-600']

export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?'

/** Initials in a coloured circle; the colour is stable per name. */
export const Avatar = ({ name, className }: { name: string; className?: string }) => {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 select-none items-center justify-center rounded-full text-sm font-semibold text-white',
        palette[hash % palette.length],
        className,
      )}
    >
      {initials(name)}
    </span>
  )
}
