package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	"yt2gif/internal/gifmaker"
	"yt2gif/internal/ytdlp"
)

func main() {
	// 変数の準備
	var start, end, duration, output string

	// フラグ（オプション）の定義
	// 短いオプション(-s)と長いオプション(--start)の両方をサポートします
	flag.StringVar(&start, "s", "", "切り抜き開始時間 (例: 00:15 または 15)")
	flag.StringVar(&start, "start", "", "切り抜き開始時間 (例: 00:15 または 15)")

	flag.StringVar(&end, "e", "", "切り抜き終了時間 (例: 00:20 または 20)")
	flag.StringVar(&end, "end", "", "切り抜き終了時間 (例: 00:20 または 20)")

	flag.StringVar(&duration, "d", "", "切り抜く長さ[秒] (例: 5)")
	flag.StringVar(&duration, "duration", "", "切り抜く長さ[秒] (例: 5)")

	flag.StringVar(&output, "o", "output.gif", "出力ファイル名")
	flag.StringVar(&output, "output", "output.gif", "出力ファイル名")

	// コマンドライン引数をパース
	flag.Parse()

	// URLの取得（フラグ以外の最初の引数）
	args := flag.Args()
	if len(args) < 1 {
		fmt.Println("エラー: 動画のURLを指定してください。")
		fmt.Println("使用方法: yt2gif [オプション] <URL>")
		flag.PrintDefaults()
		os.Exit(1)
	}
	url := args[0]

	// 入力値のバリデーション（チェック）
	if start == "" {
		fmt.Println("エラー: 開始時間(-s または --start)は必須です。")
		os.Exit(1)
	}
	if end == "" && duration == "" {
		fmt.Println("エラー: 終了時間(-e)または長さ(-d)のいずれかを指定してください。")
		os.Exit(1)
	}

	if end == "" && duration != "" {
		fmt.Println("エラー: 現在 -d オプションは準備中のため、-e を使用してください。")
		os.Exit(1)
	}

	fmt.Println("=== 実行パラメータ確認 ===")
	fmt.Printf("URL     : %s\n", url)
	fmt.Printf("Start   : %s\n", start)
	if end != "" {
		fmt.Printf("End     : %s\n", end)
	}
	if duration != "" {
		fmt.Printf("Duration: %s\n", duration)
	}
	fmt.Printf("Output  : %s\n", output)
	fmt.Println("==========================")

	// yt-dlpで部分ダウンロードを実行
	fmt.Println("\n[1/2] 動画の部分ダウンロードを開始します...")
	tempFile, err := ytdlp.Download(url, start, end)
	if err != nil {
		fmt.Printf("エラー: yt-dlpダウンロード失敗: %v\n", err)
		os.Exit(1)
	}

	// yt-dlpは指定したファイル名(temp_video.mp4)に .webm などの拡張子を
	// 勝手に付与して保存することがあるため、実際に生成されたファイルを特定する
	matches, _ := filepath.Glob(tempFile + "*")
	if len(matches) == 0 {
		fmt.Println("エラー: ダウンロードされた一時ファイルが見つかりません。")
		os.Exit(1)
	}
	actualTempFile := matches[0]

	// ffmpegでGIFに変換
	fmt.Println("\n[2/2] GIFへの変換を開始します...")
	err = gifmaker.ConvertToGif(actualTempFile, output)
	if err != nil {
		fmt.Printf("エラー: GIF変換失敗: %v\n", err)
		os.Exit(1)
	}

	// 成功したら一時ファイルを削除
	os.Remove(actualTempFile)

	fmt.Printf("\nGIFを生成しました: %s\n", output)
}