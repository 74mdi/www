'use client'

import { useEffect, useSyncExternalStore } from 'react'

type ThemeMode = 'light' | 'dark'

const MODE_STORAGE_KEY = 'qaiik-theme-mode'
const THEME_MODE_CHANGE_EVENT = 'qaiik:theme-mode-change'
const DEFAULT_MODE: ThemeMode = 'light'

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme-mode', mode)
}

function readThemeModeFromClient(): ThemeMode {
  if (typeof window === 'undefined') return DEFAULT_MODE

  const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY)
  if (isThemeMode(savedMode)) return savedMode

  const attributeMode = document.documentElement.getAttribute('data-theme-mode')
  if (isThemeMode(attributeMode)) return attributeMode

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function subscribeToThemeState(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const onThemeModeEvent = () => onStoreChange()
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== MODE_STORAGE_KEY) {
      return
    }
    onStoreChange()
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onMediaChange = () => onStoreChange()

  window.addEventListener(THEME_MODE_CHANGE_EVENT, onThemeModeEvent)
  window.addEventListener('storage', onStorage)
  mediaQuery.addEventListener('change', onMediaChange)

  return () => {
    window.removeEventListener(THEME_MODE_CHANGE_EVENT, onThemeModeEvent)
    window.removeEventListener('storage', onStorage)
    mediaQuery.removeEventListener('change', onMediaChange)
  }
}

function getThemeModeSnapshot(): ThemeMode {
  return readThemeModeFromClient()
}

function getThemeModeServerSnapshot(): ThemeMode {
  return DEFAULT_MODE
}

function persistThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  applyThemeMode(mode)
  window.localStorage.setItem(MODE_STORAGE_KEY, mode)
}

export default function ThemeModeToggle() {
  const activeMode = useSyncExternalStore(
    subscribeToThemeState,
    getThemeModeSnapshot,
    getThemeModeServerSnapshot,
  )

  useEffect(() => {
    applyThemeMode(activeMode)
  }, [activeMode])

  const onToggleMode = () => {
    if (typeof window === 'undefined') return
    const nextMode: ThemeMode = activeMode === 'dark' ? 'light' : 'dark'
    persistThemeMode(nextMode)
    window.dispatchEvent(new Event(THEME_MODE_CHANGE_EVENT))
  }

  return (
    <div className='inline-flex items-center justify-end'>
      <button
        type='button'
        onClick={onToggleMode}
        aria-label={`Switch to ${activeMode === 'dark' ? 'light' : 'dark'} mode`}
        className='rounded-xl border border-rurikon-border bg-[var(--surface-overlay)] px-2.5 py-1 text-[10px] leading-none transition-colors whitespace-nowrap hover:text-rurikon-700'
      >
        {activeMode === 'dark' ? 'Dark' : 'Light'}
      </button>
    </div>
  )
}
