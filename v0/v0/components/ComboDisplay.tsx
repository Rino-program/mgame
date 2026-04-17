'use client'

import { useEffect, useRef, useState } from 'react'

interface ComboDisplayProps {
  combo: number
  milestone?: number
}

export default function ComboDisplay({ combo, milestone }: ComboDisplayProps) {
  const [animate, setAnimate] = useState(false)
  const prevCombo = useRef(combo)

  useEffect(() => {
    if (combo !== prevCombo.current) {
      prevCombo.current = combo
      if (combo > 0) {
        setAnimate(true)
        const t = setTimeout(() => setAnimate(false), 300)
        return () => clearTimeout(t)
      }
    }
  }, [combo])

  if (combo < 3) return null

  const isMilestone = milestone !== undefined && combo === milestone
  const size = isMilestone ? 'text-5xl' : combo >= 100 ? 'text-4xl' : 'text-3xl'

  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none"
      style={{ top: '25%' }}
    >
      <span
        className={`font-mono font-black tabular-nums leading-none ${size}`}
        style={{
          color: isMilestone ? '#42E8E0' : combo >= 100 ? '#7C6CFF' : '#E8EEFF',
          textShadow: isMilestone
            ? '0 0 20px #42E8E0, 0 0 40px rgba(66,232,224,0.5)'
            : combo >= 100
            ? '0 0 12px #7C6CFF'
            : 'none',
          animation: animate
            ? isMilestone
              ? 'comboPulse 300ms ease-out'
              : 'comboPulse 200ms ease-out'
            : 'none',
          transition: 'opacity 200ms',
        }}
      >
        {combo}
      </span>
      <span
        className="font-mono text-xs tracking-widest mt-1"
        style={{
          color: isMilestone ? '#42E8E0' : '#7A8BB0',
          textShadow: isMilestone ? '0 0 8px #42E8E0' : 'none',
        }}
      >
        COMBO
      </span>
    </div>
  )
}
