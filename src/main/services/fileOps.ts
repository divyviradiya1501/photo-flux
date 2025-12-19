import * as fs from 'fs';
import * as path from 'path';
import { JournalService } from './journal';
import { v4 as uuidv4 } from 'uuid';

export class FileOperationService {
    private journal: JournalService;

    constructor(journal: JournalService) {
        this.journal = journal;
    }

    public safeTransfer(source: string, target: string, mode: 'copy' | 'move', hash?: string): boolean {
        const opId = uuidv4();
        const type = mode === 'copy' ? 'COPY' : 'MOVE';

        // 1. Validation
        if (!fs.existsSync(source)) {
            this.journal.log({
                id: opId,
                type: type,
                sourcePath: source,
                targetPath: target,
                status: 'FAILED',
                error: 'Source not found',
                fileHash: hash
            });
            return false;
        }

        if (fs.existsSync(target)) {
            this.journal.log({
                id: opId,
                type: type,
                sourcePath: source,
                targetPath: target,
                status: 'FAILED',
                error: 'Target already exists',
                fileHash: hash
            });
            return false;
        }

        // 2. Prepare Target Directory
        const targetDir = path.dirname(target);
        if (!fs.existsSync(targetDir)) {
            try {
                fs.mkdirSync(targetDir, { recursive: true });
            } catch (err) {
                this.journal.log({
                    id: opId,
                    type: type,
                    sourcePath: source,
                    targetPath: target,
                    status: 'FAILED',
                    error: 'Failed to create directory: ' + String(err),
                    fileHash: hash
                });
                return false;
            }
        }

        // 3. Log PENDING (CRITICAL)
        this.journal.log({
            id: opId,
            type: type,
            sourcePath: source,
            targetPath: target,
            status: 'PENDING',
            fileHash: hash
        });

        // 4. Execute
        try {
            if (mode === 'move') {
                return this.performMove(source, target, opId, hash);
            } else {
                return this.performCopy(source, target, opId, hash);
            }
        } catch (err: any) {
            this.journal.log({
                id: opId,
                type: type,
                sourcePath: source,
                targetPath: target,
                status: 'FAILED',
                error: String(err),
                fileHash: hash
            });
            return false;
        }
    }

    private performCopy(source: string, target: string, opId: string, hash?: string): boolean {
        try {
            fs.copyFileSync(source, target);
            this.journal.log({
                id: opId,
                type: 'COPY',
                sourcePath: source,
                targetPath: target,
                status: 'COMPLETED',
                fileHash: hash
            });
            return true;
        } catch (err) {
            throw err; // Re-throw to be caught by main try-catch
        }
    }

    private performMove(source: string, target: string, opId: string, hash?: string): boolean {
        try {
            // Try atomic rename first
            fs.renameSync(source, target);
            this.journal.log({
                id: opId,
                type: 'MOVE',
                sourcePath: source,
                targetPath: target,
                status: 'COMPLETED',
                fileHash: hash
            });
            return true;
        } catch (err: any) {
            // Handle Cross-Device Link error
            if (err.code === 'EXDEV') {
                try {
                    fs.copyFileSync(source, target);
                    fs.unlinkSync(source);

                    this.journal.log({
                        id: opId,
                        type: 'MOVE',
                        sourcePath: source,
                        targetPath: target,
                        status: 'COMPLETED',
                        fileHash: hash
                    });
                    return true;
                } catch (copyErr) {
                    // Attempt cleanup if copy failed
                    if (fs.existsSync(target)) {
                        try { fs.unlinkSync(target); } catch { }
                    }
                    throw new Error('EXDEV Copy Failed: ' + String(copyErr));
                }
            }
            throw err;
        }
    }
}
