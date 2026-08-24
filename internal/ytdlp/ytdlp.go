package ytdlp

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// Download はyt-dlpを呼び出して動画の一部をダウンロードします
func Download(url, start, end string) (string, error) {
	outputFile := "temp_video.mp4"

	// OSによって拡張子を変える（Windowsなら.exeをつける）
	ytdlpPath := filepath.Join("bin", "yt-dlp")
	if runtime.GOOS == "windows" {
		ytdlpPath += ".exe"
	}

	// パスが存在するか念のため確認
	if _, err := os.Stat(ytdlpPath); os.IsNotExist(err) {
		return "", fmt.Errorf("yt-dlpが見つかりません。パス: %s", ytdlpPath)
	}

	// yt-dlp の引数を組み立てる
	section := fmt.Sprintf("*%s-%s", start, end)
	
	args := []string{
		url,
		"--download-sections", section,
		"--force-keyframes-at-cuts",
		"-o", outputFile,
	}

	fmt.Printf("yt-dlpを実行中: %s %v\n", ytdlpPath, args)

	// ★変更: bin/ 以下の yt-dlp を実行
	cmd := exec.Command(ytdlpPath, args...)
	
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("yt-dlpの実行に失敗しました: %w", err)
	}

	return outputFile, nil
}