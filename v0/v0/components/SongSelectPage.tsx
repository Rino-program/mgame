'use client'

import { useState } from 'react'
import { Play, Settings } from 'lucide-react'
import { SONGS } from '../data/songs'
import type { GameSettings, SongMeta } from '../types/game'
import SongCard from './SongCard'
import SettingsModal from './SettingsModal'

interface SongSelectPageProps {
  settings: GameSettings
  settingsReady: boolean
  onSettingsChange: (settings: GameSettings) => void
  onStartSong: (song: SongMeta) => void
}

export default function SongSelectPage({
  settings,
  settingsReady,
  onSettingsChange,
  onStartSong,
}: SongSelectPageProps) {
  const [selectedId, setSelectedId] = useState<string>(SONGS[0].id)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const selectedSong = SONGS.find((s) => s.id === selectedId)!
  const regularSongs = SONGS.filter((song) => !song.isDebug)

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const formatBest = (score?: number): string => {
    if (!score) return 'NO DATA'
    return score.toString().padStart(7, '0')
  }

  return (
    <div className="relative h-screen overflow-hidden bg-background text-foreground select-none">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(80% 60% at 15% -10%, rgba(66,232,224,0.20), transparent 65%), radial-gradient(70% 50% at 95% 100%, rgba(255,95,162,0.14), transparent 70%), linear-gradient(180deg, #0B1020 0%, #0A0F1C 100%)',
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <header className="flex-shrink-0 border-b border-border/70 px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono font-black text-sm text-background"
            style={{ background: '#42E8E0', boxShadow: '0 0 12px rgba(66,232,224,0.5)' }}
          >
            NB
          </div>
              <div>
                <h1
                  className="text-xl font-black tracking-[0.2em] font-mono text-glow-cyan"
                  style={{ color: '#42E8E0' }}
                >
                  NEONBEAT
                </h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground tracking-widest uppercase font-mono">
                  Browser Rhythm Arena
                </p>
              </div>
            </div>
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-150"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-mono tracking-wider">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-2 py-1 text-cyan-200">
              TRACKS {regularSongs.length}
            </span>
            <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-2 py-1 text-violet-200">
              LANES {settings.laneCount}
            </span>
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-amber-200">
              SPEED {settings.noteSpeed}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-hidden px-4 py-4 sm:px-6">
          <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="min-h-0 rounded-2xl border border-border/70 bg-[#0F1628]/80 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:p-4">
              <p className="mb-3 px-1 text-xs font-mono uppercase tracking-widest text-muted-foreground">
                SELECT TRACK
              </p>
              <div className="h-full overflow-y-auto pr-1">
                <div className="flex flex-col gap-2.5">
                  {SONGS.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      selected={song.id === selectedId}
                      onClick={() => setSelectedId(song.id)}
                    />
                  ))}
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-border/70 bg-[#0F1628]/80 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Now Selected</p>
              <h2
                className="mt-1 text-2xl font-black leading-tight sm:text-3xl"
                style={{ color: selectedSong.coverColor }}
              >
                {selectedSong.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{selectedSong.artist}</p>

              <div className="mt-5 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="rounded-xl border border-border bg-[#0B1020] p-3">
                  <p className="text-muted-foreground">BPM</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{selectedSong.bpm}</p>
                </div>
                <div className="rounded-xl border border-border bg-[#0B1020] p-3">
                  <p className="text-muted-foreground">TIME</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {selectedSong.isDebug ? 'LIVE' : formatDuration(selectedSong.duration)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-[#0B1020] p-3">
                  <p className="text-muted-foreground">DIFF</p>
                  <p className="mt-1 text-lg font-bold text-foreground">{selectedSong.difficulty}</p>
                </div>
                <div className="rounded-xl border border-border bg-[#0B1020] p-3">
                  <p className="text-muted-foreground">RATING</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {selectedSong.isDebug ? '-' : selectedSong.difficultyRating}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border bg-[#0B1020] p-3">
                <p className="text-xs font-mono text-muted-foreground">BEST SCORE</p>
                <p className="mt-1 font-mono text-xl font-black tracking-wider text-cyan-300">
                  {formatBest(selectedSong.highScore)}
                </p>
              </div>

              <div className="mt-5">
                <button
                  onClick={() => onStartSong(selectedSong)}
                  disabled={!settingsReady}
                  className="w-full rounded-xl px-8 py-3 font-mono text-sm font-black uppercase tracking-[0.2em] transition-all duration-150 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(90deg, #42E8E0 0%, #56f3c4 100%)',
                    color: '#081223',
                    boxShadow: '0 0 20px rgba(66,232,224,0.45)',
                    opacity: settingsReady ? 1 : 0.6,
                    cursor: settingsReady ? 'pointer' : 'wait',
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <Play size={16} />
                    START PLAY
                  </span>
                </button>
                <p className="mt-2 text-center text-[11px] font-mono text-muted-foreground">
                  Keyboard: S D F J K L / Touch input supported
                </p>
                {!settingsReady && (
                  <p className="mt-1 text-center text-[10px] font-mono text-amber-300">
                    設定を読み込み中...
                  </p>
                )}
              </div>
            </aside>
          </div>
        </main>
      </div>

      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onChange={onSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
