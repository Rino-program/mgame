import type { SongMeta } from '../types/game'

export const SONGS: SongMeta[] = [
  {
    id: 'neon-pulse',
    title: 'Neon Pulse',
    artist: 'CyberWave',
    bpm: 138,
    duration: 127,
    difficulty: 'NORMAL',
    difficultyRating: 7,
    coverColor: '#42E8E0',
    highScore: 987450,
  },
  {
    id: 'violet-storm',
    title: 'Violet Storm',
    artist: 'Phantasm.EXE',
    bpm: 175,
    duration: 112,
    difficulty: 'HARD',
    difficultyRating: 11,
    coverColor: '#7C6CFF',
    highScore: 832100,
  },
  {
    id: 'sakura-data',
    title: 'Sakura Data',
    artist: 'Hana × Logic',
    bpm: 122,
    duration: 143,
    difficulty: 'EASY',
    difficultyRating: 4,
    coverColor: '#FF5FA2',
    highScore: 1000000,
  },
  {
    id: 'overdrive',
    title: 'OVERDRIVE!!',
    artist: 'MAXSPEED',
    bpm: 200,
    duration: 98,
    difficulty: 'EXPERT',
    difficultyRating: 14,
    coverColor: '#FF5FA2',
    highScore: 0,
  },
  {
    id: 'circuit-dream',
    title: 'Circuit Dream',
    artist: 'Electron Fox',
    bpm: 145,
    duration: 135,
    difficulty: 'NORMAL',
    difficultyRating: 8,
    coverColor: '#42E8E0',
    highScore: 756230,
  },
  {
    id: 'timing-debug',
    title: 'Timing Debug Click',
    artist: 'SYSTEM',
    bpm: 120,
    duration: 999,
    difficulty: 'EASY',
    difficultyRating: 0,
    coverColor: '#FFAA44',
    highScore: 0,
    isDebug: true,
  },
]

export const DEFAULT_SETTINGS = {
  laneCount: 6,
  noteSpeed: 6,
  showJudgement: true,
  laneHitEffect: true,
  screenShake: false,
  keyGuide: true,
}

export const LANE_KEYS = ['S', 'D', 'F', 'J', 'K', 'L'] as const
export const LANE_KEYCODES = ['KeyS', 'KeyD', 'KeyF', 'KeyJ', 'KeyK', 'KeyL'] as const

export const LANE_COLORS = [
  '#42E8E0', // cyan
  '#7C6CFF', // purple
  '#FF5FA2', // pink
  '#42E8E0', // cyan
  '#7C6CFF', // purple
  '#FF5FA2', // pink
]

export const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: '#A8E87F',
  NORMAL: '#42E8E0',
  HARD: '#7C6CFF',
  EXPERT: '#FF5FA2',
}
