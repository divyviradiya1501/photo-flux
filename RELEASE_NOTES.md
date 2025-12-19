# Photo Flux v1.0.0 - Release Notes

We are thrilled to announce the official release of **Photo Flux v1.0.0**! This version introduces our core mission: providing a powerful, secure, and beautiful way to organize your lifetime of memories.

## 🚀 Key Features

### 📂 Smart Organization
*   **Automatic Sorting**: Automatically arrange your photos into a clean directory structure by **Year** and **Month**.
*   **Metadata Mastery**: Uses advanced EXIF parsing (via `exifr`) to find the exact moment a photo was taken, falling back to filesystem timestamps only when necessary.
*   **Collision Handling**: Smart renaming logic ensures that no files are overwritten when duplicates or name conflicts occur.

### 🛡️ Safety & Reliability
*   **Journaling System**: Every single file operation is logged in an append-only journal before it happens, ensuring data integrity even if the app or system crashes.
*   **Atomic-Style Transfers**: Uses safe move/copy operations with verification to ensure no data loss during the transfer process.
*   **Full Revert**: Made a mistake? Use the **Revert** feature to undo an entire session and move your photos back to their original locations.

### 🎨 Modern Experience
*   **Glassmorphic UI**: A premium, dark-mode design with subtle micro-animations and smooth transitions.
*   **Progressive Feedback**: Real-time progress bars for scanning, planning, and execution phases.
*   **Responsive Design**: Built with React and Electron for a smooth, desktop-native feel.

### 🔒 Privacy Driven
*   **100% Offline**: All processing happens locally on your machine. Your photos never touch a server or the cloud.
*   **Zero Data Collection**: We don't track you. Period.

## 🛠️ Technical Specifications
*   **Framework**: Electron + React + Vite
*   **Language**: TypeScript
*   **Supported Formats**: JPG, JPEG, PNG, HEIC, WebP, TIFF, and various RAW formats (CR2, NEF, ARW, DNG).

---
*Thank you for choosing Photo Flux. Your memories, beautifully organized.*
