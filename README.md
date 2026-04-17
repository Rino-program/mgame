# mgame

落下式音ゲー向けのコアエンジン実装です。

## 起動方法（Engineテスト）

このリポジトリはエンジン実装中心のため、まずテストで動作確認します。

```bash
npm test
```

## v0 UI 統合版の起動

`v0` 配下に Next.js ベースの UI があり、`v0/v0/engine/core/rhythmEngine.js` を統合層経由で接続しています。

```bash
npm run web:install
npm run web:dev
```

ブラウザで `http://localhost:3000` を開くと、
「曲選択 -> プレイ -> 終了」の一連フローを確認できます。

## GitHub Pages デプロイ

`main` ブランチへの push で GitHub Pages に自動デプロイされます。

- ワークフロー: [.github/workflows/jekyll-gh-pages.yml](.github/workflows/jekyll-gh-pages.yml)
- ビルド方式: Next.js static export (`v0/out`)
- 公開URL: `https://<GitHubユーザー名>.github.io/mgame/`

ローカルで公開用ビルドを確認する場合:

```bash
npm run web:build
```

## エンジンAPI

`src/rhythmEngine.js` の `RhythmEngine` は以下を提供します。

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
- `durationMs` は `startTimeMs` からの長さ（ms）です
- 絶対時刻で指定したい場合は `endTimeMs` を使用できます（`endTimeMs` 未満まで生成）
- `debugEnabled: true` のとき `getDebugState()` で次を取得
  - `timingStats`（mean / median / stddev / min / max）
  - 直近サンプル
  - `recommendedGlobalOffsetMs`

UI 側では `Timing Debug Click` を選択すると以下を表示します。

- `Now Offset`
- `Avg(20)`
- `Suggest Offset`

ESC キーは安全終了フローとして扱われ、エンジン停止後に曲選択へ戻ります。

## 既知の制約

- 音源デコード・再生は未接続（統合ログのみ実装）
- ロングノーツ判定は未実装（描画型は予約済み）
- 判定と描画の時間軸は `performance.now()` 基準

## 将来拡張

- ロングノーツ（hold）
- スライド入力
- Web Audio API のスケジューリング強化
