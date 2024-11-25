const { contextBridge, ipcRenderer, dialog } = require('electron')

contextBridge.exposeInMainWorld('electron', {
  setStoreValue: (key, value) => {
    ipcRenderer.send("setStore", key, value)
  },
  getStoreValue: (key) => {
    const resp = ipcRenderer.sendSync("getStore", key)
    return resp
  },
  setTitle: (title) => {
    ipcRenderer.send('setTitle', title)
  },
  openDialog: async () => {
    return new Promise((resolve) => {
      ipcRenderer.send('openDialog', {
        properties: ['openDirectory'],
        title: '选择文件夹',
      });
      ipcRenderer.once('selectedDirectory', function (e, result) {
        resolve(result);
      })
    })
  },
  getFilesSortTime: async (dir, filename, suffix) => await ipcRenderer.invoke('get-files-sorttime', dir, filename, suffix),
  startVLC: (filepath) => {
    ipcRenderer.send('start-vlc', filepath)
  },
  stopVLC: async () => await ipcRenderer.invoke('stop-vlc'),
});

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // 除函数之外，我们也可以暴露变量
})