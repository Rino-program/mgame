const test = require('node:test');
const assert = require('node:assert/strict');

const {
  RhythmEngine,
  createDebugClickChart,
  createKeyboardInputMapper,
} = require('../src/rhythmEngine');

function createClock(start = 0) {
  let now = start;
  return {
    now: () => now,
    set: (value) => {
      now = value;
    },
    advance: (delta) => {
      now += delta;
    },
  };
}

test('judge windows boundary classification', () => {
  const clock = createClock(1000);
  const engine = new RhythmEngine({ nowProvider: clock.now });

  engine.loadChart({
    songId: 'windows',
    bpm: 120,
    offsetMs: 0,
    lanes: 6,
    notes: [
      { id: 1, lane: 0, timeMs: 1000, type: 'tap' },
      { id: 2, lane: 0, timeMs: 2000, type: 'tap' },
      { id: 3, lane: 0, timeMs: 3000, type: 'tap' },
      { id: 4, lane: 0, timeMs: 4000, type: 'tap' },
    ],
  });

  engine.start(0);

  clock.set(2030);
  let result = engine.onInput({ lane: 0, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(result.result, 'perfect');

  clock.set(3060);
  result = engine.onInput({ lane: 0, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(result.result, 'great');

  clock.set(4090);
  result = engine.onInput({ lane: 0, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(result.result, 'good');

  clock.set(5130);
  result = engine.onInput({ lane: 0, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(result.result, 'bad');
});

test('misses are auto-applied after bad window passes', () => {
  const clock = createClock(0);
  const engine = new RhythmEngine({ nowProvider: clock.now });

  engine.loadChart({
    songId: 'miss',
    bpm: 120,
    offsetMs: 0,
    lanes: 6,
    notes: [{ id: 1, lane: 2, timeMs: 1000, type: 'tap' }],
  });

  engine.start(0);
  clock.set(1131);
  engine.getRenderState(clock.now());

  const score = engine.getScoreState();
  assert.equal(score.counts.miss, 1);
  assert.equal(score.combo, 0);
});

test('lane independence and closest-note selection', () => {
  const clock = createClock(0);
  const engine = new RhythmEngine({ nowProvider: clock.now });

  engine.loadChart({
    songId: 'selection',
    bpm: 120,
    offsetMs: 0,
    lanes: 6,
    notes: [
      { id: 1, lane: 0, timeMs: 1000, type: 'tap' },
      { id: 2, lane: 0, timeMs: 1050, type: 'tap' },
      { id: 3, lane: 1, timeMs: 1000, type: 'tap' },
    ],
  });

  engine.start(0);

  clock.set(1039);
  const first = engine.onInput({ lane: 0, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(first.noteId, 2);

  clock.set(1005);
  const wrongLane = engine.onInput({ lane: 2, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(wrongLane, null);

  const laneOne = engine.onInput({ lane: 1, timestampMs: clock.now(), source: 'keyboard' });
  assert.equal(laneOne.noteId, 3);
});

test('same input sequence produces identical score state', () => {
  const chart = {
    songId: 'replay',
    bpm: 120,
    offsetMs: 0,
    lanes: 6,
    notes: [
      { id: 1, lane: 0, timeMs: 1000, type: 'tap' },
      { id: 2, lane: 1, timeMs: 1500, type: 'tap' },
      { id: 3, lane: 2, timeMs: 2000, type: 'tap' },
    ],
  };

  const run = () => {
    const clock = createClock(0);
    const engine = new RhythmEngine({ nowProvider: clock.now, debugEnabled: true });
    engine.loadChart(chart);
    engine.start(0);

    const inputs = [
      { t: 995, lane: 0 },
      { t: 1515, lane: 1 },
      { t: 2100, lane: 2 },
    ];

    for (const input of inputs) {
      clock.set(input.t);
      engine.onInput({ lane: input.lane, timestampMs: clock.now(), source: 'keyboard' });
    }

    return {
      score: engine.getScoreState(),
      debug: engine.getDebugState(),
    };
  };

  const a = run();
  const b = run();

  assert.deepEqual(a.score, b.score);
  assert.deepEqual(a.debug, b.debug);
});

test('debug click chart aligns 500ms interval at 120 BPM', () => {
  const chart = createDebugClickChart({ bpm: 120, durationMs: 2600, startTimeMs: 1000, lanes: 6 });
  assert.equal(chart.notes[0].timeMs, 1000);
  assert.equal(chart.notes[1].timeMs - chart.notes[0].timeMs, 500);
  assert.equal(chart.notes[2].timeMs, 2000);
  assert.equal(chart.notes[3].timeMs, 2500);
});

test('keyboard mapper suppresses repeat and emits escape', () => {
  const laneEvents = [];
  let escaped = false;

  const mapKey = createKeyboardInputMapper({
    onLane: (ev) => laneEvents.push(ev),
    onEscape: () => {
      escaped = true;
    },
    nowProvider: () => 42,
  });

  mapKey({ code: 'KeyD', repeat: true });
  mapKey({ code: 'KeyD', repeat: false });
  const escape = mapKey({ code: 'Escape', repeat: false });

  assert.equal(laneEvents.length, 1);
  assert.equal(laneEvents[0].lane, 0);
  assert.equal(laneEvents[0].timestampMs, 42);
  assert.equal(escaped, true);
  assert.deepEqual(escape, { type: 'escape' });
});
