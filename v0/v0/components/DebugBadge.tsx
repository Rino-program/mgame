'use client'

interface DebugBadgeProps {
  bpm: number
  countdownPct: number // 0–1, fills up to next beat
  timingOffsetMs?: number
  rollingMeanMs?: number
  suggestedOffsetMs?: number
}

function formatOffset(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return '--'
  return `${value > 0 ? '+' : ''}${value}ms`
}

export default function DebugBadge({
  bpm,
  countdownPct,
  timingOffsetMs,
  rollingMeanMs,
  suggestedOffsetMs,
}: DebugBadgeProps) {
  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2 pointer-events-none"
    >
      {/* Badge */}
      <div
        className="px-3 py-1 rounded-full font-mono text-xs font-bold tracking-widest"
        style={{
          background: 'rgba(255,170,68,0.15)',
          border: '1px solid #FFAA44',
          color: '#FFAA44',
        }}
      >
        DEBUG MODE · {bpm} BPM
      </div>

      {/* Countdown bar */}
      <div
        className="w-32 h-1.5 rounded-full overflow-hidden"
        style={{ background: '#1D2A44' }}
      >
        <div
          className="h-full rounded-full transition-none"
          style={{
            width: `${countdownPct * 100}%`,
            background: '#FFAA44',
            boxShadow: '0 0 6px #FFAA44',
          }}
        />
      </div>

      {/* Timing offset display */}
      <div
        className="px-3 py-1 rounded font-mono text-[11px] font-bold"
        style={{
          background: '#0B1020',
          border: '1px solid #1D2A44',
          color: '#D6E2FF',
        }}
      >
        <div>Now Offset: {formatOffset(timingOffsetMs)}</div>
        <div>Avg(20): {formatOffset(rollingMeanMs)}</div>
        <div>Suggest Offset: {formatOffset(suggestedOffsetMs)}</div>
      </div>
    </div>
  )
}
