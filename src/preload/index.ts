import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface IPhotoAPI {
    openDirectory: () => Promise<string | null>;
    startScan: (dir: string) => void;
    onScanResult: (callback: (path: string) => void) => void;
    onScanDone: (callback: () => void) => void;
    onScanError: (callback: (err: string) => void) => void;
    onPlanProgress: (callback: (data: { current: number, total: number }) => void) => void;

    createPlan: (files: string[], targetDir: string, organizationMode?: 'year' | 'year-month', renameMode?: 'original' | 'date-prefix') => Promise<any[]>;
    executePlan: (plan: any[], operationMode?: 'copy' | 'move') => Promise<{ success: number, failed: number }>;
    onExecuteProgress: (callback: (data: any) => void) => void;

    listSessions: () => Promise<string[]>;
    revertSession: (path: string) => Promise<any>;
    removeScanListeners: () => void;
    windowControl: (action: 'minimize' | 'maximize' | 'close') => void;
}

const api: IPhotoAPI = {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
    startScan: (dir) => ipcRenderer.send('scan:start', dir),
    onScanResult: (callback) => ipcRenderer.on('scan:result', (_, path) => callback(path)),
    onScanDone: (callback) => ipcRenderer.on('scan:done', () => callback()),
    onScanError: (callback) => ipcRenderer.on('scan:error', (_, err) => callback(err)),
    onPlanProgress: (callback) => ipcRenderer.on('plan:progress', (_, data) => callback(data)),

    createPlan: (files, targetDir, organizationMode, renameMode) => ipcRenderer.invoke('plan:create', { files, targetDir, organizationMode, renameMode }),
    executePlan: (plan, operationMode) => ipcRenderer.invoke('execute:run', { plan, operationMode }),
    onExecuteProgress: (callback) => ipcRenderer.on('execute:progress', (_, data) => callback(data)),

    listSessions: () => ipcRenderer.invoke('session:list'),
    revertSession: (path) => ipcRenderer.invoke('revert:session', path),
    removeScanListeners: () => {
        ipcRenderer.removeAllListeners('scan:result');
        ipcRenderer.removeAllListeners('scan:done');
        ipcRenderer.removeAllListeners('scan:error');
    },
    windowControl: (action: string) => ipcRenderer.send(`window:${action}`)
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore
    window.electron = electronAPI
    // @ts-ignore
    window.api = api
}
