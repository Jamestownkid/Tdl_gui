const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tdl', {
  run: (args) => ipcRenderer.invoke('run-tdl', args),
  stop: () => ipcRenderer.invoke('stop-tdl'),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFiles: () => ipcRenderer.invoke('select-files'),
  selectJson: () => ipcRenderer.invoke('select-json'),
  getDownloadsPath: () => ipcRenderer.invoke('get-downloads-path'),
  onOutput: (callback) => {
    ipcRenderer.on('tdl-output', (event, data) => callback(data));
  }
});

