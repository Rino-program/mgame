const DEFAULT_JUDGE_WINDOWS_MS = {
  perfect: 30,
  great: 60,
  good: 90,
  bad: 130,
};

const DEFAULT_SCORE_VALUES = {
  perfect: 1000,
  great: 700,
  good: 400,
  bad: 100,
  miss: 0,
};

const DEFAULT_ACCURACY_WEIGHTS = {
  perfect: 1,
  great: 0.7,
  good: 0.4,
  bad: 0.1,
  miss: 0,
};

const DEFAULT_KEY_BINDINGS = ["KeyD", "KeyF", "KeyJ", "KeyK", "KeyC", "KeyM"];

class RhythmEngine {
  constructor(options = {}) {
    this.nowProvider =
      options.nowProvider ||
      (() => {
        if (typeof performance !== "undefined" && typeof performance.now === "function") {
          return performance.now();
        }
        return Date.now();
      });

    this.judgeWindowsMs = { ...DEFAULT_JUDGE_WINDOWS_MS, ...(options.judgeWindowsMs || {}) };
    this.scoreValues = { ...DEFAULT_SCORE_VALUES, ...(options.scoreValues || {}) };
    this.accuracyWeights = { ...DEFAULT_ACCURACY_WEIGHTS, ...(options.accuracyWeights || {}) };

    this.visualLeadMs = options.visualLeadMs ?? 1200;
    this.globalOffsetMs = options.globalOffsetMs ?? 0;
    this.inputLatencyCompMs = options.inputLatencyCompMs ?? 0;

    this.debugHistorySize = options.debugHistorySize ?? 20;
    this.debugEnabled = options.debugEnabled ?? false;

    this.reset();
  }

  reset() {
    this.chart = null;
    this.audioBuffer = null;
    this.isRunning = false;
    this.isPaused = false;
    this.audioStartAtNowMs = 0;
    this.pauseStartedAtMs = 0;
    this.accumulatedPauseMs = 0;

    this.lanes = 6;
    this.notesByLane = [];
    this.noteStateById = new Map();

    this.scoreState = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      counts: {
        perfect: 0,
        great: 0,
        good: 0,
        bad: 0,
        miss: 0,
      },
      totalNotes: 0,
      judgedNotes: 0,
      accuracy: 0,
      meanDeltaMs: 0,
    };

