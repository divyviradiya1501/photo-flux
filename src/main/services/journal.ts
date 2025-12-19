import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

export type OperationType = 'MOVE' | 'COPY';
export type OperationStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERTED';

export interface JournalEntry {
    id: string; // Unique ID for this operation
    timestamp: number;
    type: OperationType;
    sourcePath: string;
    targetPath: string;
    status: OperationStatus;
    error?: string;
    fileHash?: string;
}

export interface Session {
    id: string;
    timestamp: number;
    logPath: string;
}

export class JournalService {
    private currentSessionId: string;
    private logPath: string;

    constructor() {
        this.currentSessionId = uuidv4();
        const userDataPath = app.getPath('userData');
        const logsDir = path.join(userDataPath, 'sessions');

        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        this.logPath = path.join(logsDir, `session_${Date.now()}_${this.currentSessionId}.jsonl`);
        console.log(`Journal initialized at: ${this.logPath}`);
    }

    // Atomic write to append-only log
    public log(entry: Omit<JournalEntry, 'timestamp'>): void {
        const fullEntry: JournalEntry = {
            ...entry,
            timestamp: Date.now()
        };

        // Synchronous append to ensure it's on disk before we proceed
        try {
            fs.appendFileSync(this.logPath, JSON.stringify(fullEntry) + '\n');
        } catch (err) {
            console.error('CRITICAL: Failed to write to journal', err);
            throw new Error('Journal Write Failed - Safety Halted');
        }
    }

    public getSessionPath(): string {
        return this.logPath;
    }

    public getSessionLogs(): string[] {
        const userDataPath = app.getPath('userData');
        const logsDir = path.join(userDataPath, 'sessions');
        if (!fs.existsSync(logsDir)) return [];
        return fs.readdirSync(logsDir).filter(f => f.endsWith('.jsonl')).map(f => path.join(logsDir, f));
    }

    public readEntries(logPath: string): JournalEntry[] {
        if (!fs.existsSync(logPath)) return [];
        const content = fs.readFileSync(logPath, 'utf-8');
        const lines = content.split('\n').filter(line => line.trim().length > 0);
        return lines.map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return null;
            }
        }).filter(e => e !== null) as JournalEntry[];
    }
}
