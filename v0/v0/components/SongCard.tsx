'use client'

import type { SongMeta } from '../types/game'
import { DIFFICULTY_COLORS } from '../data/songs'
import { Bug, Music } from 'lucide-react'

interface SongCardProps {
  song: SongMeta
  selected: boolean
  onClick: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatScore(score: number): string {
  return score.toLocaleString('en-US', { minimumIntegerDigits: 7, useGrouping: false }).padStart(7, '0')
}

export default function SongCard({ song, selected, onClick }: SongCardProps) {
  const diffColor = DIFFICULTY_COLORS[song.difficulty]

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border transition-all duration-200 focus:outline-none"
      style={{
        background: selected ? `linear-gradient(120deg, rgba(${hexToRgb(song.coverColor)}, 0.16), rgba(17,24,40,0.95))` : '#111828',
        borderColor: selected ? song.coverColor : '#233050',
        boxShadow: selected
          ? `0 0 0 1px ${song.coverColor}, 0 12px 28px rgba(${hexToRgb(song.coverColor)}, 0.24)`
          : '0 6px 16px rgba(0,0,0,0.18)',
        transform: selected ? 'translateY(-1px)' : 'translateY(0)',
      }}
    >
      <div className="flex items-stretch gap-4 p-4">
        {/* Cover art swatch */}
        <div
          className="flex-shrink-0 w-16 h-16 rounded-lg flex items-center justify-center text-background"
          style={{
            background: `linear-gradient(135deg, ${song.coverColor}33, ${song.coverColor}88)`,
            border: `1px solid ${song.coverColor}55`,
            boxShadow: selected ? `0 0 12px ${song.coverColor}66` : 'none',
          }}
        >
          {song.isDebug ? (
            <Bug size={28} style={{ color: song.coverColor }} />
          ) : (
            <Music size={28} style={{ color: song.coverColor }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className="font-bold text-sm truncate leading-tight"
                style={{ color: selected ? song.coverColor : '#E8EEFF' }}
              >
                {song.title}
              </p>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{song.artist}</p>
            </div>
            {!song.isDebug && (
              <span
                className="flex-shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: diffColor,
                  background: `${diffColor}22`,
                  border: `1px solid ${diffColor}55`,
                }}
              >
                {song.difficulty}
              </span>
            )}
            {song.isDebug && (
              <span className="flex-shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                DEBUG
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2">
            {/* BPM */}
            <div className="flex items-baseline gap-1">
              <span
                className="font-mono font-bold text-sm"
                style={{ color: selected ? song.coverColor : '#E8EEFF' }}
              >
                {song.bpm}
              </span>
              <span className="text-xs text-muted-foreground font-mono">BPM</span>
            </div>

            {/* Duration */}
            {!song.isDebug && (
              <span className="text-xs text-muted-foreground font-mono">
                {formatDuration(song.duration)}
              </span>
            )}

            {/* Difficulty stars */}
            {!song.isDebug && (
              <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(song.difficultyRating, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: diffColor, opacity: 0.8 + i * 0.02 }}
                  />
                ))}
                {song.difficultyRating > 10 && (
                  <span className="text-xs font-mono ml-1" style={{ color: diffColor }}>
                    +{song.difficultyRating - 10}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* High score */}
        {!song.isDebug && (
          <div className="flex-shrink-0 flex flex-col items-end justify-end">
            <span className="text-[10px] tracking-widest text-muted-foreground font-mono">BEST</span>
            <span
              className="font-mono text-sm font-bold tabular-nums"
              style={{ color: song.highScore && song.highScore > 0 ? '#E8EEFF' : '#3A4A6A' }}
            >
              {song.highScore ? formatScore(song.highScore) : '-------'}
            </span>
          </div>
        )}
      </div>
    </button>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '66, 232, 224'
}
