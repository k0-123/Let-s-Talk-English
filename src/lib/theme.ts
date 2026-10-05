export const THEME_COOKIE = 'theme'
export type ThemePreference = 'system' | 'light' | 'dark'

export const parseTheme = (value: unknown): ThemePreference =>
  value === 'light' || value === 'dark' ? value : 'system'

/**
 * Runs before first paint so the page never flashes the wrong theme.
 * Kept tiny and dependency-free; it is inlined into <head>.
 */
export const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]+)/);var t=m?m[1]:'system';var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`
