package gifmaker

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// ConvertToGif は一時動画ファイルを高品質なGIFに変換します
func ConvertToGif(inputFile, outputFile string) error {
	// ffmpegのパスを bin/ フォルダ配下に指定
	ffmpegPath := filepath.Join("bin", "ffmpeg")
	if runtime.GOOS == "windows" {
		ffmpegPath += ".exe"
	}

	if _, err := os.Stat(ffmpegPath); os.IsNotExist(err) {
		return fmt.Errorf("ffmpegが見つかりません。パス: %s", ffmpegPath)
	}

	// 高品質かつ軽量なGIFを作るためのフィルタ設定
	// fps=15, 横幅最大480px, lanczosアルゴリズムでリサイズ、カスタムパレット生成
	filter := "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse"

	args := []string{
		"-y",             // 既存ファイルがある場合は上書き
		"-i", inputFile,  // 入力ファイル
		"-vf", filter,    // ビデオフィルタ
		"-loop", "0",     // 無限ループ
		outputFile,       // 出力ファイル名
	}

	fmt.Printf("ffmpegを実行中: %s -i %s ...\n", ffmpegPath, inputFile)

	cmd := exec.Command(ffmpegPath, args...)
	
	// ログが大量に出るため、エラー出力のみをコンソールに表示
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("ffmpegの実行に失敗しました: %w", err)
	}

	return nil
}