'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import type { NoteRenderState } from '../types/game'
import { LANE_COLORS } from '../data/songs'

interface LaneGridProps {
  laneCount: number
  noteRenderState: NoteRenderState
  pressedLanes: boolean[]
  flashLanes: number[]
  showKeyGuide: boolean
  keyLabels: string[]
  displayOffsetMs?: number
  onLanePress: (laneIndex: number) => void
  onLaneRelease: (laneIndex: number) => void
  judgeLineRef?: React.RefObject<HTMLDivElement | null>
}

export default function LaneGrid({
  laneCount,
  noteRenderState,
  pressedLanes,
  flashLanes,
  showKeyGuide,
  keyLabels,
  displayOffsetMs = 0,
  onLanePress,
  onLaneRelease,
  judgeLineRef,
}: LaneGridProps) {
  return (
    <div
      className="w-full h-full relative flex overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(13,20,36,0.95) 0%, rgba(9,14,28,0.98) 100%)',
      }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-5"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.05) 2px, rgba(255,255,255,0.05) 4px)',
        }}
      />

      {/* Lanes */}
      {Array.from({ length: laneCount }).map((_, i) => {
        const laneColor = LANE_COLORS[i % LANE_COLORS.length]
        const isCenter = i === Math.floor(laneCount / 2) - 1 || i === Math.floor(laneCount / 2)
        const isFlashing = flashLanes.includes(i)
        const isPressed = pressedLanes[i]

        return (
          <div
            key={i}
            className="relative flex-1 flex flex-col overflow-hidden"
            style={{
              borderRight: i < laneCount - 1 ? `1px solid #1D2A44` : 'none',
              background: `linear-gradient(180deg, rgba(${hexToRgb(laneColor)}, 0.02), rgba(0,0,0,0))`,
              boxShadow: isCenter
                ? 'inset 0 0 20px rgba(255,255,255,0.02)'
                : 'none',
            }}
          >
            {/* Lane flash overlay on press */}
            {(isFlashing || isPressed) && (
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${laneColor}22)`,
                  animation: isFlashing ? 'laneFlash 200ms ease-out forwards' : 'none',
                  opacity: isPressed ? 0.3 : undefined,
                }}
              />
            )}

            {/* Notes */}
            {noteRenderState.notes
              .filter((n) => n.laneIndex === i)
              .map((note) => {
                const top = `${note.yPercent}%`
                return (
                  <div
                    key={note.id}
                    className="absolute left-1 right-1 z-30"
                    style={{
                      top,
                      transform: note.type === 'normal' ? 'translateY(-50%)' : undefined,
                      height: note.type === 'long' && note.longHeightPercent
                        ? `${note.longHeightPercent}%`
                        : '12px',
                    }}
                  >
                    {/* Note body */}
                    <div
                      className="w-full rounded-md relative"
                      style={{
                        height: note.type === 'long' && note.longHeightPercent ? '100%' : '12px',
                        background:
                          note.type === 'long'
                            ? `linear-gradient(to bottom, ${laneColor}cc, ${laneColor}44)`
                            : laneColor,
                        boxShadow:
                          note.yPercent > 75
                            ? `0 0 10px ${laneColor}, 0 0 20px ${laneColor}88`
                            : `0 0 4px ${laneColor}88`,
                        opacity: note.hit ? 0 : 1,
                        transition: 'opacity 50ms',
                      }}
                    />
                  </div>
                )
              })}

            {/* Lane divider glow */}
            {i < laneCount - 1 && (
              <div
                className="absolute right-0 top-0 bottom-0 w-px opacity-20"
                style={{ boxShadow: `0 0 4px ${laneColor}` }}
              />
            )}
          </div>
        )
      })}

      {/* Judgement line */}
      <div
        ref={judgeLineRef}
        className="absolute left-0 right-0 z-40 pointer-events-none"
        style={{
          bottom: '15%',
          height: '3px',
          background: 'linear-gradient(90deg, #42E8E0, #7C6CFF, #FF5FA2, #7C6CFF, #42E8E0)',
          boxShadow: '0 0 8px #42E8E0, 0 0 20px rgba(66,232,224,0.4)',
          animation: 'linePulse 1s ease-in-out infinite',
        }}
      />

      {/* Key guide (above judgement line) */}
      {showKeyGuide && (
        <div
          className="absolute left-0 right-0 z-30 flex pointer-events-none"
          style={{ bottom: 'calc(15% + 8px)' }}
        >
          {Array.from({ length: laneCount }).map((_, i) => (
            <div key={i} className="flex-1 flex justify-center">
              <span
                className="font-mono text-xs font-bold px-1.5 py-0.5 rounded"
                style={{
                  color: LANE_COLORS[i % LANE_COLORS.length],
                  background: `${LANE_COLORS[i % LANE_COLORS.length]}22`,
                  border: `1px solid ${LANE_COLORS[i % LANE_COLORS.length]}44`,
                  fontSize: '10px',
                }}
              >
                {keyLabels[i] === 'Space' ? 'SPC' : keyLabels[i]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '66, 232, 224'
}
