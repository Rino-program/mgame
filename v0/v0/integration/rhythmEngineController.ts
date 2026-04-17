import type { GameSettings, JudgementType, NoteRenderState, SongMeta } from '../types/game'
import rhythmEngineModule from '../engine/core/rhythmEngine.js'
import { createTimeBridge, type TimeBridge } from './timeBridge'

type EngineJudge = 'perfect' | 'great' | 'good' | 'bad' | 'miss'

interface RhythmEngineLike {
  loadChart: (chart: unknown) => void
  loadAudio: (buffer: unknown) => void
  start: (startAtMs?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  onInput: (ev: { lane: number; timestampMs: number; source: 'keyboard' | 'touch' }) => {
    noteId: number | string
    lane: number
    result: EngineJudge
    deltaMs: number
    source: string
    judgeTimeMs: number
  } | null
  getRenderState: (nowMs?: number) => {
    isRunning: boolean
    isPaused: boolean
    audioTimeMs: number
    visualLeadMs: number
    visibleNotes: Array<{
      id: number | string
      lane: number
      type: 'tap' | 'hold'
      judgeTimeMs: number
      deltaToHitMs: number
    }>
  }
  getScoreState: () => {
    score: number
    combo: number
    maxCombo: number
    counts: Record<EngineJudge, number>
  }
  getDebugState: () => {
    enabled: boolean
    samples: number[]
    timingStats: { mean: number }
    recommendedGlobalOffsetMs: number
  }
  setTimingOptions: (options: { visualLeadMs?: number }) => void
}

const { RhythmEngine, createDebugClickChart } = rhythmEngineModule as {
  RhythmEngine: new (options: {
    nowProvider: () => number
    debugEnabled: boolean
    visualLeadMs: number
  }) => RhythmEngineLike
  createDebugClickChart: (options: {
    songId: string
    bpm: number
    lanes: number
    startTimeMs: number
    endTimeMs: number
    laneMode: 'fixed'
    fixedLane: number
  }) => {
    songId: string
    bpm: number
    offsetMs: number
    lanes: number
    notes: Array<{ id: number; lane: number; timeMs: number; type: 'tap' }>
  }
}

export interface ControllerFrame {
  renderNotes: NoteRenderState
  hud: {
    score: number
    combo: number
    judgements: Record<JudgementType, number>
    elapsedMs: number
  }
  effects: {
    judgeText?: JudgementType
    hitFlashLane?: number
  }
  debug: {
    timingOffsetMs?: number
    rollingMeanMs?: number
    suggestedOffsetMs?: number
    beatCountdownPct: number
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function mapJudgeType(judge: EngineJudge): JudgementType {
  const map: Record<EngineJudge, JudgementType> = {
    perfect: 'PERFECT',
    great: 'GREAT',
    good: 'GOOD',
    bad: 'BAD',
    miss: 'MISS',
  }
  return map[judge]
}

function computeVisualLeadMs(noteSpeed: number): number {
  return 2000 - noteSpeed * 150
}

function createSeededRandom(seedText: string): () => number {
  let seed = 0
  for (let i = 0; i < seedText.length; i += 1) {
    seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

function buildChart(song: SongMeta, laneCount: number) {
  if (song.isDebug) {
    return createDebugClickChart({
      songId: song.id,
      bpm: song.bpm,
      lanes: laneCount,
      startTimeMs: 1000,
      endTimeMs: song.duration * 1000,
      laneMode: 'fixed',
      fixedLane: Math.floor(laneCount / 2),
    })
  }

  const density = { EASY: 0.4, NORMAL: 0.6, HARD: 0.8, EXPERT: 0.95 }[song.difficulty]
  const beatMs = (60 / song.bpm) * 1000
  const endBeat = Math.floor((song.duration * 1000) / beatMs) - 1
  const subdivisions = song.difficultyRating >= 10 ? [0, 0.5, 0.75] : song.difficultyRating >= 6 ? [0, 0.5] : [0]
  const random = createSeededRandom(song.id)

  let id = 1
  const notes: Array<{ id: number; lane: number; timeMs: number; type: 'tap' }> = []
  for (let beat = 4; beat <= endBeat; beat += 1) {
    for (const sub of subdivisions) {
      if (random() > density) continue
      notes.push({
        id,
        lane: Math.floor(random() * laneCount),
        timeMs: Math.round((beat + sub) * beatMs),
        type: 'tap',
      })
      id += 1
    }
  }

  return {
    songId: song.id,
    bpm: song.bpm,
    offsetMs: 0,
    lanes: laneCount,
    notes,
  }
}

export class RhythmEngineController {
  private readonly engine: RhythmEngineLike
  private readonly song: SongMeta
  private readonly timeBridge: TimeBridge
  private lastJudgeLane?: number
  private lastJudgeText?: JudgementType
  private lastTimingOffsetMs?: number

  constructor(song: SongMeta, settings: GameSettings) {
    this.song = song
    this.timeBridge = createTimeBridge()
    const visualLeadMs = computeVisualLeadMs(settings.noteSpeed)

    this.engine = new RhythmEngine({
      nowProvider: this.timeBridge.nowMs,
      debugEnabled: Boolean(song.isDebug),
      visualLeadMs,
    })

    console.log('[integration] song load start', { songId: song.id })
    this.engine.loadChart(buildChart(song, settings.laneCount))
    console.log('[integration] song load complete', { songId: song.id })

    // Audio source is not wired yet, but we keep logs required by integration spec.
    console.log('[integration] audio decode start', { songId: song.id })
    this.engine.loadAudio(null)
    console.log('[integration] audio decode complete', { songId: song.id })
  }

  start(): void {
    const startNow = this.timeBridge.nowMs()
    this.engine.start(0)
    console.log('[integration] engine start baseline', {
      songId: this.song.id,
      nowMs: Math.round(startNow),
    })
  }

  pause(): void {
    this.engine.pause()
  }

  resume(): void {
    this.engine.resume()
  }

  stop(reason: string): void {
    console.log('[integration] esc exit', { reason, songId: this.song.id })
    this.engine.stop()
  }

  onLaneInput(lane: number, source: 'keyboard' | 'touch', timestampMs: number): void {
    const judged = this.engine.onInput({ lane, source, timestampMs })
    if (!judged) return

    this.lastJudgeLane = judged.lane
    this.lastJudgeText = mapJudgeType(judged.result)
    this.lastTimingOffsetMs = Math.round(judged.deltaMs)

    console.log('[integration] input judgement', {
      lane,
      source,
      inputTsMs: Math.round(timestampMs),
      noteTsMs: Math.round(judged.judgeTimeMs),
      deltaMs: Math.round(judged.deltaMs),
    })
  }

  getFrame(): ControllerFrame {
    const render = this.engine.getRenderState(this.timeBridge.nowMs())
    const score = this.engine.getScoreState()
    const debug = this.engine.getDebugState()
    const beatMs = (60 / this.song.bpm) * 1000

    const renderNotes: NoteRenderState = {
      notes: render.visibleNotes.map((note) => ({
        id: String(note.id),
        laneIndex: note.lane,
        type: note.type === 'hold' ? 'long' : 'normal',
        yPercent: clamp(((render.visualLeadMs - note.deltaToHitMs) / render.visualLeadMs) * 85, 0, 88),
      })),
    }

    const frame: ControllerFrame = {
      renderNotes,
      hud: {
        score: score.score,
        combo: score.combo,
        elapsedMs: render.audioTimeMs,
        judgements: {
          PERFECT: score.counts.perfect,
          GREAT: score.counts.great,
          GOOD: score.counts.good,
          BAD: score.counts.bad,
          MISS: score.counts.miss,
        },
      },
      effects: {
        judgeText: this.lastJudgeText,
        hitFlashLane: this.lastJudgeLane,
      },
      debug: {
        timingOffsetMs: this.lastTimingOffsetMs,
        rollingMeanMs: Number.isFinite(debug.timingStats.mean) ? Math.round(debug.timingStats.mean) : undefined,
        suggestedOffsetMs: Number.isFinite(debug.recommendedGlobalOffsetMs)
          ? Math.round(debug.recommendedGlobalOffsetMs)
          : undefined,
        beatCountdownPct: (render.audioTimeMs % beatMs) / beatMs,
      },
    }

    this.lastJudgeLane = undefined
    this.lastJudgeText = undefined
    return frame
  }
}
