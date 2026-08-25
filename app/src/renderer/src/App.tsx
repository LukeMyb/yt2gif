import { useState, useRef, useEffect } from 'react'
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

function App() {
  const [url, setUrl] = useState('')
  const [videoId, setVideoId] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  
  // スライダーと動画の状態管理
  const [duration, setDuration] = useState<number>(0)
  const [range, setRange] = useState<[number, number]>([0, 0])
  const playerRef = useRef<YouTubePlayer | null>(null)

  // 自動停止のための監視機能
  // setIntervalの中で常に最新の range を参照するためのRef
  const rangeRef = useRef<[number, number]>(range)
  useEffect(() => {
    rangeRef.current = range
  }, [range])

  // 0.1秒間隔で再生位置を監視する
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current) {
        // getPlayerState() の 1 は「再生中 (PLAYING)」を意味します
        if (playerRef.current.getPlayerState() === 1) {
          const currentTime = playerRef.current.getCurrentTime()
          const endTime = rangeRef.current[1] // 現在のEND時間
          
          // 再生位置がEND時間を超えたら
          if (currentTime >= endTime) {
            playerRef.current.pauseVideo()        // 動画を一時停止
            playerRef.current.seekTo(endTime, true) // 位置をENDにピッタリ合わせる
          }
        }
      }
    }, 100)

    // クリーンアップ（コンポーネントが消えるときに監視を止める）
    return () => clearInterval(interval)
  }, [])

  // URLからVideoIDを抽出
  const extractVideoId = (inputUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
    const match = inputUrl.match(regExp)
    if (match && match[2].length === 11) {
      setVideoId(match[2])
    } else {
      setVideoId(null)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    extractVideoId(newUrl)
  }

  // YouTubeプレイヤーの準備完了時の処理
  const onReady = (event: YouTubeEvent) => {
    playerRef.current = event.target
    const videoDuration = event.target.getDuration()
    setDuration(videoDuration)
    // 初期値として、最初の5秒間を選択状態にする
    setRange([0, Math.min(5, videoDuration)]) 
  }

  // スライダーを動かしたときの処理
  const handleSliderChange = (newRange: number | number[]) => {
    if (Array.isArray(newRange)) {
      setRange([newRange[0], newRange[1]])
      
      // 動かした方のつまみに合わせて動画をシークする
      if (playerRef.current) {
        // スライダーを触った瞬間に動画を一時停止する
        playerRef.current.pauseVideo()
        
        // プレビューを開始位置にシークさせる
        playerRef.current.seekTo(newRange[0], true)
      }
    }
  }

  // ミリ秒を "00:15.500" 形式にフォーマットするヘルパー関数
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = Math.floor(seconds % 60).toString().padStart(2, '0')
    const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0')
    return `${m}:${s}.${ms}`
  }

  // 100ms単位での微調整ボタンの処理
  const adjustRange = (index: 0 | 1, delta: number) => {
    setRange(prev => {
      const newRange = [...prev] as [number, number]
      newRange[index] = Math.max(0, Math.min(duration, newRange[index] + delta))
      
      // 開始位置が終了位置を超えないように制御
      if (index === 0 && newRange[0] > newRange[1]) newRange[0] = newRange[1]
      if (index === 1 && newRange[1] < newRange[0]) newRange[1] = newRange[0]

      if (playerRef.current) {
        // 微調整ボタンを押した時も動画を一時停止する
        playerRef.current.pauseVideo()
        
        // プレビューを調整した位置にシークさせる
        playerRef.current.seekTo(newRange[index], true)
      }
      return newRange
    })
  }

  // 生成ボタンを押したときの処理
  const handleGenerateGif = () => {
    if (!url || isGenerating) return
    
    setIsGenerating(true)

    const data = {
      url: url,
      startTime: range[0],
      endTime: range[1]
    }
    
    if ((window as any).electron) {
      (window as any).electron.ipcRenderer.send('generate-gif', data)
    } else {
      console.error('Electron環境で実行されていません')
      setIsGenerating(false)
    }
  }

  // 裏側から 'generate-gif-complete' が送られてきたらボタンを元に戻す
  useEffect(() => {
    if (!(window as any).electron) return

    const ipc = (window as any).electron.ipcRenderer
    ipc.on('generate-gif-complete', (_event, response) => {
      setIsGenerating(false) // ボタンを通常状態に戻す
      
      if (!response.success) {
        alert('エラーが発生しました。裏側のログを確認してください。\n' + response.error)
      }
    })

    // クリーンアップ処理
    return () => {
      ipc.removeAllListeners('generate-gif-complete')
    }
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', boxSizing: 'border-box', overflow: 'hidden', backgroundColor: '#18181b', color: '#d4d4d8' }}>
      <div style={{ width: '100%', margin: '0 auto' }}>
        
        <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>yt2gif</h2>
        
        {/* 上部：URL入力欄 */}
        <div style={{ marginBottom: '24px' }}>
          <input 
            type="text" 
            placeholder="YouTubeのURLを入力..." 
            value={url}
            onChange={handleUrlChange}
            style={{ 
              width: '100%', padding: '12px', fontSize: '16px', boxSizing: 'border-box',
              backgroundColor: '#27272a', color: '#ffffff', 
              border: '1px solid #3f3f46', borderRadius: '6px', outline: 'none'
            }}
          />
        </div>

        {videoId && (
          // 左右分割レイアウトのコンテナ
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
            
            {/* 左側：操作パネル */}
            <div style={{ flex: '1', minWidth: '0', padding: '24px', backgroundColor: '#27272a', borderRadius: '8px', border: '1px solid #3f3f46', boxSizing: 'border-box' }}>
              <h3 style={{ marginTop: 0, color: '#ffffff', marginBottom: '30px' }}>切り抜き範囲の指定</h3>
              
              <div style={{ padding: '10px 15px', marginBottom: '30px' }}>
                <Slider 
                  range 
                  min={0} 
                  max={duration} 
                  step={0.1}
                  value={range} 
                  onChange={handleSliderChange}
                  trackStyle={[{ backgroundColor: '#ef4444' }]}
                  handleStyle={[
                    { borderColor: '#ef4444', backgroundColor: '#ffffff', opacity: 1 }, 
                    { borderColor: '#ef4444', backgroundColor: '#ffffff', opacity: 1 }
                  ]}
                  railStyle={{ backgroundColor: '#3f3f46' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>START</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', margin: '5px 0', color: '#ffffff' }}>
                    {formatTime(range[0])}
                  </div>
                  <div>
                    <button onClick={() => adjustRange(0, -0.1)} style={btnStyle}>-0.1s</button>
                    <button onClick={() => adjustRange(0, 0.1)} style={btnStyle}>+0.1s</button>
                  </div>
                </div>

                <div style={{ color: '#52525b', fontWeight: 'bold', fontSize: '24px' }}>〜</div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>END</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', margin: '5px 0', color: '#ffffff' }}>
                    {formatTime(range[1])}
                  </div>
                  <div>
                    <button onClick={() => adjustRange(1, -0.1)} style={btnStyle}>-0.1s</button>
                    <button onClick={() => adjustRange(1, 0.1)} style={btnStyle}>+0.1s</button>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleGenerateGif}
                disabled={isGenerating}
                style={{
                  width: '100%', padding: '16px', 
                  backgroundColor: isGenerating ? '#52525b' : '#ef4444', 
                  color: isGenerating ? '#a1a1aa' : 'white', 
                  border: 'none', 
                  borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', 
                  cursor: isGenerating ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isGenerating 
                  ? 'GIFを生成中... (お待ちください)' 
                  : `GIFを生成する (${formatTime(range[1] - range[0])})`
                }
              </button>
            </div>

            {/* 右側：動画プレビュー */}
            <div style={{ 
              flex: '1', minWidth: '0', borderRadius: '8px', overflow: 'hidden', 
              border: '1px solid #3f3f46', backgroundColor: '#000', 
              aspectRatio: '16/9', width: '100%', position: 'relative' 
            }}>
              <YouTube 
                videoId={videoId} 
                onReady={onReady}
                style={{ width: '100%', height: '100%' }}
                opts={{
                  width: '100%',
                  height: '100%',
                  playerVars: { autoplay: 1, controls: 1 }
                }}
              />
            </div>
            
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '6px 12px', margin: '0 4px', cursor: 'pointer',
  border: '1px solid #52525b', borderRadius: '4px', 
  backgroundColor: '#3f3f46', color: '#d4d4d8',
  fontWeight: 'bold'
}

export default App