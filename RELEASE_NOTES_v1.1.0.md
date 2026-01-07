# Photo Flux v1.1.0 Release Notes

## What's New

### UI/UX Improvements
- **Redesigned Settings Page** - Settings cards now arranged in a clean 2x2 grid layout for better organization and visual balance
- **Silent Re-analysis** - Changing organization options (Year/Month, Rename mode, Destination) no longer shows a loading screen. Updates happen seamlessly in the background with a subtle spinner indicator
- **Custom Path Display** - When using a custom output path, the selected folder path is now displayed next to the Browse button for quick reference

### Core Functionality
- **Smart Folder Cleanup on Revert** - When reverting an organization session, Photo Flux now automatically cleans up empty folders that were created during organization, leaving your file system tidy
- **Improved State Management** - Fresh scan sessions are guaranteed when navigating back to the scan view, preventing stale data from previous sessions

## Bug Fixes

- **Fixed incorrect success/error counts** - Resolved an issue where the completion screen would show incorrect statistics (e.g., "0 success, 18 errors" when all files transferred successfully)
- **Fixed scan screen flashing** - Eliminated the issue where changing plan options would briefly show the scan/analysis screen
- **Fixed stale path display** - The scan view no longer shows paths from previously reverted sessions
- **Fixed duplicate event handling** - Resolved issues with IPC listeners accumulating across sessions, which caused erratic behavior during repeated operations
- **Fixed log inconsistency** - Transfer logs now accurately reflect the actual operation results

## Technical Improvements

- Added `removeAllListeners()` API for proper cleanup of IPC event listeners
- Implemented `isMounted` ref pattern across components to prevent state updates after unmount
- Added `initialAnalysisDone` tracking to differentiate between initial load and settings changes
- Improved revert service with directory collection and cleanup logic

## Downloads

| File | Description |
|------|-------------|
| `Photo Flux Setup 1.1.0.exe` | Windows installer with desktop/start menu shortcuts |
| `Photo Flux 1.1.0.exe` | Portable version - no installation required |

## System Requirements

- Windows 10 or later
- No additional dependencies required

---

**Full Changelog**: v1.0.0...v1.1.0
