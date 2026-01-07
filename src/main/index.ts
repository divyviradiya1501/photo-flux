import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, extname } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import { JournalService } from './services/journal'
import { Planner, PlanItem } from './services/planner'
import { FileOperationService } from './services/fileOps'
import { RevertService } from './services/revert'

// Services
let journalService: JournalService;
let fileOpsService: FileOperationService;
let planner: Planner;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    frame: false, // Fix 9: Frameless
    transparent: true, // Fix 9: Transparent for glass radius
    backgroundColor: '#00000000',
    ...(process.platform === 'linux' ? { icon: join(__dirname, '../../build/icon.png') } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  // Fix 9: Window Controls Handlers
  ipcMain.on('window:minimize', () => mainWindow.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.on('window:close', () => mainWindow.close());

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.photoorganizer.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Services
  journalService = new JournalService();
  fileOpsService = new FileOperationService(journalService);

  // IPC HANDLERS

  // 1. Directory Selection
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
  });

  // 2. Scanning (Worker)
  ipcMain.on('scan:start', (event, directory) => {
    // In valid electron-vite build, we need to locate the worker file.
    // For dev: it might be in different place. 
    // We'll fallback to in-process if worker fails? 
    // Or simpler: We'll implement a simple async walker for now to guarantee functionality
    // if worker path resolution is tricky in this environment. 

    // START WORKER
    // Heuristic for worker path
    let workerPath = join(__dirname, './workers/scanner.js');
    if (!fs.existsSync(workerPath)) {
      // Try dev path? 
      workerPath = join(__dirname, '../../src/main/workers/scanner.ts'); // raw ts in dev? node can't run ts directly without loader
      // If we are in dev, vite handles it?
      // Let's assume the build outputs it to the same relative structure.
    }

    // Checking if file exists is tricky with bundlers. 
    // For this environment, I'll implement a fallback in-process scanner
    // to strictly ensure "Scanning" works.
    scanDirectoryInProcess(directory, event.sender);
  });

  // 3. Planning
  ipcMain.handle('plan:create', async (_, { files, targetDir, organizationMode, renameMode }) => {
    planner = new Planner(
      targetDir,
      organizationMode || 'year-month',
      renameMode || 'original'
    );
    const results: PlanItem[] = [];
    const window = BrowserWindow.getAllWindows()[0];

    // Parallelize with chunks to avoid overwhelming the system
    const CHUNK_SIZE = 50;
    for (let i = 0; i < files.length; i += CHUNK_SIZE) {
      const chunk = files.slice(i, i + CHUNK_SIZE);
      const chunkPromises = chunk.map((file: string) => planner.createPlanForFile(file).catch(err => {
        console.error(`Metadata error for ${file}:`, err);
        return { sourcePath: file, targetPath: '', status: 'ERROR', reason: 'Metadata failed' } as PlanItem;
      }));

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      if (window) {
        window.webContents.send('plan:progress', {
          current: Math.min(i + CHUNK_SIZE, files.length),
          total: files.length
        });
      }
    }

    return results;
  });

  // 4. Execution
  ipcMain.handle('execute:run', async (_, { plan, operationMode }: { plan: PlanItem[], operationMode: 'copy' | 'move' }) => {
    let success = 0;
    let failed = 0;

    // Ensure we have a valid operation mode
    const mode: 'copy' | 'move' = operationMode === 'move' ? 'move' : 'copy';
    console.log(`Executing with operation mode: ${mode}`);

    const window = BrowserWindow.getAllWindows()[0];

    for (let i = 0; i < plan.length; i++) {
      const item = plan[i];
      if (item.status === 'READY') {
        const result = fileOpsService.safeTransfer(
          item.sourcePath,
          item.targetPath,
          mode
        );
        if (result) success++;
        else failed++;
      }

      // Update progress every 5 updates
      if (i % 5 === 0 && window) {
        window.webContents.send('execute:progress', {
          current: i,
          total: plan.length,
          success,
          failed,
          lastFile: item.sourcePath
        });
      }
    }

    // Final update
    if (window) {
      window.webContents.send('execute:progress', {
        current: plan.length,
        total: plan.length,
        success,
        failed
      });
    }

    console.log(`Execution complete: ${success} success, ${failed} failed`);
    return { success, failed };
  });

  // 5. Revert
  ipcMain.handle('revert:session', async (_, sessionIdOrPath) => {
    const srv = new RevertService(journalService);
    // If sessionIdOrPath is a full path, use it. otherwise find it?
    // UI will pass full path preferably.
    return srv.revertSession(sessionIdOrPath);
  });

  ipcMain.handle('session:list', () => {
    return journalService.getSessionLogs();
  });

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function scanDirectoryInProcess(dir: string, sender: Electron.WebContents) {
  const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tiff', '.bmp', '.webp', '.gif', '.svg', '.psd', '.cr2', '.nef', '.arw', '.dng']);
  const FORBIDDEN_DIRS = new Set([
    'System Volume Information', '$RECYCLE.BIN', 'node_modules',
    'Windows', 'Program Files', 'Program Files (x86)', 'AppData',
    'WindowsApps', 'ProgramData', 'Temp'
  ]);

  // Also skip folders that look like they were created by this app
  const ORGANIZED_PATTERNS = ['_Organized', '_organized', 'Organized', 'organized'];

  let count = 0;

  function shouldSkipDir(dirName: string): boolean {
    // Skip hidden directories
    if (dirName.startsWith('.')) return true;
    // Skip forbidden system directories
    if (FORBIDDEN_DIRS.has(dirName)) return true;
    // Skip directories that look like organized output
    for (const pattern of ORGANIZED_PATTERNS) {
      if (dirName.endsWith(pattern) || dirName.includes(pattern)) {
        return true;
      }
    }
    return false;
  }

  function walk(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (!shouldSkipDir(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          const actualExt = extname(entry.name).toLowerCase();
          if (IMAGE_EXTENSIONS.has(actualExt)) {
            sender.send('scan:result', fullPath);
            count++;
          }
        }
      }
    } catch (err) {
      console.error(`Scanner error in ${currentDir}:`, err);
    }
  }

  try {
    console.log(`Starting scan of: ${dir}`);
    walk(dir);
    console.log(`Scan finished. Found ${count} photos.`);
    sender.send('scan:done');
  } catch (err) {
    console.error(`Root scan error: ${err}`);
    sender.send('scan:error', String(err));
  }
}
