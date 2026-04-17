'use client'

import { Play, LogOut } from 'lucide-react'

interface PauseOverlayProps {
  songTitle: string
  onResume: () => void
  onExit: () => void
}

export default function PauseOverlay({ songTitle, onResume, onExit }: PauseOverlayProps) {
  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ background: 'rgba(11,16,32,0.92)', backdropFilter: 'blur(12px)' }}
    >
      {/* Title */}
      <div className="text-center">
        <p className="font-mono text-xs text-muted-foreground tracking-widest uppercase mb-2">
          PAUSED
        </p>
        <h2
          className="text-2xl font-black tracking-wider text-glow-cyan"
          style={{ color: '#42E8E0' }}
        >
          {songTitle}
        </h2>
      </div>

      {/* Decorative line */}
      <div
        className="w-32 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #42E8E0, transparent)',
          boxShadow: '0 0 8px #42E8E0',
        }}
      />

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 w-48">
        <button
          onClick={onResume}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-black text-sm tracking-widest uppercase transition-all duration-150 active:scale-95"
          style={{
            background: '#42E8E0',
            color: '#0B1020',
            boxShadow: '0 0 16px rgba(66,232,224,0.5)',
          }}
        >
          <Play size={16} fill="#0B1020" />
          RESUME
        </button>

        <button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono font-bold text-sm tracking-widest uppercase border transition-all duration-150 active:scale-95"
          style={{
            border: '1px solid #FF5FA2',
            color: '#FF5FA2',
            background: 'rgba(255,95,162,0.08)',
          }}
        >
          <LogOut size={16} />
          EXIT TO MENU
        </button>
      </div>

      <p className="text-xs text-muted-foreground font-mono">Use RESUME to continue play</p>
    </div>
  )
}
