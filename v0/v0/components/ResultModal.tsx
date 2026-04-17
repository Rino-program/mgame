'use client'

import type { ScoreState, ComboState, JudgementType } from '../types/game'

interface ResultModalProps {
  songTitle: string
  scoreState: ScoreState
  comboState: ComboState
  isNewRecord: boolean
  onRetry: () => void
  onExit: () => void
}

const JUDGE_COLORS: Record<JudgementType, string> = {
  PERFECT: '#42E8E0',
  GREAT: '#7C6CFF',
  GOOD: '#A8E87F',
  BAD: '#FFAA44',
  MISS: '#FF5FA2',
}

function formatScore(score: number): string {
  return score.toString().padStart(7, '0')
}

function computeAccuracy(judgements: Record<JudgementType, number>): string {
  const weights: Record<JudgementType, number> = {
    PERFECT: 1.0,
    GREAT: 0.8,
    GOOD: 0.5,
    BAD: 0.2,
    MISS: 0,
  }
  const total = Object.values(judgements).reduce((a, b) => a + b, 0)
  if (total === 0) return '-.--'
  const earned = (Object.keys(judgements) as JudgementType[]).reduce(
    (sum, key) => sum + (judgements[key] ?? 0) * weights[key],
    0,
  )
  return `${((earned / total) * 100).toFixed(2)}%`
}

function getRank(score: number): { label: string; color: string } {
  if (score >= 990000) return { label: 'S+', color: '#42E8E0' }
  if (score >= 950000) return { label: 'S', color: '#42E8E0' }
  if (score >= 900000) return { label: 'A', color: '#7C6CFF' }
  if (score >= 800000) return { label: 'B', color: '#A8E87F' }
  if (score >= 700000) return { label: 'C', color: '#FFAA44' }
  return { label: 'D', color: '#FF5FA2' }
}

export default function ResultModal({
  songTitle,
  scoreState,
  comboState,
  isNewRecord,
  onRetry,
  onExit,
}: ResultModalProps) {
  const { score, judgements } = scoreState
  const rank = getRank(score)
  const accuracy = computeAccuracy(judgements)

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(11,16,32,0.95)', backdropFilter: 'blur(16px)' }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl border p-6 flex flex-col gap-5"
        style={{
          background: '#111828',
          borderColor: '#1D2A44',
          boxShadow: '0 0 60px rgba(66,232,224,0.1)',
        }}
      >
        {/* Header */}
        <div className="text-center">
          <p className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            RESULT
          </p>
          <h2 className="text-base font-bold text-foreground mt-1 truncate">{songTitle}</h2>
        </div>

        {/* Rank + Score */}
        <div className="flex items-center justify-between">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center font-mono font-black text-4xl border-2"
            style={{
              color: rank.color,
              borderColor: rank.color,
              boxShadow: `0 0 20px ${rank.color}66`,
              background: `${rank.color}11`,
            }}
          >
            {rank.label}
          </div>
          <div className="text-right">
            {isNewRecord && (
              <p className="text-xs font-mono font-bold mb-1" style={{ color: '#FFAA44' }}>
                NEW RECORD!
              </p>
            )}
            <p className="text-xs text-muted-foreground font-mono">SCORE</p>
            <p
              className="font-mono font-black text-2xl tabular-nums text-glow-cyan"
              style={{ color: '#42E8E0' }}
            >
              {formatScore(score)}
            </p>
            <p className="text-xs text-muted-foreground font-mono mt-1">
              ACC {accuracy} · MAX {comboState.maxCombo}x
            </p>
          </div>
        </div>

        {/* Judgement breakdown */}
        <div className="grid grid-cols-5 gap-1">
          {(Object.keys(JUDGE_COLORS) as JudgementType[]).map((type) => (
            <div
              key={type}
              className="flex flex-col items-center gap-1 py-2 rounded-lg"
              style={{ background: '#0B1020' }}
            >
              <span className="font-mono font-bold text-xs" style={{ color: JUDGE_COLORS[type] }}>
                {type.slice(0, 1)}
              </span>
              <span className="font-mono font-bold text-sm tabular-nums text-foreground">
                {judgements[type] ?? 0}
              </span>
              <span className="font-mono text-xs text-muted-foreground" style={{ fontSize: '9px' }}>
                {type}
              </span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onExit}
            className="flex-1 py-2.5 rounded-xl font-mono font-bold text-xs tracking-widest uppercase border transition-all active:scale-95"
            style={{
              borderColor: '#1D2A44',
              color: '#7A8BB0',
            }}
          >
            MENU
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-2.5 rounded-xl font-mono font-black text-xs tracking-widest uppercase transition-all active:scale-95"
            style={{
              background: '#42E8E0',
              color: '#0B1020',
              boxShadow: '0 0 12px rgba(66,232,224,0.4)',
            }}
          >
            RETRY
          </button>
        </div>
      </div>
    </div>
  )
}
