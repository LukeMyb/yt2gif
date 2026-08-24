package main

import (
	"flag"
	"fmt"
	"os"
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

	// 動作確認用の出力（次ステップで実際の処理に置き換えます）
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
	fmt.Println("※ここに yt-dlp と ffmpeg を呼び出す処理を追加します")
}