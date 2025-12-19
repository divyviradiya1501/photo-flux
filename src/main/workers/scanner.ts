import { parentPort } from 'worker_threads';
import * as fs from 'fs';
import * as path from 'path';

// Worker receives: { directory: string }
// Worker sends: { type: 'FOUND', path: string } | { type: 'DONE' } | { type: 'ERROR', error: string }

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.heic', '.tiff', '.bmp', '.webp', '.raw', '.dng', '.cr2', '.nef', '.arw']);
const IGNORED_DIRS = new Set(['$RECYCLE.BIN', 'System Volume Information', 'Windows', 'Program Files', 'Program Files (x86)', 'node_modules', '.git']);

function scanDirectory(dir: string) {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
                    // Recursive
                    // Check if we can access it (permissions)
                    try {
                        fs.accessSync(fullPath, fs.constants.R_OK);
                        scanDirectory(fullPath);
                    } catch (e) {
                        // Skip permission denied
                    }
                }
            } else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (IMAGE_EXTENSIONS.has(ext)) {
                    if (parentPort) {
                        parentPort.postMessage({ type: 'FOUND', path: fullPath });
                    }
                }
            }
        }
    } catch (err) {
        if (parentPort) {
            parentPort.postMessage({ type: 'ERROR', error: `Failed to scan ${dir}: ${err}` });
        }
    }
}

// Listen for start message
if (parentPort) {
    parentPort.on('message', (msg) => {
        if (msg.cmd === 'START') {
            try {
                scanDirectory(msg.directory);
                parentPort?.postMessage({ type: 'DONE' });
            } catch (err) {
                parentPort?.postMessage({ type: 'FATAL', error: String(err) });
            }
        }
    });
}
