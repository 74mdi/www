'use client'

import cn from 'clsx'
import { useEffect, useSyncExternalStore } from 'react'

type ThemeMode = 'light' | 'dark'

const MODE_STORAGE_KEY = 'qaiik-theme-mode'
const THEME_MODE_CHANGE_EVENT = 'qaiik:theme-mode-change'
const DEFAULT_MODE: ThemeMode = 'light'
const MODES: Array<{ id: ThemeMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

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

  const onSelectMode = (mode: ThemeMode) => {
    if (mode === activeMode || typeof window === 'undefined') return
    persistThemeMode(mode)
    window.dispatchEvent(new Event(THEME_MODE_CHANGE_EVENT))
  }

  return (
    <div className='inline-flex items-center justify-end gap-2'>
      <span className='text-[10px] tracking-[0.06em] uppercase text-rurikon-200 whitespace-nowrap'>
        Mode
      </span>
      <div className='inline-flex rounded-xl border border-rurikon-border overflow-hidden bg-[var(--surface-overlay)]'>
        {MODES.map((mode) => {
          const isActive = activeMode === mode.id
          return (
            <button
              key={mode.id}
              type='button'
              onClick={() => onSelectMode(mode.id)}
              aria-pressed={isActive}
              className={cn(
                'px-2 py-1 text-[10px] leading-none transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                  : 'bg-[var(--surface-raised)] text-rurikon-400 hover:text-rurikon-700',
              )}
            >
              {mode.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
