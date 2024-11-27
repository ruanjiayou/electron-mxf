const { app, BrowserWindow, ipcMain, dialog, screen, Menu } = require('electron')
const fs = require('node:fs')
const path = require('node:path')
const Store = require('electron-store');
const store = new Store();
const { spawn, execSync } = require('child_process');
const psTree = require('ps-tree');
const CONST = require('../src/const.js');

const is_dev = process.env.NODE_ENV === 'development';
let vlcProcess;
let half_width = 720;
let half_height = 480;

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
  const Size = screen.getPrimaryDisplay().workAreaSize;
  const width = Math.floor(Size.width / 2);
  half_width = width;
  half_height = Math.floor(Size.height / 2);
  const win = new BrowserWindow({
    width: half_width,
    height: half_height,
    // resizable: false,
    // titleBarStyle: "default", // mac隐藏导航栏
    // frame: false, // window隐藏导航栏
    // autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      webgl: false,
      webSecurity: false,
      preload: path.join(__dirname, 'preload.js')
    },
  })
  ipcMain.on(CONST.EVENT.SetTitle, (event, title) => {
    const webContents = event.sender
    const w = BrowserWindow.fromWebContents(webContents)
    w.setTitle(title)
  })
  // 选择文件夹
  ipcMain.handle(CONST.EVENT.OpenDialog, async (event) => {
    return new Promise((resolve) => {
      dialog.showOpenDialog(win, {
        properties: ['openDirectory']
      }).then((result) => {
        resolve(result);
      })
    })

  })
  // 搜索文件 
  ipcMain.handle(CONST.EVENT.GetFilesSortByTime, async (event, dir, filename, suffix) => {
    const existed = fs.existsSync(dir);
    const results = [];
    if (existed) {
      const files = fs.readdirSync(dir, { encoding: 'utf-8' });
      files.filter(file => {
        file = file.toLowerCase();
        return file.includes(filename.toLowerCase()) && (!suffix || file.endsWith(suffix));
      }).forEach((file) => {
        results.push({ filename: file, mtime: fs.statSync(path.join(dir, file)).mtime })
      });
    }
    return results.sort((a, b) => b.mtime - a.mtime);
  })

  ipcMain.handle(CONST.EVENT.StartVlc, (event, filepath) => {
    startVLCInElectron(win, filepath);
  });

  ipcMain.handle(CONST.EVENT.StopVlc, async () => {
    return stopVLC();
  });
  ipcMain.on(CONST.EVENT.ShowContextMenu, (event) => {
    const show_dir = store.get(CONST.STORE.SHOW_DIR) || false;
    const show_video = store.get(CONST.STORE.SHOW_VIDEO) || false;
    const template = [
      {
        label: '显示文件夹设置',
        type: 'checkbox',
        checked: show_dir,
        click: (e) => {
          event.sender.send(CONST.EVENT.ReceiveCommand, CONST.STORE.SHOW_DIR, e.checked);
          store.set(CONST.STORE.SHOW_DIR, e.checked);
        }
      },
      { type: 'separator' },
      {
        label: '显示视频框',
        type: 'checkbox',
        checked: show_video,
        click: (e) => {
          event.sender.send(CONST.EVENT.ReceiveCommand, CONST.STORE.SHOW_VIDEO, e.checked);
          store.set(CONST.STORE.SHOW_VIDEO, e.checked);
        }
      },
      { type: 'separator' },
      {
        label: '关闭程序',
        checked: show_video,
        click: () => {
          app.quit();
        }
      },
    ]
    const menu = Menu.buildFromTemplate(template)
    menu.popup({ window: BrowserWindow.fromWebContents(event.sender) })
  });


  // 置顶
  win.setAlwaysOnTop(true)
  win.setPosition(width, 0);
  // Menu.setApplicationMenu(null);
  // const menuBar = [
  //   {
  //     label: '设置',
  //     submenu: [
  //       { label: '显示文件夹' },
  //       { label: '显示视频框' },
  //     ]
  //   }
  // ];
  // // 构建菜单项
  // const menu = Menu.buildFromTemplate(menuBar);
  // // 设置一个顶部菜单栏
  // Menu.setApplicationMenu(menu);
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
  // 启动 VLC 并嵌入窗口
  const command = process.platform === 'win32'
    ? `"${path.normalize('C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe')}" --no-qt-fs --qt-start-minimized --width=${half_width} --video-x=0 --video-y=0 --aspect-ratio=16:9 --zoom=0.5 --video-on-top --video-title="Embedded VLC" --qt-minimal-view ${filepath}`
    : `/Applications/VLC.app/Contents/MacOS/VLC --width=${half_width} --video-x=0 --video-y=0 --aspect-ratio=16:9 --zoom=0.5 --video-on-top ${filepath}`;
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
          console.error(`Failed to kill process ${pid}:`, error.message);
        }
      }
      resolve(true);
    });
  });

}