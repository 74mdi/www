'use client'

import cn from 'clsx'
import { useEffect, useState } from 'react'

type ThemePreset = 'paper' | 'mist' | 'graphite'

const STORAGE_KEY = 'qaiik-theme-preset'
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

function getInitialThemePreset(): ThemePreset {
  if (typeof window === 'undefined') return DEFAULT_PRESET

  const attributePreset = document.documentElement.getAttribute('data-theme-preset')
  if (isThemePreset(attributePreset)) return attributePreset

  const savedPreset = window.localStorage.getItem(STORAGE_KEY)
  if (isThemePreset(savedPreset)) return savedPreset

  return DEFAULT_PRESET
}

export default function ThemePresets() {
  const [activePreset, setActivePreset] = useState<ThemePreset>(getInitialThemePreset)

  useEffect(() => {
    applyThemePreset(activePreset)
    window.localStorage.setItem(STORAGE_KEY, activePreset)
  }, [activePreset])

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
              onClick={() => setActivePreset(preset.id)}
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
