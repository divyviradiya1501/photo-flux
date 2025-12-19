import * as fs from 'fs';
import * as crypto from 'crypto';

export class HashService {
    /**
     * Computes SHA-256 hash of a file.
     * Uses streams for memory efficiency with large files.
     */
    public async computeHash(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = fs.createReadStream(filePath);

            stream.on('error', (err) => reject(err));
            stream.on('data', (chunk) => hash.update(chunk));
            stream.on('end', () => resolve(hash.digest('hex')));
        });
    }

    /**
     * Quick compare of two files by size first, then hash.
     */
    public async areIdentical(pathA: string, pathB: string): Promise<boolean> {
        try {
            const statA = fs.statSync(pathA);
            const statB = fs.statSync(pathB);

            if (statA.size !== statB.size) {
                return false;
            }

            // Sizes match, expensive hash check needed
            const hashA = await this.computeHash(pathA);
            const hashB = await this.computeHash(pathB);

            return hashA === hashB;
        } catch (err) {
            // One file missing or access denied
            return false;
        }
    }
}
