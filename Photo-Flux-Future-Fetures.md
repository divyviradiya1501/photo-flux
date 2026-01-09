# Photo Flux Feature Roadmap

Based on the current architecture (Electron, React, offline-first), here is a proposal for new features to enhance Photo Flux.

## 1. Expanded Media Support

Current support is limited to standard image formats. Expanding this makes Photo Flux a complete media manager.

- **Video Organization**
  - **Goal:** Organize video files (`.mp4`, `.mov`, `.avi`) alongside photos.
  - **Implementation:** Use `ffmpeg` or `ffprobe` to extract creation dates from video metadata.
  
- **RAW Image Support**
  - **Goal:** Support professional formats like `.CR2` (Canon), `.NEF` (Nikon), and `.ARW` (Sony).
  - **Implementation:** Integrate `sharp` or `dcraw` to generate preview thumbnails for these heavy formats.

## 2. Advanced "Smart" Features (Offline)

Leverage local processing power to add "cloud-like" features without compromising privacy.

- **Visual Duplicate Detection**
  - **Goal:** Find images that look similar but aren't identical files (e.g., resized versions, edits).
  - **Implementation:** Implement **Perceptual Hashing (pHash)** to compare visual similarity rather than just file hashes.

- **Local AI Tagging**
  - **Goal:** Search for "Cat," "Beach," or "Car" without internet access.
  - **Implementation:** Use **TensorFlow.js** or **ONNX Runtime** with a pre-trained model (like MobileNet) running entirely on the user's machine.

## 3. Utility & Conversion Tools

- **HEIC to JPG Converter**
  - **Goal:** Help users convert iPhone photos (HEIC) to universally compatible JPGs.
  - **Implementation:** Add a "Convert to JPG" toggle in the organization options using `sharp`.

- **Corrupt File Detector**
  - **Goal:** Prevent organizing or moving files that are half-written or corrupted.
  - **Implementation:** Pre-scan files for integrity before the main copy/move operation.

## 4. Metadata & Geolocation

- **Location-Based Sorting**
  - **Goal:** Sort photos into folders by location (e.g., `Photos/Japan/Tokyo`).
  - **Implementation:** Use `exifr` to read GPS data and a local reverse-geocoding lookup to find city/country names offline.

- **Map View**
  - **Goal:** Visualize where photos were taken on an interactive map.
  - **Implementation:** Add a "Map" tab displaying pins for geotagged photos.

## 5. UI/UX Enhancements

- **Built-in Media Viewer**
  - **Goal:** Allow users to preview photos in full resolution without leaving the app.
  - **Implementation:** Double-click interaction in "Plan View" to open a modal lightbox.

- **Customizable Renaming Templates**
  - **Goal:** Give users total control over filenames.
  - **Implementation:** Support template strings like `{YYYY}-{MM}-{City}-{OriginalName}` instead of just fixed presets.

## 6. Export & Backup

- **External Drive Sync / Offload**
  - **Goal:** Safely move photos to an external backup drive.
  - **Implementation:** Verify file checksums on the destination drive before deleting them from the source PC.

---

## Technical Recommendations

To support these features while maintaining performance:

* **Image Processing:** Adopting **`sharp`** (Node.js) is recommended for high-performance image resizing and conversion.
* **Local Database:** Implementing **`SQLite`** or **`RxDB`** to cache metadata and thumbnails will prevent the need to re-scan thousands of files every session.