    this.judgeHistory = [];
    this.debugDeltasMs = [];
    this.escapeRequested = false;
  }

  loadChart(chart) {
    if (!chart || !Array.isArray(chart.notes)) {
      throw new Error("Invalid chart format");
    }

    this.chart = {
      songId: chart.songId ?? "unknown",
      bpm: chart.bpm ?? 120,
      offsetMs: chart.offsetMs ?? 0,
      lanes: chart.lanes ?? 6,
      notes: [...chart.notes],
    };

    this.lanes = this.chart.lanes;
    this.notesByLane = Array.from({ length: this.lanes }, () => ({ nextIndex: 0, notes: [] }));
    this.noteStateById.clear();

    // Normalize notes and keep each lane independently searchable via pointer.
    this.chart.notes
      .slice()
      .sort((a, b) => a.timeMs - b.timeMs)
      .forEach((note, sortedIndex) => {
        if (note.lane < 0 || note.lane >= this.lanes) {
          throw new Error(`Invalid lane index: ${note.lane}`);
        }

        const normalized = {
          id: note.id ?? sortedIndex,
          lane: note.lane,
          type: note.type ?? "tap",
          timeMs: note.timeMs,
          judgeTimeMs: note.timeMs + this.chart.offsetMs,
        };

        this.notesByLane[note.lane].notes.push(normalized);
        this.noteStateById.set(normalized.id, {
          judged: false,
          result: null,
          deltaMs: null,
        });
      });

    this.scoreState.totalNotes = this.chart.notes.length;
    this.scoreState.judgedNotes = 0;
    this.judgeHistory = [];
    this.debugDeltasMs = [];
  }

  loadAudio(buffer) {
    this.audioBuffer = buffer || null;
  }

  start(startAtMs = 0) {
    if (!this.chart) {
      throw new Error("Chart is not loaded");
    }

    this.isRunning = true;
    this.isPaused = false;
    this.accumulatedPauseMs = 0;
    this.pauseStartedAtMs = 0;
    this.audioStartAtNowMs = this.nowProvider() - startAtMs;
    this.escapeRequested = false;
  }

  pause() {
    if (!this.isRunning || this.isPaused) {
      return;
    }
    this.isPaused = true;
    this.pauseStartedAtMs = this.nowProvider();
  }

  resume() {
    if (!this.isRunning || !this.isPaused) {
      return;
    }
    this.accumulatedPauseMs += this.nowProvider() - this.pauseStartedAtMs;
    this.pauseStartedAtMs = 0;
    this.isPaused = false;
  }

  stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.pauseStartedAtMs = 0;
    this.accumulatedPauseMs = 0;
    // Release references so UI can safely dispose audio resources.
    this.audioBuffer = null;
  }

  requestEscape() {
    this.escapeRequested = true;
  }

  setTimingOptions({ globalOffsetMs, visualLeadMs, inputLatencyCompMs } = {}) {
    if (typeof globalOffsetMs === "number") this.globalOffsetMs = globalOffsetMs;
    if (typeof visualLeadMs === "number") this.visualLeadMs = visualLeadMs;
    if (typeof inputLatencyCompMs === "number") this.inputLatencyCompMs = inputLatencyCompMs;
  }

  getSongTimeMs(nowMs = this.nowProvider()) {
    if (!this.isRunning) {
      return 0;
    }

    if (this.isPaused) {
      return Math.max(0, this.pauseStartedAtMs - this.audioStartAtNowMs - this.accumulatedPauseMs);
    }

    return Math.max(0, nowMs - this.audioStartAtNowMs - this.accumulatedPauseMs);
  }

  processMisses(currentTimeMs) {
    const missThreshold = this.judgeWindowsMs.bad;

    for (let lane = 0; lane < this.notesByLane.length; lane += 1) {
      const laneState = this.notesByLane[lane];

      while (laneState.nextIndex < laneState.notes.length) {
        const note = laneState.notes[laneState.nextIndex];
        const state = this.noteStateById.get(note.id);

        if (state.judged) {
          laneState.nextIndex += 1;
          continue;
        }

        if (currentTimeMs > note.judgeTimeMs + missThreshold) {
          this.applyJudge(note, "miss", currentTimeMs - note.judgeTimeMs);
          laneState.nextIndex += 1;
          continue;
        }

        break;
      }
    }
  }

  onInput(ev) {
    if (!this.isRunning || this.isPaused || !ev) {
      return null;
    }

    const nowSongTime = this.getSongTimeMs(ev.timestampMs);
    this.processMisses(nowSongTime);

    if (ev.lane < 0 || ev.lane >= this.lanes) {
      return null;
    }

    const laneState = this.notesByLane[ev.lane];
    const adjustedInputTimeMs = nowSongTime + this.globalOffsetMs + this.inputLatencyCompMs;
    const maxWindow = this.judgeWindowsMs.bad;

    let bestNote = null;
    let bestAbsDelta = Number.POSITIVE_INFINITY;

    for (let i = laneState.nextIndex; i < laneState.notes.length; i += 1) {
      const note = laneState.notes[i];
      const state = this.noteStateById.get(note.id);
      if (state.judged) {
        continue;
      }

      const delta = adjustedInputTimeMs - note.judgeTimeMs;
      const absDelta = Math.abs(delta);

      if (delta < -maxWindow && absDelta > bestAbsDelta) {
        break;
      }

      if (absDelta < bestAbsDelta) {
        bestAbsDelta = absDelta;
        bestNote = note;
      }

      if (delta > maxWindow && absDelta > bestAbsDelta) {
        break;
      }
    }

    if (!bestNote) {
      return null;
    }

    const deltaMs = adjustedInputTimeMs - bestNote.judgeTimeMs;
    const result = classifyJudge(Math.abs(deltaMs), this.judgeWindowsMs);

    if (!result) {
      return null;
    }

    const judgeResult = this.applyJudge(bestNote, result, deltaMs, ev.source || "keyboard");

    const laneNotes = this.notesByLane[bestNote.lane];
    while (laneNotes.nextIndex < laneNotes.notes.length) {
      const n = laneNotes.notes[laneNotes.nextIndex];
      if (!this.noteStateById.get(n.id).judged) {
        break;
      }
      laneNotes.nextIndex += 1;
    }

    return judgeResult;
  }

  applyJudge(note, result, deltaMs, source = "engine") {
    const state = this.noteStateById.get(note.id);
    if (!state || state.judged) {
      return null;
    }

    state.judged = true;
    state.result = result;
    state.deltaMs = deltaMs;

    this.scoreState.counts[result] += 1;
    this.scoreState.score += this.scoreValues[result];
    this.scoreState.judgedNotes += 1;

    if (result === "perfect" || result === "great" || result === "good") {
      this.scoreState.combo += 1;
      if (this.scoreState.combo > this.scoreState.maxCombo) {
        this.scoreState.maxCombo = this.scoreState.combo;
      }
    } else {
      this.scoreState.combo = 0;
    }

    this.judgeHistory.push(deltaMs);
    const weighted =
      this.scoreState.counts.perfect * this.accuracyWeights.perfect +
      this.scoreState.counts.great * this.accuracyWeights.great +
      this.scoreState.counts.good * this.accuracyWeights.good +
      this.scoreState.counts.bad * this.accuracyWeights.bad +
      this.scoreState.counts.miss * this.accuracyWeights.miss;

    this.scoreState.accuracy =
      this.scoreState.totalNotes > 0 ? weighted / this.scoreState.totalNotes : 0;

    const mean =
      this.judgeHistory.length > 0
        ? this.judgeHistory.reduce((sum, value) => sum + value, 0) / this.judgeHistory.length
        : 0;
    this.scoreState.meanDeltaMs = mean;

    if (this.debugEnabled) {
      this.debugDeltasMs.push(deltaMs);
      if (this.debugDeltasMs.length > this.debugHistorySize) {
        this.debugDeltasMs.shift();
      }
    }

    return {
      noteId: note.id,
      lane: note.lane,
      result,
      deltaMs,
      source,
      judgeTimeMs: note.judgeTimeMs,
    };
  }

  getRenderState(nowMs = this.nowProvider()) {
    const audioTimeMs = this.getSongTimeMs(nowMs);
    this.processMisses(audioTimeMs);

    const visualTimeMs = audioTimeMs + this.visualLeadMs;

    const visibleNotes = [];
    for (let lane = 0; lane < this.notesByLane.length; lane += 1) {
      for (const note of this.notesByLane[lane].notes) {
        const state = this.noteStateById.get(note.id);
        if (state.judged) {
          continue;
        }

        const deltaToHitMs = note.judgeTimeMs - visualTimeMs;
        if (deltaToHitMs < -this.judgeWindowsMs.bad) {
          continue;
        }

        if (deltaToHitMs > this.visualLeadMs) {
          continue;
        }

        visibleNotes.push({
          id: note.id,
          lane: note.lane,
          type: note.type,
          judgeTimeMs: note.judgeTimeMs,
          deltaToHitMs,
        });
      }
    }

    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      audioTimeMs,
      visualTimeMs,
      visualLeadMs: this.visualLeadMs,
      lanes: this.lanes,
      visibleNotes,
      escapeRequested: this.escapeRequested,
    };
  }

  getScoreState() {
    return {
      ...this.scoreState,
      counts: { ...this.scoreState.counts },
    };
  }

  getDebugState() {
    const stats = computeStats(this.debugDeltasMs);
    return {
      enabled: this.debugEnabled,
      samples: [...this.debugDeltasMs],
      timingStats: stats,
      recommendedGlobalOffsetMs: Number.isFinite(stats.mean) ? -stats.mean : 0,
    };
  }
}

