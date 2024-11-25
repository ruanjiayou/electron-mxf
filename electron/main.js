const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();
const { spawn, execSync } = require('child_process');
const psTree = require('ps-tree');

const is_dev = process.env.NODE_ENV === 'development';
let vlcProcess;

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
    resizable: false,
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

  ipcMain.on('start-vlc', (event, filepath) => {
    startVLCInElectron(win, filepath);
  });

  ipcMain.handle('stop-vlc', async () => {
    return stopVLC();
  });

  // 置顶
  win.setAlwaysOnTop(true)
  if (is_dev) {
    win.webContents.openDevTools({ mode: 'detach' })
    win.loadURL('http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }

}
app.whenReady().then(() => {

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


function startVLCInElectron(parentWindow, filepath) {
  console.log(filepath)
  // 获取 Electron 窗口的句柄 (Windows)
  const electronWindowHandle = parentWindow.getNativeWindowHandle();


  // 启动 VLC 并嵌入窗口
  const command = process.platform === 'win32'
    ? `vlc --no-qt-fs --qt-start-minimized --width=720 --height=480 --video-x=0 --video-y=0 --video-title="Embedded VLC" --qt-minimal-view`
    : `/Applications/VLC.app/Contents/MacOS/VLC --width=720 --height=480 --video-x=100 --video-y=100 ${filepath}`;
  vlcProcess = spawn(command, {
    shell: true,
    detached: true,
    stdio: 'ignore',
  });
  vlcProcess.unref();
}

async function stopVLC() {
  if (vlcProcess) {
    await killProcessTree(vlcProcess.pid);
    vlcProcess = null;
  }
  // 'killall VLC' vlcProcess.kill() 都没用
  // const result = execSync('killall VLC');
  // console.log(result.toString())
}

// 递归杀死所有子进程
async function killProcessTree(pid) {
  return new Promise((resolve, reject) => {
    psTree(pid, (err, children) => {
      if (err) {
        console.error('Failed to fetch process tree:', err);

        return resolve(false);
      }

      // 获取所有子进程的 PID
      const pids = children.map(child => child.PID);
      pids.push(pid); // 添加父进程 PID

      // 逐个杀死进程
      for (const pid of pids) {
        try {
          process.kill(pid, 'SIGKILL');
          console.log(`Killed process with PID: ${pid}`);
        } catch (error) {
          console.error(`Failed to kill process ${pid}:`, error);
        }
      }
      resolve(true);
    });
  });

}