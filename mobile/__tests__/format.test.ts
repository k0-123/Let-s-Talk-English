import { daysFromToday, firstName, formatClock, formatDayKey, formatDue, formatSpoken, initials, plural, todayKey } from '@/lib/format'

describe('format', () => {
  it('formats clocks, plurals and names', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(65)).toBe('1:05')
    expect(formatClock(119.2)).toBe('2:00')
    expect(plural(1, 'set')).toBe('1 set')
    expect(plural(3, 'set')).toBe('3 sets')
    expect(firstName('  Priya Sharma ')).toBe('Priya')
    expect(initials('Priya Sharma')).toBe('PS')
    expect(initials('')).toBe('?')
  })

  it('shows calendar days without shifting them by time zone', () => {
    expect(formatDayKey('2026-10-05')).toBe('Mon 5 Oct')
    expect(formatDue('2026-10-12T00:00:00.000Z')).toBe('Mon 12 Oct')
    expect(formatDue(null)).toBe('')
  })

  it('works out local day keys', () => {
    const now = new Date(2026, 9, 30, 22, 15)
    expect(todayKey(now)).toBe('2026-10-30')
    expect(daysFromToday(3, now)).toBe('2026-11-02')
  })

  it('only mentions speaking time when there was some', () => {
    expect(formatSpoken(95)).toBe('1:35 spoken')
    expect(formatSpoken(0)).toBeNull()
    expect(formatSpoken(null)).toBeNull()
  })
})
