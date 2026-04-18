'use client'

import { LANE_COLORS } from '../data/songs'

interface TouchInputBarProps {
  laneCount: number
  laneViewportWidthPx?: number
  pressedLanes: boolean[]
  keyLabels: string[]
  onLanePress: (index: number) => void
  onLaneRelease: (index: number) => void
}

export default function TouchInputBar({
  laneCount,
  laneViewportWidthPx,
  pressedLanes,
  keyLabels,
  onLanePress,
  onLaneRelease,
}: TouchInputBarProps) {
  const maxSquarePx = 88
  const controlWidthPx = laneViewportWidthPx ?? (Math.max(laneCount, 1) * maxSquarePx)

  return (
    <div
      className="flex-shrink-0 w-full"
      style={{
        background: '#0B1020',
        borderTop: '1px solid #1D2A44',
      }}
    >
      <div
        className="mx-auto grid w-full"
        style={{
          width: `min(100vw, ${controlWidthPx}px)`,
          gridTemplateColumns: `repeat(${laneCount}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: laneCount }).map((_, i) => {
          const color = LANE_COLORS[i % LANE_COLORS.length]
          const pressed = pressedLanes[i]
          const label = keyLabels[i] === 'Space' ? 'SPC' : keyLabels[i]

          return (
            <button
              key={i}
              className="aspect-square flex flex-col items-center justify-center gap-1 select-none focus:outline-none active:outline-none"
              style={{
                background: pressed ? `${color}22` : 'transparent',
                borderRight: i < laneCount - 1 ? '1px solid #1D2A44' : 'none',
                boxShadow: pressed ? `inset 0 0 20px ${color}33` : 'none',
              }}
              onPointerDown={(e) => {
                e.preventDefault()
                onLanePress(i)
              }}
              onPointerUp={(e) => {
                e.preventDefault()
                onLaneRelease(i)
              }}
              onPointerLeave={(e) => {
                e.preventDefault()
                onLaneRelease(i)
              }}
              onPointerCancel={(e) => {
                e.preventDefault()
                onLaneRelease(i)
              }}
              aria-label={`Lane ${i + 1}`}
            >
              {/* Visual indicator bar */}
              <div
                className="w-8 h-1 rounded-full"
                style={{
                  background: color,
                  opacity: pressed ? 1 : 0.3,
                  boxShadow: pressed ? `0 0 8px ${color}` : 'none',
                  transform: pressed ? 'scaleX(1.2)' : 'scaleX(1)',
                }}
              />
              {/* Key label */}
              <span
                className="font-mono font-bold"
                style={{
                  color: pressed ? color : `${color}66`,
                  fontSize: '11px',
                  textShadow: pressed ? `0 0 6px ${color}` : 'none',
                }}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
