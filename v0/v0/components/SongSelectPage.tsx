'use client'

import { useState } from 'react'
import { Settings } from 'lucide-react'
import { SONGS, DEFAULT_SETTINGS } from '../data/songs'
import type { GameSettings, SongMeta } from '../types/game'
import SongCard from './SongCard'
import SettingsModal from './SettingsModal'

interface SongSelectPageProps {
  onStartSong: (song: SongMeta, settings: GameSettings) => void
}

export default function SongSelectPage({ onStartSong }: SongSelectPageProps) {
  const [selectedId, setSelectedId] = useState<string>(SONGS[0].id)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS)

  const selectedSong = SONGS.find((s) => s.id === selectedId)!

  return (
    <div className="flex flex-col h-screen bg-background text-foreground select-none">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Logo mark */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm text-background"
            style={{ background: '#42E8E0', boxShadow: '0 0 12px rgba(66,232,224,0.5)' }}
          >
            NB
          </div>
          <h1
            className="text-xl font-black tracking-widest font-mono text-glow-cyan"
            style={{ color: '#42E8E0' }}
          >
            NEONBEAT
          </h1>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-150"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Song list */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase mb-3 px-1">
          SELECT TRACK — {SONGS.filter((s) => !s.isDebug).length} SONGS AVAILABLE
        </p>
        <div className="flex flex-col gap-2">
          {SONGS.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              selected={song.id === selectedId}
              onClick={() => setSelectedId(song.id)}
            />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="flex-shrink-0 border-t border-border px-4 py-4 flex items-center gap-3">
        {/* Selected song preview */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-mono">SELECTED</p>
          <p
            className="text-sm font-bold truncate"
            style={{ color: selectedSong.coverColor }}
          >
            {selectedSong.title}
          </p>
        </div>

        {/* Play button */}
        <button
          onClick={() => onStartSong(selectedSong, settings)}
          className="flex-shrink-0 px-8 py-3 rounded-xl font-mono font-black text-sm tracking-widest uppercase transition-all duration-150 active:scale-95"
          style={{
            background: '#42E8E0',
            color: '#0B1020',
            boxShadow: '0 0 16px rgba(66,232,224,0.5), 0 0 32px rgba(66,232,224,0.2)',
          }}
        >
          PLAY
        </button>
      </footer>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={setSettings}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