function classifyJudge(absDeltaMs, windowsMs) {
  if (absDeltaMs <= windowsMs.perfect) return "perfect";
  if (absDeltaMs <= windowsMs.great) return "great";
  if (absDeltaMs <= windowsMs.good) return "good";
  if (absDeltaMs <= windowsMs.bad) return "bad";
  return null;
}

function computeStats(values) {
  if (!values.length) {
    return {
      mean: 0,
      median: 0,
      stddev: 0,
      min: 0,
      max: 0,
      recentAverage: 0,
      count: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const mean = sorted.reduce((sum, value) => sum + value, 0) / count;
  const variance = sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / count;
  const midpoint = Math.floor(count / 2);
  const median =
    count % 2 === 0 ? (sorted[midpoint - 1] + sorted[midpoint]) / 2 : sorted[midpoint];

  return {
    mean,
    median,
    stddev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[count - 1],
    recentAverage: mean,
    count,
  };
}

function createDebugClickChart({
  songId = "debug_click_120",
  bpm = 120,
  lanes = 6,
  durationMs = 30_000,
  startTimeMs = 1000,
  offsetMs = 0,
  laneMode = "roundRobin",
  fixedLane = 0,
} = {}) {
  const beatMs = 60_000 / bpm;
  const notes = [];

  let id = 1;
  for (let timeMs = startTimeMs; timeMs <= durationMs; timeMs += beatMs) {
    const lane = laneMode === "fixed" ? fixedLane : (id - 1) % lanes;
    notes.push({ id, lane, timeMs: Math.round(timeMs), type: "tap" });
    id += 1;
  }

  return {
    songId,
    bpm,
    offsetMs,
    lanes,
    notes,
  };
}

function createKeyboardInputMapper({
  keyBindings = DEFAULT_KEY_BINDINGS,
  onLane,
  onEscape,
  nowProvider = () => (typeof performance !== "undefined" ? performance.now() : Date.now()),
} = {}) {
  const keyToLane = new Map();
  keyBindings.forEach((code, lane) => {
    keyToLane.set(code, lane);
  });

  return function handleKeyDown(event) {
    if (!event) return null;

    if (event.code === "Escape") {
      onEscape?.();
      return { type: "escape" };
    }

    if (event.repeat) {
      return null;
    }

    if (!keyToLane.has(event.code)) {
      return null;
    }

    const lane = keyToLane.get(event.code);
    const laneEvent = {
      lane,
      timestampMs: nowProvider(),
      source: "keyboard",
    };

    onLane?.(laneEvent);
    return laneEvent;
  };
}

function createTouchLaneInput(lane, timestampMs) {
  return {
    lane,
    timestampMs,
    source: "touch",
  };
}

module.exports = {
  RhythmEngine,
  createDebugClickChart,
  createKeyboardInputMapper,
  createTouchLaneInput,
  classifyJudge,
  computeStats,
  DEFAULT_JUDGE_WINDOWS_MS,
  DEFAULT_SCORE_VALUES,
  DEFAULT_KEY_BINDINGS,
};
