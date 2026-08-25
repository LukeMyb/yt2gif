import { app, shell, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

import { exec } from 'child_process'
import * as path from 'path'
import * as fs from 'fs'
import * as http from 'http'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: false
    }
  })

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    // サーバーから送られてくるヘッダーの中から CSP を削除してElectronに渡す
    const responseHeaders = { ...details.responseHeaders }
    delete responseHeaders['content-security-policy']
    delete responseHeaders['Content-Security-Policy']

    callback({
      cancel: false,
      responseHeaders: responseHeaders
    })
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.webContents.openDevTools()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    const server = http.createServer((req, res) => {
      let urlPath = req.url?.split('?')[0] || '/'
      if (urlPath === '/') urlPath = '/index.html'
      
      const filePath = path.join(__dirname, '../renderer', urlPath)
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath)
        let contentType = 'text/html'
        if (ext === '.js') contentType = 'text/javascript'
        else if (ext === '.css') contentType = 'text/css'
        else if (ext === '.svg') contentType = 'image/svg+xml'
        
        res.writeHead(200, { 'Content-Type': contentType })
        fs.createReadStream(filePath).pipe(res)
      } else {
        res.writeHead(404)
        res.end()
      }
    })
    
    server.listen(0, 'localhost', () => {
      const addr = server.address()
      if (addr && typeof addr !== 'string') {
        mainWindow.loadURL(`http://localhost:${addr.port}`)
      }
    })
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.yt2gif.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ReactからのGIF生成リクエストを受け取る処理
  ipcMain.on('generate-gif', (event, args) => {
    const { url, startTime, endTime } = args
    const duration = endTime - startTime

    // 開発中とビルド後（.exe）で基準となるパスを自動で切り替える
    const baseDir = app.isPackaged
      ? path.dirname(app.getPath('exe'))  // ビルド後：exe本体が置かれているフォルダ
      : path.join(process.cwd(), '..')    // 開発中：プロジェクトルート（appの1つ上）
    
    // 保存先フォルダの作成
    const outputDir = path.join(baseDir, 'output')
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }
    
    // 実行ファイル（exe）の絶対パスを指定
    const ytdlpPath = path.join(baseDir, 'bin', 'yt-dlp.exe')
    const ffmpegPath = path.join(baseDir, 'bin', 'ffmpeg.exe')

    // 出力ファイル名の決定
    const timestamp = new Date().getTime()
    const outputPath = path.join(outputDir, `output_${timestamp}.gif`)
    
    console.log('[yt2gif] Starting GIF generation...')
    
    // yt-dlpのコマンド（パスをダブルクォーテーションで囲んで直接実行）
    const ytdlpCommand = `"${ytdlpPath}" -g -f "bestvideo[ext=mp4]/best" "${url}"`
    
    exec(ytdlpCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('[yt2gif] yt-dlp Error:', stderr)
        event.reply('generate-gif-complete', { success: false, error: stderr })
        return
      }
      
      // ストリームURLを抽出
      const streamUrl = stdout.trim().split('\n')[0]
      console.log('[yt2gif] Stream URL fetched. Converting to GIF...')
      
      // ffmpegのコマンド（パスを直接指定）
      const ffmpegCommand = `"${ffmpegPath}" -ss ${startTime} -i "${streamUrl}" -t ${duration} -vf "fps=15,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -y "${outputPath}"`
      
      exec(ffmpegCommand, (ffError, _ffStdout, ffStderr) => {
        if (ffError) {
          console.error('[yt2gif] ffmpeg Error:', ffStderr)
          event.reply('generate-gif-complete', { success: false, error: ffStderr })
          return
        }
        
        console.log('[yt2gif] GIF generation completed!')
        
        // 完了後、エクスプローラーで保存先のフォルダを自動的に開く
        shell.showItemInFolder(outputPath)
        event.reply('generate-gif-complete', { success: true })
      })
    })
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
