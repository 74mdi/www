'use client'

import cn from 'clsx'
import { useEffect, useSyncExternalStore } from 'react'

type ThemePreset = 'paper' | 'mist' | 'graphite'

const STORAGE_KEY = 'qaiik-theme-preset'
const THEME_CHANGE_EVENT = 'qaiik:theme-preset-change'
const DEFAULT_PRESET: ThemePreset = 'paper'

const PRESETS: Array<{ id: ThemePreset; label: string }> = [
  { id: 'paper', label: 'Paper' },
  { id: 'mist', label: 'Mist' },
  { id: 'graphite', label: 'Graphite' },
]

function isThemePreset(value: string | null): value is ThemePreset {
  return value === 'paper' || value === 'mist' || value === 'graphite'
}

function applyThemePreset(preset: ThemePreset) {
  document.documentElement.setAttribute('data-theme-preset', preset)
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

function subscribeToThemePreset(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}

  const onCustomEvent = () => onStoreChange()
  const onStorage = (event: StorageEvent) => {
    if (event.key && event.key !== STORAGE_KEY) return
    onStoreChange()
  }

  window.addEventListener(THEME_CHANGE_EVENT, onCustomEvent)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onCustomEvent)
    window.removeEventListener('storage', onStorage)
  }
}

function getThemePresetSnapshot(): ThemePreset {
  return readThemePresetFromClient()
}

function getThemePresetServerSnapshot(): ThemePreset {
  return DEFAULT_PRESET
}

function persistThemePreset(preset: ThemePreset) {
  if (typeof window === 'undefined') return
  applyThemePreset(preset)
  window.localStorage.setItem(STORAGE_KEY, preset)
}

export default function ThemePresets() {
  const activePreset = useSyncExternalStore(
    subscribeToThemePreset,
    getThemePresetSnapshot,
    getThemePresetServerSnapshot,
  )

  useEffect(() => {
    persistThemePreset(activePreset)
  }, [activePreset])

  const onSelectPreset = (preset: ThemePreset) => {
    if (preset === activePreset || typeof window === 'undefined') return
    persistThemePreset(preset)
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  return (
    <div className='inline-flex items-center justify-end gap-2 px-2'>
      <span className='text-[10px] tracking-[0.06em] uppercase text-rurikon-200'>
        Theme
      </span>
      <div className='inline-flex rounded-xl border border-rurikon-border overflow-hidden bg-white/70'>
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.id
          return (
            <button
              key={preset.id}
              type='button'
              onClick={() => onSelectPreset(preset.id)}
              className={cn(
                'px-2 py-1 text-[10px] leading-none transition-colors',
                isActive
                  ? 'bg-rurikon-700 text-white'
                  : 'text-rurikon-400 hover:text-rurikon-700 bg-white',
              )}
            >
              {preset.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
