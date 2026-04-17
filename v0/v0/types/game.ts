// ============================================================
// Game Types — shared between UI (v0) and Engine (Copilot)
// ============================================================

export type GameState = 'idle' | 'loading' | 'ready' | 'playing' | 'paused' | 'ended'

export type JudgementType = 'PERFECT' | 'GREAT' | 'GOOD' | 'BAD' | 'MISS'

export interface SongMeta {
  id: string
  title: string
  artist: string
  bpm: number
  duration: number // seconds
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXPERT'
  difficultyRating: number // 1-15
  coverColor: string // accent color for card
  highScore?: number
  isDebug?: boolean
}

export interface Note {
  id: string
  laneIndex: number
  hitTime: number // ms from song start when note should be hit
  type: 'normal' | 'long'
  longDuration?: number // ms (for long notes)
}

export interface NoteRenderState {
  notes: Array<{
    id: string
    laneIndex: number
    yPercent: number // 0=top, 100=judgement line
    type: 'normal' | 'long'
    longHeightPercent?: number
    hit?: boolean
  }>
}

export interface ScoreState {
  score: number
  judgements: Record<JudgementType, number>
}

export interface ComboState {
  combo: number
  maxCombo: number
  milestone?: number // 10, 25, 50, 100
}

export interface JudgementPopup {
  id: string
  laneIndex: number
  type: JudgementType
  timestamp: number
}

export interface GameSettings {
  laneCount: number
  noteSpeed: number // 1–10
  showJudgement: boolean
  laneHitEffect: boolean
  screenShake: boolean
  keyGuide: boolean
  timingOffsetMs: number // -500 to +500 (affects judgment timing)
  displayOffsetMs: number // -100 to +100 (affects visual position only)
}

// ============================================================
// UI → Engine interface (callbacks v0 exposes)
// ============================================================
export interface GameEngineCallbacks {
  onLaneInput: (laneIndex: number, inputType: 'keyboard' | 'touch', timestamp: number) => void
  onPause: () => void
  onResume: () => void
  onExit: () => void
  onStartSong: (songId: string) => void
}

// ============================================================
// Engine → UI state (provided by engine, consumed by v0)
// ============================================================
export interface EngineState {
  notesRenderState: NoteRenderState
  scoreState: ScoreState
  comboState: ComboState
  judgementPopups: JudgementPopup[]
  timingOffsetMs?: number
  gameState: GameState
  elapsedMs: number
  totalMs: number
}
