import { useState, useRef } from 'react'

function App() {
  const [url, setUrl] = useState('')
  const [videoId, setVideoId] = useState<string | null>(null)
  
  // YouTubeのURLからVideoIDを抽出する簡易関数
  const extractVideoId = (inputUrl: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = inputUrl.match(regExp)
    if (match && match[2].length === 11) {
      setVideoId(match[2])
      console.log("抽出成功: ", match[2])
    } else {
      setVideoId(null)
      console.log("抽出失敗: マッチしませんでした")
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    extractVideoId(newUrl)
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h2>yt2gif</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="YouTubeのURLを入力..." 
          value={url}
          onChange={handleUrlChange}
          style={{ width: '100%', padding: '10px', fontSize: '16px' }}
        />
      </div>

      {videoId && (
        <div style={{ marginBottom: '20px' }}>
          {/* YouTube動画の埋め込み */}
          <iframe 
            width="100%" 
            height="315" 
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}

      {videoId && (
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span>開始: <input type="text" placeholder="00:00.000" style={{ width: '80px' }} /></span>
          <span>終了: <input type="text" placeholder="00:05.000" style={{ width: '80px' }} /></span>
          <button style={{ padding: '10px 20px', cursor: 'pointer' }}>現在の位置を取得</button>
        </div>
      )}
    </div>
  )
}

export default App