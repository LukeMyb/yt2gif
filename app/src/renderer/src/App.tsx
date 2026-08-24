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
    <div style={{ padding: '20px', fontFamily: 'sans-serif', minHeight: '100vh', backgroundColor: '#18181b', color: '#d4d4d8' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>yt2gif - 高精度切り抜きエディタ</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="YouTubeのURLを入力..." 
            value={url}
            onChange={handleUrlChange}
            style={{ 
              width: '100%', padding: '12px', fontSize: '16px', boxSizing: 'border-box',
              // bg-[#27272a] と text-white 相当
              backgroundColor: '#27272a', color: '#ffffff', 
              border: '1px solid #3f3f46', borderRadius: '6px',
              outline: 'none'
            }}
          />
        </div>

        {videoId && (
          <>
            <div style={{ marginBottom: '20px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #3f3f46', backgroundColor: '#000' }}>
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

            <div style={{ padding: '20px', backgroundColor: '#27272a', borderRadius: '8px', border: '1px solid #3f3f46' }}>
              <h3 style={{ marginTop: 0, color: '#ffffff' }}>切り抜き範囲の指定</h3>
              
              <div style={{ padding: '10px 15px', marginBottom: '20px' }}>
                <Slider 
                  range 
                  min={0} 
                  max={duration} 
                  step={0.1}
                  value={range} 
                  onChange={handleSliderChange}
                  // rc-sliderの色を調整
                  trackStyle={[{ backgroundColor: '#ef4444' }]}
                  handleStyle={[
                    { borderColor: '#ef4444', backgroundColor: '#ffffff', opacity: 1 }, 
                    { borderColor: '#ef4444', backgroundColor: '#ffffff', opacity: 1 }
                  ]}
                  railStyle={{ backgroundColor: '#3f3f46' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                style={{
                  width: '100%', padding: '15px', marginTop: '20px', 
                  backgroundColor: '#ef4444', color: 'white', border: 'none', 
                  borderRadius: '6px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                GIFを生成する ({formatTime(range[1] - range[0])})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const btnStyle = {
  padding: '6px 12px', margin: '0 4px', cursor: 'pointer',
  border: '1px solid #52525b', borderRadius: '4px', 
  backgroundColor: '#3f3f46', color: '#d4d4d8', // hover:bg-zinc-700 相当の色味
  fontWeight: 'bold'
}

export default App