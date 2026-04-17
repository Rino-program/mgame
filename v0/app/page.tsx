'use client'

import { useState, useCallback } from 'react'
import type { GameSettings, SongMeta } from '../v0/types/game'
import SongSelectPage from '../v0/components/SongSelectPage'
import PlayPage from '../v0/components/PlayPage'

type Screen = 'select' | 'play'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('select')
  const [activeSong, setActiveSong] = useState<SongMeta | null>(null)
  const [activeSettings, setActiveSettings] = useState<GameSettings | null>(null)
  const [playKey, setPlayKey] = useState(0) // bump to reset engine

  const handleStartSong = useCallback((song: SongMeta, settings: GameSettings) => {
    setActiveSong(song)
    setActiveSettings(settings)
    setPlayKey((k) => k + 1)
    setScreen('play')
  }, [])

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

  return <SongSelectPage onStartSong={handleStartSong} />
}
