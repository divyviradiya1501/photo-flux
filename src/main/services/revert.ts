import * as fs from 'fs';
import * as path from 'path';
import { JournalService } from './journal';

export interface RevertResult {
    success: number;
    failed: number;
    errors: string[];
}

export class RevertService {
    private journal: JournalService;

    constructor(journal: JournalService) {
        this.journal = journal;
    }

    // Track directories that might be empty after revert
    private collectTargetDirs(entries: any[]): Set<string> {
        const dirs = new Set<string>();
        for (const entry of entries) {
            if (entry.status === 'COMPLETED' && entry.targetPath) {
                // Add all parent directories up to a reasonable depth
                let dir = path.dirname(entry.targetPath);
                for (let i = 0; i < 5; i++) { // Max 5 levels up
                    if (dir && dir.length > 3) { // Avoid root paths like C:\
                        dirs.add(dir);
                        dir = path.dirname(dir);
                    } else {
                        break;
                    }
                }
            }
        }
        return dirs;
    }

    // Clean up empty directories after revert
    private cleanupEmptyDirs(dirs: Set<string>): void {
        // Sort by path length descending (deepest first)
        const sortedDirs = Array.from(dirs).sort((a, b) => b.length - a.length);

        for (const dir of sortedDirs) {
            try {
                if (fs.existsSync(dir)) {
                    const contents = fs.readdirSync(dir);
                    if (contents.length === 0) {
                        fs.rmdirSync(dir);
                        console.log(`Cleaned up empty directory: ${dir}`);
                    }
                }
            } catch (err) {
                // Ignore cleanup errors - directory might not be empty or access denied
                console.log(`Could not clean up directory ${dir}:`, err);
            }
        }
    }

    public revertSession(logPath: string): RevertResult {
        const entries = this.journal.readEntries(logPath);
        // Reverse order to undo correctly
        const reverseEntries = entries.reverse();

        // Collect directories before reverting
        const dirsToClean = this.collectTargetDirs(entries);

        const result: RevertResult = { success: 0, failed: 0, errors: [] };

        for (const entry of reverseEntries) {
            if (entry.status !== 'COMPLETED') continue;

            try {
                if (entry.type === 'MOVE') {
                    // Undo MOVE: Move Target -> Source
                    if (fs.existsSync(entry.targetPath)) {
                        if (!fs.existsSync(entry.sourcePath)) {
                            fs.renameSync(entry.targetPath, entry.sourcePath);
                            result.success++;
                        } else {
                            result.failed++;
                            result.errors.push(`Revert MOVE failed: Source ${entry.sourcePath} already exists.`);
                        }
                    } else if (fs.existsSync(entry.sourcePath)) {
                        // Already reverted or moved manually?
                        result.success++;
                    } else {
                        result.failed++;
                        result.errors.push(`Revert MOVE failed: Target ${entry.targetPath} missing.`);
                    }
                } else if (entry.type === 'COPY') {
                    // Undo COPY: Delete Target
                    if (fs.existsSync(entry.targetPath)) {
                        fs.unlinkSync(entry.targetPath);
                        result.success++;
                    } else {
                        // Already deleted?
                        result.success++;
                    }
                }
            } catch (err: any) {
                result.failed++;
                result.errors.push(`Error reverting ${entry.sourcePath}: ${err.message}`);
            }
        }

        // Clean up empty directories created during organization
        this.cleanupEmptyDirs(dirsToClean);

        // Mark session as reverted
        try {
            const newPath = logPath + '.reverted';
            if (fs.existsSync(logPath)) {
                fs.renameSync(logPath, newPath);
            }
        } catch (err) {
            console.error('Failed to mark session as reverted:', err);
        }

        return result;
    }
}
