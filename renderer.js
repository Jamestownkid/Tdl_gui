// Navigation
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    const pageId = item.dataset.page;
    
    navItems.forEach(nav => nav.classList.remove('active'));
    item.classList.add('active');
    
    pages.forEach(page => {
      page.classList.remove('active');
      if (page.id === `page-${pageId}`) {
        page.classList.add('active');
      }
    });
  });
});

// Output terminal
const output = document.getElementById('output');
const statusIndicator = document.getElementById('statusIndicator');

let waiting2FA = false;

function appendOutput(text) {
  output.textContent += text;
  output.scrollTop = output.scrollHeight;
  
  // Check if 2FA is being requested
  if (text.includes('2FA Password') || text.includes('Enter 2FA') || text.includes('SESSION_PASSWORD_NEEDED')) {
    waiting2FA = true;
    show2FAPrompt();
  }
}

function clearOutput() {
  output.textContent = '';
}

function setStatus(status, text) {
  statusIndicator.className = 'status-indicator ' + status;
  statusIndicator.querySelector('span').textContent = text;
}

function show2FAPrompt() {
  const pwd = prompt('Enter your 2FA password:');
  if (pwd) {
    window.tdl.sendInput(pwd);
    appendOutput('\n[2FA password submitted]\n');
  }
  waiting2FA = false;
}

// Listen for tdl output
window.tdl.onOutput((data) => {
  appendOutput(data);
});

// Upload files state
let uploadFiles = [];

// ============ LOGIN ============

