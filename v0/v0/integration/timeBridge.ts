export interface TimeBridge {
  nowMs: () => number
  getSongTimeMsFromAudio: () => number
}

export function createTimeBridge(audioContext?: AudioContext | null): TimeBridge {
  const perfOriginMs = performance.now()
  const audioOriginMs = audioContext ? audioContext.currentTime * 1000 : null

  return {
    nowMs: () => performance.now(),
    getSongTimeMsFromAudio: () => {
      if (!audioContext || audioOriginMs === null) {
        return Math.max(0, performance.now() - perfOriginMs)
      }
      return Math.max(0, audioContext.currentTime * 1000 - audioOriginMs)
    },
  }
}
