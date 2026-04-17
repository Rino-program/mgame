# 仕様書3: GitHub Copilot Agent向け（v0 UI + Engine 結合仕様）
対象: GitHub Copilot Agent（PR実装）  
責務: v0配下UIとエンジンの接続、状態同期、動作保証

---

## 1. 目的
v0で作成したUIと、Copilotで実装したエンジンを統合し、
「曲選択 → プレイ → 終了」を一連で動作させる。

---

## 2. ディレクトリ方針
- v0コード: `/v0` 配下（固定）
- エンジン: `/src/engine`（例）
- 結合層: `/src/integration`（例）
- 変換層（Adapter）で依存逆転:
  - UIはEngine詳細を知らない
  - EngineはUIフレームワークを知らない

---

## 3. 結合アーキテクチャ
推奨層:
1. **UI層**（v0）
2. **Presenter/Controller層**（統合）
3. **Engine層**

データフロー:
- UI入力 → Controller → Engine.onInput()
- Engine state → Controller整形 → UI props更新

---

## 4. 契約インターフェース
UIが受け取る状態:
- `renderNotes`
- `hud(score, combo, time, judgementStats)`
- `effects(hitFlash, judgeText)`
- `debug(timingOffsetMs, rollingMean)`

UIが送るイベント:
- `startSong(songId)`
- `laneInput(lane, source, ts)`
- `pause/resume`
- `exit(esc)`

---

## 5. 曲選択→プレイ遷移実装
1. 曲選択UIで `songId` 確定
2. 対応する譜面JSON/音源ロード
3. `engine.loadChart/loadAudio`
4. カウントダウン（任意）後 `engine.start`
5. プレイ画面へ遷移

エラー時:
- 読み込み失敗モーダル
- 曲選択へ戻る導線

---

## 6. ノーツ描画結合
- Engine `getRenderState(now)` から、
  - 各ノーツの `y` 座標 or 判定時刻情報を取得
- UI側で座標変換:
  - `y = f(note.timeMs - currentTime, visualLeadMs, laneHeight)`
- 判定済みノーツは描画除外

---

## 7. 判定結果反映
`onInput` の戻り値 `JudgeResult` を受け:
- スコア更新
- コンボ更新
- 判定文字表示
- レーンフラッシュ
- 効果音（任意）

---

## 8. ESC終了フロー
- `keydown Escape` をUIで捕捉
- Controllerが `engine.stop()`
- Audio停止/後始末
- 曲選択画面へ戻る
- 必要なら確認ダイアログを挟む

---

## 9. デバッグクリックモード結合
### 9.1 選択導線
- 曲選択に「Timing Debug Click」を通常曲として表示

### 9.2 実行
- 専用譜面 + クリック音再生
- ノーツ到達とクリック音同期
- 入力ごとに `deltaMs` 表示（小HUD）

### 9.3 表示
- `Now Offset: +12ms`
- `Avg(20): +9ms`
- `Suggest Offset: -9ms`（任意）

---

## 10. 同期・ズレ対策
- 描画基準と判定基準を分離しない（同一時間軸）
- `performance.now()` と `audioContext.currentTime` の橋渡し関数を1箇所に集約
- タブ非アクティブ復帰時の補正処理
- フレーム落ち時も判定時刻は正確維持

---

## 11. 受け入れテスト（統合）
- [ ] 曲選択→プレイ遷移が機能
- [ ] 6レーン独立入力で正しく判定
- [ ] キーボードとタップが同等動作
- [ ] ESCで安全に終了できる
- [ ] Debugクリックで同期確認できる
- [ ] v0コードが `/v0` 配下に存在
- [ ] EngineとUIの責務分離が保たれる

---

## 12. 失敗時の観測ログ
最低限コンソールログ:
- 曲ロード開始/完了
- 音源デコード開始/完了
- start時の同期基準値
- 入力時刻 / 判定対象ノーツ時刻 / delta
- ESC終了理由

将来:
- 開発用オーバーレイに可視化

---

## 13. 仕上げ条件（PR）
- 統合後にローカルで通しプレイ可能
- README更新（v0配置、起動、デバッグモード）
- 既知の制約を明記
- 次フェーズ課題:
  - ロングノーツ
  - 譜面エディタ
  - 遅延自動校正