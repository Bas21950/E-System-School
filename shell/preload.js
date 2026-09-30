const { contextBridge, ipcRenderer } = require('electron');

const updateChannels = ['update:idle', 'update:checking', 'update:available', 'update:progress', 'update:downloaded', 'update:error'];

contextBridge.exposeInMainWorld('electron', {
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  selectReceiptDirectory: () => ipcRenderer.invoke('select-receipt-directory'),
  getUpdateState: () => ipcRenderer.invoke('update:get-state'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  onUpdate: (channel, callback) => {
    if (!updateChannels.includes(channel) || typeof callback !== 'function') return () => {};
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  },
});
