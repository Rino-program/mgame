'use client'

import { useState, useCallback, useEffect } from 'react'
import type { GameSettings, SongMeta } from '../v0/types/game'
import { DEFAULT_SETTINGS } from '../v0/data/songs'
import SongSelectPage from '../v0/components/SongSelectPage'
import PlayPage from '../v0/components/PlayPage'

type Screen = 'select' | 'play'
const LOCAL_STORAGE_KEY = 'neonbeat-settings'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function asBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function normalizeSettings(value: unknown): GameSettings {
  const settings = value && typeof value === 'object' ? value as Partial<GameSettings> : {}

  return {
    laneCount: DEFAULT_SETTINGS.laneCount,
    noteSpeed: clamp(Math.round(asNumber(settings.noteSpeed) ?? DEFAULT_SETTINGS.noteSpeed), 1, 10),
    showJudgement: asBoolean(settings.showJudgement) ?? DEFAULT_SETTINGS.showJudgement,
    laneHitEffect: asBoolean(settings.laneHitEffect) ?? DEFAULT_SETTINGS.laneHitEffect,
    screenShake: asBoolean(settings.screenShake) ?? DEFAULT_SETTINGS.screenShake,
    keyGuide: asBoolean(settings.keyGuide) ?? DEFAULT_SETTINGS.keyGuide,
    showTouchInputBar: asBoolean(settings.showTouchInputBar) ?? DEFAULT_SETTINGS.showTouchInputBar,
    timingOffsetMs: clamp(Math.round(asNumber(settings.timingOffsetMs) ?? DEFAULT_SETTINGS.timingOffsetMs), -500, 500),
    displayOffsetMs: clamp(Math.round(asNumber(settings.displayOffsetMs) ?? DEFAULT_SETTINGS.displayOffsetMs), -100, 100),
  }
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>('select')
  const [activeSong, setActiveSong] = useState<SongMeta | null>(null)
  const [activeSettings, setActiveSettings] = useState<GameSettings | null>(null)
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)
  const [settingsReady, setSettingsReady] = useState(false)
  const [playKey, setPlayKey] = useState(0) // bump to reset engine

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        setSettings(normalizeSettings(JSON.parse(stored)))
      }
    } catch {
      // ignore invalid stored settings
    } finally {
      setSettingsReady(true)
    }
  }, [])

  useEffect(() => {
    if (!settingsReady) return
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // ignore storage errors
    }
  }, [settings, settingsReady])

  const handleStartSong = useCallback((song: SongMeta) => {
    setActiveSong(song)
    setActiveSettings({ ...settings })
    setPlayKey((k) => k + 1)
    setScreen('play')
  }, [settings])

  const handleExit = useCallback(() => {
    setScreen('select')
  }, [])

  const handleRetry = useCallback(() => {
    setPlayKey((k) => k + 1)
  }, [])

  if (screen === 'play' && activeSong && activeSettings) {
    return (
      <PlayPage
        key={playKey}
        song={activeSong}
        settings={activeSettings}
        onExit={handleExit}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <SongSelectPage
      settings={settings}
      settingsReady={settingsReady}
      onSettingsChange={setSettings}
      onStartSong={handleStartSong}
    />
  )
}
