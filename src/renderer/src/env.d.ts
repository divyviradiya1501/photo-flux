/// <reference types="vite/client" />

interface IPhotoAPI {
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

interface Window {
    api: IPhotoAPI;
}
