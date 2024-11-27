const { contextBridge, ipcRenderer, dialog } = require('electron');
const CONST = require('./const.js');

contextBridge.exposeInMainWorld('electron', {
  setStoreValue: (key, value) => {
    ipcRenderer.send("setStore", key, value)
  },
  getStoreValue: (key) => {
    const resp = ipcRenderer.sendSync("getStore", key)
    return resp
  },
  [CONST.EVENT.SetTitle]: async (title) => await ipcRenderer.invoke(CONST.EVENT.SetTitle, title),
  [CONST.EVENT.OpenDialog]: async () => await ipcRenderer.invoke(CONST.EVENT.OpenDialog),
  [CONST.EVENT.GetFilesSortByTime]: async (dir, filename, suffix) => await ipcRenderer.invoke(CONST.EVENT.GetFilesSortByTime, dir, filename, suffix),
  [CONST.EVENT.StartVlc]: async (filepath) => await ipcRenderer.invoke(CONST.EVENT.StartVlc, filepath),
  [CONST.EVENT.StopVlc]: async () => await ipcRenderer.invoke(CONST.EVENT.StopVlc),
});

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
  // 除函数之外，我们也可以暴露变量
})

window.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  ipcRenderer.send(CONST.EVENT.ShowContextMenu)
})

ipcRenderer.on(CONST.EVENT.ReceiveCommand, (e, command, value) => {
  window.postMessage(JSON.stringify({ command, value }), '*')
})