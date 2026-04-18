'use client'

import { useEffect, useRef, useState } from 'react'
import type { JudgementPopup, JudgementType } from '../types/game'
import { LANE_COLORS } from '../data/songs'

interface HitRing {
  id: string
  laneIndex: number
  color: string
  timestamp: number
}

interface HitEffectLayerProps {
  laneCount: number
  judgementPopups: JudgementPopup[]
  laneCount_forWidth?: number
}

const JUDGE_COLORS: Record<JudgementType, string> = {
  PERFECT: '#42E8E0',
  GREAT: '#7C6CFF',
  GOOD: '#A8E87F',
  BAD: '#FFAA44',
  MISS: '#FF5FA2',
}

const JUDGE_LABELS: Record<JudgementType, string> = {
  PERFECT: 'PERFECT',
  GREAT: 'GREAT',
  GOOD: 'GOOD',
  BAD: 'BAD',
  MISS: 'MISS',
}

export default function HitEffectLayer({ laneCount, judgementPopups }: HitEffectLayerProps) {
  const [rings, setRings] = useState<HitRing[]>([])
  const [popups, setPopups] = useState<JudgementPopup[]>([])
  const prevPopupsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    const newPopups = judgementPopups.filter((p) => !prevPopupsRef.current.has(p.id))
    if (newPopups.length === 0) return

    newPopups.forEach((p) => prevPopupsRef.current.add(p.id))

    // Add rings for non-miss judgements
    const newRings: HitRing[] = newPopups
      .filter((p) => p.type !== 'MISS')
      .map((p) => ({
        id: p.id,
        laneIndex: p.laneIndex,
        color: LANE_COLORS[p.laneIndex % LANE_COLORS.length],
        timestamp: p.timestamp,
      }))

    setRings((prev) => [...prev, ...newRings])
    setPopups((prev) => [...prev, ...newPopups])

    // Clean up rings after animation
    setTimeout(() => {
      setRings((prev) => prev.filter((r) => !newRings.find((nr) => nr.id === r.id)))
    }, 400)

    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => !newPopups.find((np) => np.id === p.id)))
    }, 600)
  }, [judgementPopups])

  const laneWidthPct = 100 / laneCount
  const judgeLineBottom = '15%'

  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {/* Hit rings on judgement line */}
      {rings.map((ring) => {
        const centerX = (ring.laneIndex + 0.5) * laneWidthPct
        return (
          <div
            key={ring.id}
            className="absolute"
            style={{
              left: `${centerX}%`,
              bottom: judgeLineBottom,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: `2px solid ${ring.color}`,
                boxShadow: `0 0 8px ${ring.color}`,
                animation: 'hitRing 300ms ease-out forwards',
              }}
            />
          </div>
        )
      })}

      {/* Judgement text popups */}
      {popups.map((popup) => {
        const centerX = (popup.laneIndex + 0.5) * laneWidthPct
        const color = JUDGE_COLORS[popup.type]
        return (
          <div
            key={popup.id}
            className="absolute font-mono font-black text-center"
            style={{
              left: `${centerX}%`,
              bottom: 'calc(15% + 20px)',
              transform: 'translateX(-50%)',
              color,
              fontSize: '14px',
              textShadow: `0 0 8px ${color}`,
              animation: 'judgePopUp 500ms ease-out forwards',
              whiteSpace: 'nowrap',
            }}
          >
            {JUDGE_LABELS[popup.type]}
          </div>
        )
      })}
    </div>
  )
}
