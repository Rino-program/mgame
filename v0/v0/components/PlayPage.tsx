'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { GameSettings, SongMeta } from '../types/game'
import { LANE_KEYCODES, LANE_KEYS } from '../data/songs'
import { useNoteEngine } from '../engine/useNoteEngine'
import GameHud from './GameHud'
import LaneGrid from './LaneGrid'
import TouchInputBar from './TouchInputBar'
import HitEffectLayer from './HitEffectLayer'
import PauseOverlay from './PauseOverlay'
import ResultModal from './ResultModal'
import ComboDisplay from './ComboDisplay'
import DebugBadge from './DebugBadge'

interface PlayPageProps {
  song: SongMeta
  settings: GameSettings
  onExit: () => void
  onRetry: () => void
}

export default function PlayPage({ song, settings, onExit, onRetry }: PlayPageProps) {
  const [paused, setPaused] = useState(false)
  const [ended, setEnded] = useState(false)
  const [showTouchInputBar, setShowTouchInputBar] = useState(settings.showTouchInputBar)
  const [pressedLanes, setPressedLanes] = useState<boolean[]>(Array(settings.laneCount).fill(false))
  const judgeLineRef = useRef<HTMLDivElement>(null)

  const running = !paused && !ended
  const [engineState, engineControls] = useNoteEngine(song, settings, running)

  const {
    noteRenderState,
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
  } = engineState

  const totalMs = song.isDebug ? 999999 : song.duration * 1000
  const laneViewportWidthPx = Math.max(settings.laneCount, 1) * 88

  useEffect(() => {
    setShowTouchInputBar(settings.showTouchInputBar)
  }, [settings.showTouchInputBar])

  // End detection
  useEffect(() => {
    if (!song.isDebug && elapsedMs > totalMs + 1000) {
      setEnded(true)
    }
  }, [elapsedMs, totalMs, song.isDebug])

  const exitToMenu = useCallback(
    (reason: string) => {
      engineControls.onExit(reason)
      onExit()
    },
    [engineControls, onExit],
  )

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const idx = LANE_KEYCODES.indexOf(e.code as (typeof LANE_KEYCODES)[number])
      if (idx !== -1 && running) {
        e.preventDefault()
        engineControls.onLaneInput(idx, 'keyboard', performance.now())
        setPressedLanes((prev) => {
          const next = [...prev]
          next[idx] = true
          return next
        })
      }
      if (e.code === 'Escape') {
        if (ended) return
        e.preventDefault()
        exitToMenu('escape-key')
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const idx = LANE_KEYCODES.indexOf(e.code as (typeof LANE_KEYCODES)[number])
      if (idx !== -1) {
        setPressedLanes((prev) => {
          const next = [...prev]
          next[idx] = false
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [running, ended, engineControls, exitToMenu])

  const handleLanePress = useCallback(
    (idx: number) => {
      engineControls.onLaneInput(idx, 'touch', performance.now())
      setPressedLanes((prev) => {
        const next = [...prev]
        next[idx] = true
        return next
      })
    },
    [engineControls],
  )

  const handleLaneRelease = useCallback((idx: number) => {
    setPressedLanes((prev) => {
      const next = [...prev]
      next[idx] = false
      return next
    })
  }, [])

  const keyLabels = Array.from({ length: settings.laneCount }, (_, i) => LANE_KEYS[i] ?? String(i + 1))

  return (
    <div
      className="flex flex-col h-screen w-screen overflow-hidden relative select-none"
      style={{
        background:
          'radial-gradient(70% 50% at 50% -20%, rgba(66,232,224,0.14), transparent 70%), radial-gradient(50% 40% at 100% 100%, rgba(255,95,162,0.12), transparent 75%), #0B1020',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* HUD */}
      <GameHud
        songTitle={song.title}
        elapsedMs={elapsedMs}
        totalMs={totalMs}
        scoreState={scoreState}
        comboState={comboState}
        isDebug={song.isDebug ?? false}
        onPause={() => {
          engineControls.onPause()
          setPaused(true)
        }}
      />

      {/* Lane area */}
      <div className="flex-1 relative overflow-hidden px-1 sm:px-2">
        <div
          className="mx-auto h-full relative"
          style={{ width: `min(100vw, ${laneViewportWidthPx}px)` }}
        >
          <LaneGrid
            laneCount={settings.laneCount}
            noteRenderState={noteRenderState}
            pressedLanes={pressedLanes}
            flashLanes={flashLanes}
            showKeyGuide={settings.keyGuide}
            keyLabels={keyLabels}
            displayOffsetMs={settings.displayOffsetMs}
            onLanePress={handleLanePress}
            onLaneRelease={handleLaneRelease}
            judgeLineRef={judgeLineRef}
          />

          {/* Combo display (centered, in lane area) */}
          <ComboDisplay
            combo={comboState.combo}
            milestone={comboState.milestone}
            top={song.isDebug ? '34%' : '25%'}
          />

          {/* Debug badge */}
          {song.isDebug && (
            <DebugBadge
              bpm={song.bpm}
              countdownPct={debugCountdownPct}
              timingOffsetMs={timingOffsetMs}
              rollingMeanMs={rollingMeanMs}
              suggestedOffsetMs={suggestedOffsetMs}
            />
          )}

          {/* Hit effect layer */}
          <HitEffectLayer
            laneCount={settings.laneCount}
            judgementPopups={judgementPopups}
          />

          {/* Pause overlay */}
          {paused && !ended && (
            <PauseOverlay
              songTitle={song.title}
              onResume={() => {
                engineControls.onResume()
                setPaused(false)
              }}
              onExit={() => exitToMenu('pause-overlay-exit')}
            />
          )}

          {/* Result modal */}
          {ended && (
            <ResultModal
              songTitle={song.title}
              scoreState={scoreState}
              comboState={comboState}
              isNewRecord={(scoreState.score > (song.highScore ?? 0))}
              onRetry={onRetry}
              onExit={() => exitToMenu('result-exit')}
            />
          )}

          {loadError && (
            <div
              className="absolute inset-0 z-[60] flex items-center justify-center px-4"
              style={{ background: 'rgba(11,16,32,0.96)' }}
            >
              <div
                className="w-full max-w-sm rounded-xl border p-5"
                style={{ background: '#111828', borderColor: '#FF5FA2' }}
              >
                <p className="font-mono text-xs tracking-widest mb-2" style={{ color: '#FF5FA2' }}>
                  LOAD FAILED
                </p>
                <p className="text-sm text-foreground mb-4">{loadError}</p>
                <button
                  onClick={() => exitToMenu('load-failed')}
                  className="w-full py-2 rounded-lg font-mono font-bold text-xs tracking-widest uppercase"
                  style={{ background: '#42E8E0', color: '#0B1020' }}
                >
                  BACK TO SELECT
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowTouchInputBar((prev) => !prev)}
          className="absolute right-3 z-[45] px-3 py-1.5 rounded-md border font-mono text-[10px] tracking-widest uppercase"
          style={{
            bottom: showTouchInputBar ? '92px' : '10px',
            borderColor: '#1D2A44',
            color: '#42E8E0',
            background: 'rgba(11,16,32,0.72)',
          }}
        >
          {showTouchInputBar ? '下部を隠す' : '下部を表示'}
        </button>
      </div>

      {/* Touch input bar */}
      {showTouchInputBar && (
        <TouchInputBar
          laneCount={settings.laneCount}
          laneViewportWidthPx={laneViewportWidthPx}
          pressedLanes={pressedLanes}
          keyLabels={keyLabels}
          onLanePress={handleLanePress}
          onLaneRelease={handleLaneRelease}
        />
      )}
    </div>
  )
}
