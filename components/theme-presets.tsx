'use client'

import cn from 'clsx'
import { useEffect, useSyncExternalStore } from 'react'

type ThemePreset = 'paper' | 'mist' | 'graphite'
type ThemeMode = 'light' | 'dark'

const STORAGE_KEY = 'qaiik-theme-preset'
const MODE_STORAGE_KEY = 'qaiik-theme-mode'
const THEME_CHANGE_EVENT = 'qaiik:theme-preset-change'
const DEFAULT_PRESET: ThemePreset = 'paper'
const DEFAULT_MODE: ThemeMode = 'light'

const PRESETS: Array<{ id: ThemePreset; label: string }> = [
  { id: 'paper', label: 'Paper' },
  { id: 'mist', label: 'Mist' },
  { id: 'graphite', label: 'Graphite' },
]
const MODES: Array<{ id: ThemeMode; label: string }> = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]

function isThemePreset(value: string | null): value is ThemePreset {
  return value === 'paper' || value === 'mist' || value === 'graphite'
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark'
}

function applyThemePreset(preset: ThemePreset) {
  document.documentElement.setAttribute('data-theme-preset', preset)
}

function applyThemeMode(mode: ThemeMode) {
  document.documentElement.setAttribute('data-theme-mode', mode)
}

function readThemePresetFromClient(): ThemePreset {
  if (typeof window === 'undefined') return DEFAULT_PRESET

  const savedPreset = window.localStorage.getItem(STORAGE_KEY)
  if (isThemePreset(savedPreset)) return savedPreset

  const attributePreset =
    document.documentElement.getAttribute('data-theme-preset')
  if (isThemePreset(attributePreset)) return attributePreset

  return DEFAULT_PRESET
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

  const onCustomEvent = () => onStoreChange()
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY && event.key !== MODE_STORAGE_KEY) {
      return
    }
    onStoreChange()
  }
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onMediaChange = () => onStoreChange()

  window.addEventListener(THEME_CHANGE_EVENT, onCustomEvent)
  window.addEventListener('storage', onStorage)
  mediaQuery.addEventListener('change', onMediaChange)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onCustomEvent)
    window.removeEventListener('storage', onStorage)
    mediaQuery.removeEventListener('change', onMediaChange)
  }
}

function getThemePresetSnapshot(): ThemePreset {
  return readThemePresetFromClient()
}

function getThemePresetServerSnapshot(): ThemePreset {
  return DEFAULT_PRESET
}

function getThemeModeSnapshot(): ThemeMode {
  return readThemeModeFromClient()
}

function getThemeModeServerSnapshot(): ThemeMode {
  return DEFAULT_MODE
}

function persistThemePreset(preset: ThemePreset) {
  if (typeof window === 'undefined') return
  applyThemePreset(preset)
  window.localStorage.setItem(STORAGE_KEY, preset)
}

function persistThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') return
  applyThemeMode(mode)
  window.localStorage.setItem(MODE_STORAGE_KEY, mode)
}

export default function ThemePresets() {
  const activePreset = useSyncExternalStore(
    subscribeToThemeState,
    getThemePresetSnapshot,
    getThemePresetServerSnapshot,
  )
  const activeMode = useSyncExternalStore(
    subscribeToThemeState,
    getThemeModeSnapshot,
    getThemeModeServerSnapshot,
  )

  useEffect(() => {
    applyThemePreset(activePreset)
  }, [activePreset])
  useEffect(() => {
    applyThemeMode(activeMode)
  }, [activeMode])

  const onSelectPreset = (preset: ThemePreset) => {
    if (preset === activePreset || typeof window === 'undefined') return
    persistThemePreset(preset)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }
  const onSelectMode = (mode: ThemeMode) => {
    if (mode === activeMode || typeof window === 'undefined') return
    persistThemeMode(mode)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <div className='inline-flex flex-col items-end justify-end gap-1.5'>
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

      <div className='inline-flex items-center justify-end gap-2'>
        <span className='text-[10px] tracking-[0.06em] uppercase text-rurikon-200 whitespace-nowrap'>
          Theme
        </span>
        <div className='inline-flex rounded-xl border border-rurikon-border overflow-hidden bg-[var(--surface-overlay)]'>
          {PRESETS.map((preset) => {
            const isActive = activePreset === preset.id
            return (
              <button
                key={preset.id}
                type='button'
                onClick={() => onSelectPreset(preset.id)}
                aria-pressed={isActive}
                className={cn(
                  'px-2 py-1 text-[10px] leading-none transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-[var(--accent-solid)] text-[var(--accent-solid-text)]'
                    : 'bg-[var(--surface-raised)] text-rurikon-400 hover:text-rurikon-700',
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
