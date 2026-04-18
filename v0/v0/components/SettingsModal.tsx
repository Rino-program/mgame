'use client'

import { X } from 'lucide-react'
import type { GameSettings } from '../types/game'

interface SettingsModalProps {
  open: boolean
  settings: GameSettings
  onChange: (settings: GameSettings) => void
  onClose: () => void
}

const TOGGLE_SETTINGS: Array<{ key: keyof GameSettings; label: string }> = [
  { key: 'showJudgement', label: '判定表示' },
  { key: 'laneHitEffect', label: 'レーンヒットエフェクト' },
  { key: 'screenShake', label: '画面揺れ（デフォルトOFF）' },
  { key: 'keyGuide', label: 'キーガイド表示' },
  { key: 'showTouchInputBar', label: '下部入力バー表示' },
]

export default function SettingsModal({ open, settings, onChange, onClose }: SettingsModalProps) {
  if (!open) return null

  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center py-4"
      style={{ background: 'rgba(11,16,32,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md mx-4 rounded-xl border p-5 sm:p-6 flex flex-col gap-5 sm:gap-6 max-h-[90vh] overflow-y-auto"
        style={{
          background: '#111828',
          borderColor: '#1D2A44',
          boxShadow: '0 0 40px rgba(66,232,224,0.12)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-widest text-primary text-glow-cyan font-mono uppercase">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Lane Count */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            レーン数
          </label>
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl text-primary font-bold">{settings.laneCount}</span>
            <span className="text-xs text-muted-foreground">(初期6、将来拡張予定)</span>
          </div>
        </div>

        {/* Note Speed */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            ノーツスピード
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={settings.noteSpeed}
              onChange={(e) => update('noteSpeed', Number(e.target.value))}
              className="flex-1 accent-primary"
              style={{ accentColor: '#42E8E0' }}
            />
            <span className="font-mono text-primary font-bold w-6 text-right">{settings.noteSpeed}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>SLOW</span>
            <span>FAST</span>
          </div>
        </div>

        {/* Toggle settings */}
        <div className="flex flex-col gap-3">
          {TOGGLE_SETTINGS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground pr-3 leading-snug">{label}</span>
              <button
                onClick={() => update(key, !settings[key] as GameSettings[typeof key])}
                className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none"
                style={{
                  background: settings[key] ? '#42E8E0' : '#1D2A44',
                  boxShadow: settings[key] ? '0 0 8px rgba(66,232,224,0.5)' : 'none',
                }}
                aria-checked={!!settings[key]}
                role="switch"
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-background transition-transform duration-200"
                  style={{
                    transform: settings[key] ? 'translateX(26px)' : 'translateX(4px)',
                  }}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Timing Offset */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            判定タイミング調整 ({settings.timingOffsetMs > 0 ? '+' : ''}{settings.timingOffsetMs}ms)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-500}
              max={500}
              step={1}
              value={settings.timingOffsetMs}
              onChange={(e) => update('timingOffsetMs', Number(e.target.value))}
              className="flex-1 accent-primary"
              style={{ accentColor: '#7C6CFF' }}
            />
            <span className="font-mono text-primary font-bold w-10 text-right">
              {settings.timingOffsetMs > 0 ? '+' : ''}
              {settings.timingOffsetMs}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground font-mono leading-snug sm:grid-cols-2">
            <span>-500ms: 早判定寄り（先に判定）</span>
            <span className="sm:text-right">+500ms: 遅判定寄り（後に判定）</span>
          </div>
        </div>

        {/* Display Offset */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-mono text-muted-foreground tracking-widest uppercase">
            表示タイミング調整 ({settings.displayOffsetMs > 0 ? '+' : ''}{settings.displayOffsetMs}ms)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={-100}
              max={100}
              step={1}
              value={settings.displayOffsetMs}
              onChange={(e) => update('displayOffsetMs', Number(e.target.value))}
              className="flex-1 accent-primary"
              style={{ accentColor: '#FFA500' }}
            />
            <span className="font-mono text-primary font-bold w-10 text-right">
              {settings.displayOffsetMs > 0 ? '+' : ''}
              {settings.displayOffsetMs}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1 text-[11px] text-muted-foreground font-mono leading-snug sm:grid-cols-2">
            <span>-100ms: 遅く表示（ノーツは下側）</span>
            <span className="sm:text-right">+100ms: 早く表示（ノーツは上側）</span>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-2 py-2.5 rounded-lg font-mono text-sm font-bold tracking-widest uppercase text-primary-foreground transition-all duration-150"
          style={{
            background: '#42E8E0',
            boxShadow: '0 0 12px rgba(66,232,224,0.4)',
          }}
        >
          APPLY
        </button>
      </div>
    </div>
  )
}
