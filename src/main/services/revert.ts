import * as fs from 'fs';
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

    public revertSession(logPath: string): RevertResult {
        const entries = this.journal.readEntries(logPath);
        // Reverse order to undo correctly
        const reverseEntries = entries.reverse();

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

        // Fix 4: Always mark as reverted so it disappears from the list.
        // If there were errors, the user sees them in the result screen.
        // Trying to revert again usually fails identical ways or causes confusion.
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
