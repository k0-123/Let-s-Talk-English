'use client'

import { Monitor, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

import { THEME_COOKIE, type ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/utils'

const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Device', icon: Monitor },
]

export const applyTheme = (theme: ThemePreference) => {
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

/** Light / dark / device switch. Saves to a cookie; the account page also saves it to the profile. */
export const ThemeToggle = ({
  initial,
  onChange,
  className,
}: {
  initial: ThemePreference
  onChange?: (theme: ThemePreference) => void
  className?: string
}) => {
  const [theme, setTheme] = useState<ThemePreference>(initial)

  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme])

  return (
    <div role="radiogroup" aria-label="Theme" className={cn('inline-flex rounded-lg border bg-muted p-1', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={theme === option.value}
          onClick={() => {
            setTheme(option.value)
            applyTheme(option.value)
            onChange?.(option.value)
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            theme === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <option.icon className="size-3.5" aria-hidden />
          {option.label}
        </button>
      ))}
    </div>
  )
}
