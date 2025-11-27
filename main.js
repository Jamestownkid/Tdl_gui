const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

let mainWindow;
let currentProcess = null;

// Get tdl binary path
function getTdlPath() {
  // In development, look for tdl in parent directory or PATH
  // In production, it's bundled in resources
  if (app.isPackaged) {
    const resourcePath = process.resourcesPath;
    return path.join(resourcePath, 'tdl', os.platform() === 'win32' ? 'tdl.exe' : 'tdl');
  }
  // Development: assume tdl is in PATH or parent directory
  return os.platform() === 'win32' ? 'tdl.exe' : 'tdl';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    titleBarStyle: 'hiddenInset',
    frame: process.platform === 'darwin' ? true : true,
    backgroundColor: '#0a0a0f',
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (currentProcess) {
    currentProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Run tdl command
ipcMain.handle('run-tdl', async (event, args) => {
  return new Promise((resolve, reject) => {
    const tdlPath = getTdlPath();
    console.log('Running:', tdlPath, args);
    
    currentProcess = spawn(tdlPath, args, {
      cwd: app.getPath('downloads')
    });

    let output = '';
    let errorOutput = '';

    currentProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      mainWindow.webContents.send('tdl-output', text);
    });

    currentProcess.stderr.on('data', (data) => {
      const text = data.toString();
      errorOutput += text;
      mainWindow.webContents.send('tdl-output', text);
    });

    currentProcess.on('close', (code) => {
      currentProcess = null;
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, output: errorOutput || output, code });
      }
    });

    currentProcess.on('error', (err) => {
      currentProcess = null;
      reject(err.message);
    });
  });
});

// Stop current process
ipcMain.handle('stop-tdl', async () => {
  if (currentProcess) {
    currentProcess.kill('SIGINT');
    currentProcess = null;
    return { success: true };
  }
  return { success: false, message: 'No process running' };
});

// Select directory
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

// Select files
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections']
  });
  return result.filePaths || [];
});

// Select JSON file
ipcMain.handle('select-json', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });
  return result.filePaths[0] || null;
});

// Get downloads path
ipcMain.handle('get-downloads-path', async () => {
  return app.getPath('downloads');
});

