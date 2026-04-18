'use client'

import { Pause } from 'lucide-react'
import type { ScoreState, ComboState, JudgementType } from '../types/game'

interface GameHudProps {
  songTitle: string
  elapsedMs: number
  totalMs: number
  scoreState: ScoreState
  comboState: ComboState
  isDebug: boolean
  onPause: () => void
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function formatScore(score: number): string {
  return score.toString().padStart(7, '0')
}

const JUDGE_COLORS: Record<JudgementType, string> = {
  PERFECT: '#42E8E0',
  GREAT: '#7C6CFF',
  GOOD: '#A8E87F',
  BAD: '#FFAA44',
  MISS: '#FF5FA2',
}

export default function GameHud({
  songTitle,
  elapsedMs,
  totalMs,
  scoreState,
  comboState,
  isDebug,
  onPause,
}: GameHudProps) {
  const progressPct = totalMs > 0 ? Math.min((elapsedMs / totalMs) * 100, 100) : 0
  const { judgements } = scoreState

  return (
    <div className="flex-shrink-0 w-full z-20 border-b border-border/80" style={{ background: 'transparent' }}>
      {/* Progress bar */}
      <div className="h-0.5 w-full bg-secondary">
        <div
          className="h-full transition-all duration-100"
          style={{
            width: `${progressPct}%`,
            background: '#42E8E0',
            boxShadow: '0 0 6px #42E8E0',
          }}
        />
      </div>

      {/* Main HUD row */}
      <div className="flex items-center gap-2 px-3 py-2 sm:px-4">
        {/* Pause button */}
        <button
          onClick={onPause}
          className="flex-shrink-0 p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          aria-label="Pause"
        >
          <Pause size={16} />
        </button>

        {/* Song name + time */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isDebug && (
              <span className="flex-shrink-0 text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                DEBUG
              </span>
            )}
            <span className="text-xs sm:text-sm font-bold truncate text-foreground">{songTitle}</span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="font-mono text-xs text-primary">{formatTime(elapsedMs)}</span>
            <span className="text-xs text-muted-foreground font-mono">/</span>
            <span className="font-mono text-xs text-muted-foreground">{formatTime(totalMs)}</span>
          </div>
        </div>

        {/* Score */}
        <div className="flex-shrink-0 text-right">
          <p className="text-xs text-muted-foreground font-mono">SCORE</p>
          <p
            className="font-mono font-black text-base sm:text-lg tabular-nums leading-tight text-glow-cyan"
            style={{ color: '#42E8E0', letterSpacing: '0.05em' }}
          >
            {formatScore(scoreState.score)}
          </p>
        </div>

        {/* Combo */}
        <div className="flex-shrink-0 text-right min-w-12">
          <p className="text-xs text-muted-foreground font-mono">COMBO</p>
          <p
            className="font-mono font-black text-base sm:text-lg tabular-nums leading-tight"
            style={{
              color: comboState.combo > 0 ? '#7C6CFF' : '#3A4A6A',
              textShadow: comboState.combo > 0 ? '0 0 8px #7C6CFF' : 'none',
            }}
          >
            {comboState.combo}
          </p>
        </div>
      </div>

      {/* Judgement breakdown */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-3 pb-2 sm:gap-2">
        {(Object.keys(JUDGE_COLORS) as JudgementType[]).map((type) => (
          <div key={type} className="flex items-center gap-1 rounded-md border border-border bg-[#0B1020] px-1.5 py-0.5">
            <span className="text-[10px] font-mono font-bold" style={{ color: JUDGE_COLORS[type] }}>
              {type}
            </span>
            <span className="font-mono text-[10px] tabular-nums text-foreground">
              {judgements[type] ?? 0}
            </span>
          </div>
        ))}
        <span className="ml-2 hidden text-[10px] font-mono text-muted-foreground sm:inline">ESC: EXIT</span>
      </div>
    </div>
  )
}
