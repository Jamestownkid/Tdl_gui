const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const os = require('os');

let mainWindow;
let ptyProcess = null;

// Try to load node-pty for proper terminal emulation
let pty;
try {
  pty = require('node-pty');
} catch (e) {
  console.error('node-pty not found, falling back to spawn');
  pty = null;
}

// Fallback to child_process if pty not available
const { spawn } = require('child_process');

function getTdlPath() {
  if (app.isPackaged) {
    const resourcePath = process.resourcesPath;
    return path.join(resourcePath, 'tdl', os.platform() === 'win32' ? 'tdl.exe' : 'tdl');
  }
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
    frame: true,
    backgroundColor: '#0a0a0f',
    show: false
  });

  mainWindow.loadFile('index.html');
  
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (ptyProcess) {
    ptyProcess.kill();
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

// Run tdl command with PTY support for interactive commands
ipcMain.handle('run-tdl', async (event, args) => {
  return new Promise((resolve, reject) => {
    const tdlPath = getTdlPath();
    console.log('Running:', tdlPath, args);

    let output = '';

    if (pty) {
      // Use PTY for proper terminal emulation (QR codes, interactive prompts)
      const shell = os.platform() === 'win32' ? 'cmd.exe' : 'bash';
      const shellArgs = os.platform() === 'win32' 
        ? ['/c', tdlPath, ...args]
        : ['-c', `"${tdlPath}" ${args.map(a => `"${a}"`).join(' ')}`];

      ptyProcess = pty.spawn(shell, shellArgs, {
        name: 'xterm-256color',
        cols: 120,
        rows: 40,
        cwd: app.getPath('downloads'),
        env: process.env
      });

      ptyProcess.onData((data) => {
        output += data;
        // Strip some escape codes for cleaner display, but keep the QR
        const cleaned = data
          .replace(/\x1b\[\?25[hl]/g, '')  // hide/show cursor
          .replace(/\x1b\[2K/g, '')         // erase line (keep for QR refresh)
          .replace(/\x1b\[K/g, '');         // erase to end
        mainWindow.webContents.send('tdl-output', cleaned);
      });

      ptyProcess.onExit(({ exitCode }) => {
        ptyProcess = null;
        resolve({ success: exitCode === 0, output, code: exitCode });
      });

    } else {
      // Fallback without PTY - won't work well for interactive commands
      const proc = spawn(tdlPath, args, {
        cwd: app.getPath('downloads'),
        env: { ...process.env, TERM: 'xterm-256color' }
      });

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        mainWindow.webContents.send('tdl-output', text);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        output += text;
        mainWindow.webContents.send('tdl-output', text);
      });

      proc.on('close', (code) => {
        resolve({ success: code === 0, output, code });
      });

      proc.on('error', (err) => {
        reject(err.message);
      });
    }
  });
});

// Send input to running PTY process (for 2FA password, etc)
ipcMain.handle('send-input', async (event, text) => {
  if (ptyProcess) {
    ptyProcess.write(text + '\r');
    return { success: true };
  }
  return { success: false, message: 'No process running' };
});

// Stop current process
ipcMain.handle('stop-tdl', async () => {
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
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
