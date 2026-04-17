# mgame

落下式音ゲー向けのコアエンジン実装です。

## 起動方法

このリポジトリはエンジン実装中心のため、まずテストで動作確認します。

```bash
npm test
```

## エンジンAPI

`/home/runner/work/mgame/mgame/src/rhythmEngine.js` の `RhythmEngine` は以下を提供します。

- `loadChart(chart)`
- `loadAudio(buffer)`
- `start(startAtMs?)`
- `pause()` / `resume()` / `stop()`
- `onInput(ev)`
- `getRenderState(nowMs)`
- `getScoreState()`
- `getDebugState()`
- `requestEscape()`

## キー設定

デフォルト6キーは `D F J K C M` です。

`createKeyboardInputMapper` でキーリマップ可能です。

## 判定窓調整

`RhythmEngine` コンストラクタまたは `setTimingOptions` で調整できます。

- 判定窓（初期値）
  - Perfect: ±30ms
  - Great: ±60ms
  - Good: ±90ms
  - Bad: ±130ms
- `globalOffsetMs`
- `visualLeadMs`
- `inputLatencyCompMs`

## デバッグモード（クリック譜面）

`createDebugClickChart` で 120BPM の 500ms 間隔ノーツ譜面を生成できます。

- クリック理想時刻と判定時刻を一致させるための譜面生成
- `debugEnabled: true` のとき `getDebugState()` で次を取得
  - `timingStats`（mean / median / stddev / min / max）
  - 直近サンプル
  - `recommendedGlobalOffsetMs`

## 将来拡張

- ロングノーツ（hold）
- スライド入力
- Web Audio API のスケジューリング強化
