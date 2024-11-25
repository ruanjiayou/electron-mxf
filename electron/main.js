const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();

const is_dev = process.env.NODE_ENV === 'development';

// 定义ipcRenderer监听事件
ipcMain.on('setStore', (_, key, value) => {
  store.set(key, value)
})

ipcMain.on('getStore', (_, key) => {
  let value = store.get(key)
  _.returnValue = value || null
})

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('disable-software-rasterizer');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1080,
    height: 720,
    // titleBarStyle: "default", // mac隐藏导航栏
    // frame: false, // window隐藏导航栏
    // autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      webgl: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
  })
  ipcMain.on('setTitle', (event, title) => {
    const webContents = event.sender
    const w = BrowserWindow.fromWebContents(webContents)
    w.setTitle(title)
  })
  // 选择文件夹
  ipcMain.on('openDialog', (event) => {
    dialog.showOpenDialog(win, {
      properties: ['openDirectory']
    }).then((result) => {
      event.sender.send('selectedDirectory', result)
    })
  })
  // 搜索文件 
  ipcMain.handle('get-files-sorttime', async (event, dir, filename) => {
    const existed = fs.existsSync(dir);
    const results = [];
    if (existed) {
      const files = fs.readdirSync(dir, { encoding: 'utf-8' });
      files.filter(file => {
        file = file.toLowerCase();
        return file.includes(filename.toLowerCase()) && (is_dev || file.endsWith('.mxf'));
      }).forEach((file) => {
        results.push({ filename: file, mtime: fs.statSync(path.join(dir, file)).mtime })
      });
    }
    return results.sort((a, b) => b.mtime - a.mtime);
  })

  // 置顶
  win.setAlwaysOnTop(true)
  if (is_dev) {
    win.webContents.openDevTools({ mode: 'detach' })
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile('../build/index.html')
  }

}
app.whenReady().then(() => {

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
