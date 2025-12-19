import * as path from 'path';
import * as fs from 'fs';
import { MetadataService } from './metadata';
import { HashService } from './hash';

export interface PlanItem {
    sourcePath: string;
    targetPath: string; // Proposed target
    status: 'READY' | 'DUPLICATE' | 'CONFLICT' | 'ERROR';
    reason?: string;
    dateTaken?: Date;
}

export type OrganizationMode = 'year' | 'year-month';
export type RenameMode = 'original' | 'date-prefix';

export class Planner {
    private metadataService: MetadataService;
    private hashService: HashService;
    private targetRootDir: string;
    private organizationMode: OrganizationMode;
    private renameMode: RenameMode;

    constructor(
        targetRootDir: string,
        organizationMode: OrganizationMode = 'year-month',
        renameMode: RenameMode = 'original'
    ) {
        this.metadataService = new MetadataService();
        this.hashService = new HashService();
        this.targetRootDir = targetRootDir;
        this.organizationMode = organizationMode;
        this.renameMode = renameMode;
    }

    private getMonthName(monthIndex: number): string {
        const months = [
            '01_January', '02_February', '03_March', '04_April', '05_May', '06_June',
            '07_July', '08_August', '09_September', '10_October', '11_November', '12_December'
        ];
        return months[monthIndex] || 'Unknown';
    }

    private applyRename(originalFileName: string, date: Date): string {
        if (this.renameMode === 'original' || date.getTime() <= 0) {
            return originalFileName;
        }

        // date-prefix mode: YYYYMMDD_filename
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const prefix = `${year}${month}${day}_`;

        return prefix + originalFileName;
    }

    public async createPlanForFile(sourcePath: string): Promise<PlanItem> {
        try {
            // 1. Get Date
            const metadata = await this.metadataService.getMetadata(sourcePath);
            const date = this.metadataService.resolveDate(metadata);

            let yearDir = 'Unknown_Date';
            let monthDir = '';

            if (date.getTime() > 0) {
                yearDir = date.getFullYear().toString();
                monthDir = this.getMonthName(date.getMonth());
            } else {
                // Unknown Date
                // yearDir is already Unknown_Date
            }

            // 2. Construct Target Path
            const originalFileName = path.basename(sourcePath);
            const finalFileName = this.applyRename(originalFileName, date);
            let targetPath = path.join(this.targetRootDir, yearDir);

            // Only add month folder if mode is 'year-month'
            if (monthDir && this.organizationMode === 'year-month') {
                targetPath = path.join(targetPath, monthDir);
            }
            targetPath = path.join(targetPath, finalFileName);

            // 3. Check for Collisions
            if (fs.existsSync(targetPath)) {
                // Collision!
                // Is it the exact same file?
                const isIdentical = await this.hashService.areIdentical(sourcePath, targetPath);

                if (isIdentical) {
                    return {
                        sourcePath,
                        targetPath,
                        status: 'DUPLICATE',
                        reason: 'File already exists in target',
                        dateTaken: date
                    };
                } else {
                    // Content differs -> Rename needed
                    // Strategy: Append _1, _2, etc.
                    let counter = 1;
                    let newTarget = targetPath;
                    const namePart = path.parse(finalFileName).name;
                    const extPart = path.parse(finalFileName).ext;

                    while (fs.existsSync(newTarget)) {
                        // Check hash against this new candidate too? 
                        // Logic: If newTarget exists, we check if THAT is identical.
                        if (await this.hashService.areIdentical(sourcePath, newTarget)) {
                            return {
                                sourcePath,
                                targetPath: newTarget,
                                status: 'DUPLICATE',
                                reason: 'Renamed duplicate found',
                                dateTaken: date
                            };
                        }

                        newTarget = path.join(path.dirname(targetPath), `${namePart}_${counter}${extPart}`);
                        counter++;
                    }

                    return {
                        sourcePath,
                        targetPath: newTarget,
                        status: 'READY', // Ready to move (renaming)
                        reason: 'Renamed to avoid conflict',
                        dateTaken: date
                    };
                }
            }

            return {
                sourcePath,
                targetPath,
                status: 'READY',
                dateTaken: date
            };

        } catch (err: any) {
            return {
                sourcePath,
                targetPath: '',
                status: 'ERROR',
                reason: err.message
            };
        }
    }
}
