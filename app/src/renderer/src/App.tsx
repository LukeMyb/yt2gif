import { useState, useRef, useEffect } from 'react'
import YouTube, { YouTubeEvent, YouTubePlayer } from 'react-youtube'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

function App() {
  const [url, setUrl] = useState('')
  const [videoId, setVideoId] = useState<string | null>(null)
  
  // スライダーと動画の状態管理
  const [duration, setDuration] = useState<number>(0)
  const [range, setRange] = useState<[number, number]>([0, 0])
  const playerRef = useRef<YouTubePlayer | null>(null)

  // URLからVideoIDを抽出
  const extractVideoId = (inputUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
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
        // 開始位置が変わった場合は開始位置へ、終了位置が変わった場合は終了位置へシーク
        // (ここでは簡易的に、常に開始位置へシークする例としています)
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

      if (playerRef.current) playerRef.current.seekTo(newRange[index], true)
      return newRange
    })
  }


  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h2>yt2gif - 高精度切り抜きエディタ</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="YouTubeのURLを入力..." 
          value={url}
          onChange={handleUrlChange}
          style={{ width: '100%', padding: '10px', fontSize: '16px', boxSizing: 'border-box' }}
        />
      </div>

      {videoId && (
        <>
          <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden' }}>
            <YouTube 
              videoId={videoId} 
              onReady={onReady}
              opts={{
                width: '100%',
                height: '400',
                playerVars: { autoplay: 1, controls: 1 }
              }}
            />
          </div>

          <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
            <h3 style={{ marginTop: 0 }}>切り抜き範囲の指定</h3>
            
            {/* rc-slider のダブルスライダー */}
            <div style={{ padding: '10px 15px', marginBottom: '20px' }}>
              <Slider 
                range 
                min={0} 
                max={duration} 
                step={0.1} // 0.1秒単位でスナップ
                value={range} 
                onChange={handleSliderChange}
                trackStyle={[{ backgroundColor: '#ff0000' }]}
                handleStyle={[{ borderColor: '#ff0000' }, { borderColor: '#ff0000' }]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              
              {/* 開始位置の微調整 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>START</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', margin: '5px 0' }}>
                  {formatTime(range[0])}
                </div>
                <div>
                  <button onClick={() => adjustRange(0, -0.1)} style={btnStyle}>-0.1s</button>
                  <button onClick={() => adjustRange(0, 0.1)} style={btnStyle}>+0.1s</button>
                </div>
              </div>

              <div style={{ color: '#888', fontWeight: 'bold' }}>〜</div>

              {/* 終了位置の微調整 */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#666' }}>END</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', fontFamily: 'monospace', margin: '5px 0' }}>
                  {formatTime(range[1])}
                </div>
                <div>
                  <button onClick={() => adjustRange(1, -0.1)} style={btnStyle}>-0.1s</button>
                  <button onClick={() => adjustRange(1, 0.1)} style={btnStyle}>+0.1s</button>
                </div>
              </div>
            </div>

            {/* ダウンロード実行ボタン（UIのみ・ロジックは次のステップ） */}
            <button 
              style={{
                width: '100%', padding: '15px', marginTop: '20px', 
                backgroundColor: '#ff0000', color: 'white', border: 'none', 
                borderRadius: '4px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer'
              }}
            >
              GIFを生成する ({formatTime(range[1] - range[0])})
            </button>
          </div>
        </>
      )}
    </div>
  )
}

const btnStyle = {
  padding: '4px 8px', margin: '0 4px', cursor: 'pointer',
  border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white'
}

export default App