async function loginQR() {
  const ns = document.getElementById('loginNamespace').value;
  const args = ['login', '-T', 'qr'];
  if (ns) args.push('-n', ns);
  
  clearOutput();
  setStatus('running', 'Logging in...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Logged in');
      appendOutput('\n✓ Login successful!\n');
    } else {
      setStatus('error', 'Login failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

async function loginCode() {
  const ns = document.getElementById('loginNamespace').value;
  const args = ['login', '-T', 'code'];
  if (ns) args.push('-n', ns);
  
  clearOutput();
  setStatus('running', 'Logging in...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  appendOutput('Note: Phone/code login requires terminal interaction.\n');
  appendOutput('Please use QR login or Desktop login for GUI.\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Logged in');
      appendOutput('\n✓ Login successful!\n');
    } else {
      setStatus('error', 'Login failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

async function loginDesktop() {
  const ns = document.getElementById('loginNamespace').value;
  const args = ['login'];
  if (ns) args.push('-n', ns);
  
  clearOutput();
  setStatus('running', 'Importing session...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Logged in');
      appendOutput('\n✓ Session imported successfully!\n');
    } else {
      setStatus('error', 'Import failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

// ============ DOWNLOAD ============

async function selectDlDir() {
  const dir = await window.tdl.selectDirectory();
  if (dir) document.getElementById('dlDir').value = dir;
}

async function selectDlJson() {
  const file = await window.tdl.selectJson();
  if (file) document.getElementById('dlJson').value = file;
}

async function startDownload() {
  const urls = document.getElementById('dlUrls').value.trim().split('\n').filter(u => u.trim());
  const dir = document.getElementById('dlDir').value.trim();
  const json = document.getElementById('dlJson').value.trim();
  const takeout = document.getElementById('dlTakeout').checked;
  const skipSame = document.getElementById('dlSkipSame').checked;
  const desc = document.getElementById('dlDesc').checked;
  const group = document.getElementById('dlGroup').checked;
  const threads = document.getElementById('dlThreads').value;
  const limit = document.getElementById('dlLimit').value;
  const include = document.getElementById('dlInclude').value.trim();
  const exclude = document.getElementById('dlExclude').value.trim();
  
  if (urls.length === 0 && !json) {
    appendOutput('✗ Please enter at least one URL or select a JSON file\n');
    return;
  }
  
  const args = ['dl'];
  
  urls.forEach(url => {
    if (url.trim()) args.push('-u', url.trim());
  });
  
  if (json) args.push('-f', json);
  if (dir) args.push('-d', dir);
  if (takeout) args.push('--takeout');
  if (skipSame) args.push('--skip-same');
  if (desc) args.push('--desc');
  if (group) args.push('--group');
  if (threads) args.push('-t', threads);
  if (limit) args.push('-l', limit);
  if (include) args.push('-i', include);
  if (exclude) args.push('-e', exclude);
  
  clearOutput();
  setStatus('running', 'Downloading...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Ready');
      appendOutput('\n✓ Download complete!\n');
    } else {
      setStatus('error', 'Download failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

// ============ UPLOAD ============

async function selectUploadFiles() {
  const files = await window.tdl.selectFiles();
  if (files && files.length > 0) {
    uploadFiles = files;
    document.getElementById('uploadFilesList').textContent = 
      files.length === 1 ? files[0].split('/').pop() : `${files.length} files selected`;
  }
}

async function startUpload() {
  if (uploadFiles.length === 0) {
    appendOutput('✗ Please select files to upload\n');
    return;
  }
  
  const chat = document.getElementById('upChat').value.trim();
  const topic = document.getElementById('upTopic').value;
  const photo = document.getElementById('upPhoto').checked;
  const del = document.getElementById('upDelete').checked;
  const threads = document.getElementById('upThreads').value;
  const limit = document.getElementById('upLimit').value;
  
  const args = ['up'];
  
  uploadFiles.forEach(file => {
    args.push('-p', file);
  });
  
  if (chat) args.push('-c', chat);
  if (topic && topic !== '0') args.push('--topic', topic);
  if (photo) args.push('--photo');
  if (del) args.push('--rm');
  if (threads) args.push('-t', threads);
  if (limit) args.push('-l', limit);
  
  clearOutput();
  setStatus('running', 'Uploading...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Ready');
      appendOutput('\n✓ Upload complete!\n');
      uploadFiles = [];
      document.getElementById('uploadFilesList').textContent = 'No files selected';
    } else {
      setStatus('error', 'Upload failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

// ============ FORWARD ============

async function selectFwdJson() {
  const file = await window.tdl.selectJson();
  if (file) document.getElementById('fwdJson').value = file;
}

async function startForward() {
  const fromLinks = document.getElementById('fwdFrom').value.trim().split('\n').filter(u => u.trim());
  const json = document.getElementById('fwdJson').value.trim();
  const to = document.getElementById('fwdTo').value.trim();
  const mode = document.getElementById('fwdMode').value;
  const silent = document.getElementById('fwdSilent').checked;
  const dry = document.getElementById('fwdDry').checked;
  const desc = document.getElementById('fwdDesc').checked;
  
  if (fromLinks.length === 0 && !json) {
    appendOutput('✗ Please enter source links or select a JSON file\n');
    return;
  }
  
  const args = ['forward'];
  
  fromLinks.forEach(link => {
    if (link.trim()) args.push('--from', link.trim());
  });
  
  if (json) args.push('--from', json);
  if (to) args.push('--to', to);
  args.push('--mode', mode);
  if (silent) args.push('--silent');
  if (dry) args.push('--dry-run');
  if (desc) args.push('--desc');
  
  clearOutput();
  setStatus('running', 'Forwarding...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Ready');
      appendOutput('\n✓ Forward complete!\n');
    } else {
      setStatus('error', 'Forward failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

// ============ EXPORT ============

async function selectExpDir() {
  const dir = await window.tdl.selectDirectory();
  if (dir) document.getElementById('expOutput').value = dir + '/tdl-export.json';
}

async function startExport() {
  const chat = document.getElementById('expChat').value.trim();
  const outputFile = document.getElementById('expOutput').value.trim();
  const type = document.getElementById('expType').value;
  const range = document.getElementById('expRange').value.trim();
  const topic = document.getElementById('expTopic').value;
  const content = document.getElementById('expContent').checked;
  const all = document.getElementById('expAll').checked;
  const raw = document.getElementById('expRaw').checked;
  
  if (!chat) {
    appendOutput('✗ Please enter a chat identifier\n');
    return;
  }
  
  const args = ['chat', 'export', '-c', chat];
  
  if (outputFile) args.push('-o', outputFile);
  if (type && range) {
    args.push('-T', type);
    args.push('-i', range);
  }
  if (topic && topic !== '0') args.push('--topic', topic);
  if (content) args.push('--with-content');
  if (all) args.push('--all');
  if (raw) args.push('--raw');
  
  clearOutput();
  setStatus('running', 'Exporting...');
  appendOutput('$ tdl ' + args.join(' ') + '\n\n');
  
  try {
    const result = await window.tdl.run(args);
    if (result.success) {
      setStatus('', 'Ready');
      appendOutput('\n✓ Export complete!\n');
    } else {
      setStatus('error', 'Export failed');
    }
  } catch (err) {
    setStatus('error', 'Error');
    appendOutput('\n✗ Error: ' + err + '\n');
  }
}

// ============ STOP ============

async function stopProcess() {
  const result = await window.tdl.stop();
  if (result.success) {
    appendOutput('\n⚠ Process stopped by user\n');
    setStatus('', 'Ready');
  }
}

// Initialize
(async () => {
  const downloadsPath = await window.tdl.getDownloadsPath();
  document.getElementById('dlDir').placeholder = downloadsPath;
})();

