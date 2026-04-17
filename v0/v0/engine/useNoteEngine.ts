'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  NoteRenderState,
  ScoreState,
  ComboState,
  JudgementPopup,
  GameSettings,
  SongMeta,
} from '../types/game'
import { RhythmEngineController } from '../integration/rhythmEngineController'

// ============================================================
// Hook
// ============================================================
export interface NoteEngineState {
  noteRenderState: NoteRenderState
  scoreState: ScoreState
  comboState: ComboState
  judgementPopups: JudgementPopup[]
  elapsedMs: number
  timingOffsetMs?: number
  rollingMeanMs?: number
  suggestedOffsetMs?: number
  loadError?: string
  flashLanes: number[]
  debugCountdownPct: number
}

export interface NoteEngineControls {
  onLaneInput: (laneIndex: number, inputType: 'keyboard' | 'touch', timestamp: number) => void
  onPause: () => void
  onResume: () => void
  onExit: (reason: string) => void
}

export function useNoteEngine(
  song: SongMeta | null,
  settings: GameSettings,
  running: boolean,
): [NoteEngineState, NoteEngineControls] {
  const controllerRef = useRef<RhythmEngineController | null>(null)
  const rafRef = useRef<number>(0)
  const popupIdRef = useRef(0)

  const [renderState, setRenderState] = useState<NoteRenderState>({ notes: [] })
  const [scoreState, setScoreState] = useState<ScoreState>({
    score: 0,
    judgements: { PERFECT: 0, GREAT: 0, GOOD: 0, BAD: 0, MISS: 0 },
  })
  const [comboState, setComboState] = useState<ComboState>({ combo: 0, maxCombo: 0 })
  const [judgementPopups, setJudgementPopups] = useState<JudgementPopup[]>([])
  const [elapsedMs, setElapsedMs] = useState(0)
  const [timingOffsetMs, setTimingOffsetMs] = useState<number | undefined>(undefined)
  const [rollingMeanMs, setRollingMeanMs] = useState<number | undefined>(undefined)
  const [suggestedOffsetMs, setSuggestedOffsetMs] = useState<number | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | undefined>(undefined)
  const [flashLanes, setFlashLanes] = useState<number[]>([])
  const [debugCountdownPct, setDebugCountdownPct] = useState(0)

  // Reset on song change
  useEffect(() => {
    controllerRef.current?.stop('song-change')
    controllerRef.current = null

    if (!song) {
      setLoadError(undefined)
      return
    }

    try {
      const controller = new RhythmEngineController(song, settings)
      controller.start()
      controllerRef.current = controller
      setLoadError(undefined)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown loading error'
      setLoadError(message)
    }

    setRenderState({ notes: [] })
    setScoreState({ score: 0, judgements: { PERFECT: 0, GREAT: 0, GOOD: 0, BAD: 0, MISS: 0 } })
    setComboState({ combo: 0, maxCombo: 0 })
    setJudgementPopups([])
    setElapsedMs(0)
    setTimingOffsetMs(undefined)
    setRollingMeanMs(undefined)
    setSuggestedOffsetMs(undefined)
    setFlashLanes([])
    setDebugCountdownPct(0)

    return () => {
      controllerRef.current?.stop('cleanup')
      controllerRef.current = null
    }
  }, [song, settings.laneCount])

  // Main game loop
  useEffect(() => {
    if (!song || !controllerRef.current) return

    const loop = () => {
      const frame = controllerRef.current?.getFrame()
      if (!frame) return

      setRenderState(frame.renderNotes)
      setScoreState({
        score: frame.hud.score,
        judgements: frame.hud.judgements,
      })
      setComboState((prev) => {
        const nextCombo = frame.hud.combo
        const maxCombo = Math.max(prev.maxCombo, nextCombo)
        const milestone = [100, 50, 25, 10].find((m) => nextCombo === m)
        return { combo: nextCombo, maxCombo, milestone }
      })
      setElapsedMs(frame.hud.elapsedMs)
      setDebugCountdownPct(frame.debug.beatCountdownPct)
      setTimingOffsetMs(frame.debug.timingOffsetMs)
      setRollingMeanMs(frame.debug.rollingMeanMs)
      setSuggestedOffsetMs(frame.debug.suggestedOffsetMs)

      if (typeof frame.effects.hitFlashLane === 'number') {
        setFlashLanes((prev) => [...prev, frame.effects.hitFlashLane as number])
        setTimeout(() => {
          setFlashLanes((prev) => prev.filter((lane) => lane !== frame.effects.hitFlashLane))
        }, 200)
      }

      if (frame.effects.judgeText && settings.showJudgement) {
        const popup: JudgementPopup = {
          id: `popup-${popupIdRef.current++}`,
          laneIndex: frame.effects.hitFlashLane ?? 0,
          type: frame.effects.judgeText,
          timestamp: frame.hud.elapsedMs,
        }
        setJudgementPopups((prev) => [...prev.slice(-20), popup])
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [song, settings.showJudgement])

  useEffect(() => {
    if (!controllerRef.current) return
    if (running) {
      controllerRef.current.resume()
    } else {
      controllerRef.current.pause()
    }
  }, [running])

  const onLaneInput = useCallback(
    (laneIndex: number, inputType: 'keyboard' | 'touch', timestamp: number) => {
      if (!running) return
      controllerRef.current?.onLaneInput(laneIndex, inputType, timestamp)

      if (settings.laneHitEffect) {
        setFlashLanes((prev) => [...prev, laneIndex])
        setTimeout(() => {
          setFlashLanes((prev) => prev.filter((lane) => lane !== laneIndex))
        }, 200)
      }
    },
    [running, settings.laneHitEffect],
  )

  const onPause = useCallback(() => {
    controllerRef.current?.pause()
  }, [])

  const onResume = useCallback(() => {
    controllerRef.current?.resume()
  }, [])

  const onExit = useCallback((reason: string) => {
    controllerRef.current?.stop(reason)
  }, [])

  return [
    {
      noteRenderState: renderState,
      scoreState,
      comboState,
      judgementPopups,
      elapsedMs,
      timingOffsetMs,
      rollingMeanMs,
      suggestedOffsetMs,
      loadError,
      flashLanes,
      debugCountdownPct,
    },
    { onLaneInput, onPause, onResume, onExit },
  ]
}
