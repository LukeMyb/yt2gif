# yt2gif

YouTubeの動画から任意の範囲を切り抜いて、簡単にGIFアニメーションを生成できるデスクトップアプリケーションです。

## ✨ 特徴

- **簡単なURL入力**: YouTubeのURLを貼り付けるだけで、動画のプレビューを読み込みます。
- **直感的な範囲指定**: スライダーを使って切り抜きたい範囲を大まかに指定できます。
- **0.1秒単位の微調整**: 「+0.1s」「-0.1s」ボタンを使い、開始・終了位置を正確に調整できます。
- **自動保存**: 生成されたGIFファイルは、お使いのPCの「ビデオ（Videos）」フォルダ内の `yt2gif` フォルダに自動で保存され、完了後にエクスプローラーが自動で開きます。

---

## 📥 インストールと使い方（一般ユーザー向け）

アプリとして利用するだけであれば、面倒なツールの設定は不要です。（GIF生成に必要な `ffmpeg` や `yt-dlp` はインストーラーに同梱されています）

1. [Releases](https://github.com/LukeMyb/yt2gif/releases) ページから、最新の `yt2gif-x.x.x-setup.exe` をダウンロードします。
2. ダウンロードしたインストーラーを実行し、画面の指示に従ってインストールします。
3. デスクトップのショートカットからアプリを起動し、YouTubeのURLを貼り付けてご利用ください。

---

## 🛠️ 開発者向けガイド

このリポジトリをクローンして、ローカルで開発・ビルドを行う方向けの手順です。

### 開発環境のセットアップ

リポジトリ内に必要なツール（`yt-dlp.exe`, `ffmpeg.exe`）が同梱されているため、特別なツールの手動配置は不要です。クローン後、以下のコマンドですぐに開発を始められます。

```bash
cd app
npm install
npm run dev
```

### ビルド

Windows向けのインストーラー（`.exe`）を生成する場合は、以下のコマンドを実行します。
（`electron-builder` の設定により、`app/bin` 内のツールも自動的に `setup.exe` にバンドルされます）

```bash
cd app
npm run build:win
```

その他のコマンド:
- Mac向け: `npm run build:mac`
- Linux向け: `npm run build:linux`

## 💻 技術スタック

- [Electron](https://www.electronjs.org/)
- [React](https://react.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite (electron-vite)](https://electron-vite.org/)
