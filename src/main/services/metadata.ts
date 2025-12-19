import * as fs from 'fs';
import exifr from 'exifr';

export interface PhotoMetadata {
    dateTaken?: Date;
    dateCreated?: Date;
    dateModified?: Date;
}

export class MetadataService {

    // Extensions we support for EXIF parsing
    private static SUPPORTED_EXTS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tiff', '.webp', '.raw', '.dng', '.cr2', '.nef', '.arw']);

    public async getMetadata(filePath: string): Promise<PhotoMetadata> {
        const ext = filePath.toLowerCase().split('.').pop();
        const hasExif = MetadataService.SUPPORTED_EXTS.has('.' + ext);

        let dateTaken: Date | undefined;

        if (hasExif) {
            try {
                // Parse minimum needed tags for speed
                const tags = await exifr.parse(filePath, {
                    pick: ['DateTimeOriginal', 'CreateDate', 'DateTime', 'ModifyDate'],
                    translateValues: true
                });

                if (tags) {
                    dateTaken = tags.DateTimeOriginal || tags.CreateDate || tags.DateTime || tags.ModifyDate;
                }
            } catch (err) {
                // Corrupt header or unreadable, fall back to FS
                console.warn(`Metadata parse failed for ${filePath}: ${err}`);
            }
        }

        // Fallback to FileSystem timestamps
        const stats = fs.statSync(filePath);

        // ctime = Creation Time (Windows), Change Time (Unix)
        // mtime = Modification Time
        // birthtime = Creation Time (Node.js/Filesystem agnostic attempt)

        // Logic: Use the earliest valid date we have
        return {
            dateTaken: dateTaken,
            dateCreated: stats.birthtime,
            dateModified: stats.mtime
        };
    }

    public resolveDate(meta: PhotoMetadata): Date {
        // Strict priority: EXIF > Creation > Modification
        // We filter out invalid dates (e.g. 1970 epoch if something is wrong)
        const candidates = [meta.dateTaken, meta.dateCreated, meta.dateModified];

        for (const date of candidates) {
            if (date && !isNaN(date.getTime()) && date.getFullYear() > 1900) {
                return date;
            }
        }

        return new Date(0); // Unknown date
    }
}
