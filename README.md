# Eureka Display Generation POC

This is a standalone proof of concept for the Eureka Product Display Generation Engine.
It demonstrates the transformation of a single garment image into various retail display variants.

## Technology Stack
- HTML5, CSS3, Vanilla JS (ES Modules)
- Three.js (for 3D geometric renders)
- HTML Canvas API (for 2D compositing)

## Installation & Setup

1. Navigate to the project directory:
   ```bash
   cd eureka-display-generation-poc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000` (or the port specified by `serve`).

## How to Use
1. Upload a garment image (PNG, JPEG, or WebP).
2. Select a **Display Type** from the dropdown (e.g., Face-out).
3. Click **Generate Display**.
4. Preview the result and click **Export PNG** to save the generated asset.

## Implemented Displays
- **Face-out**: Fully implemented. Performs aspect-ratio preserving normalization and centering on a 600x600 transparent canvas. Supports alpha transparency from source images.
- **Side / Spine-hung**: Fully implemented. 3D lens-shell mapping displaying a realistic side-facing profile.
- **Yoke-fold**: Fully implemented. 3D soft-fold geometry that retains the neckline and yoke area.
- **Standard Fold**: Fully implemented. A compact board-style folded garment presentation.
- **Stacked Garments**: Fully implemented. Dynamically stacked garments with configurable counts and spacing, featuring real 3D shadows and realistic layer offsets.


## Architecture
The rendering pipeline is decoupled from the UI:
`Image Upload` -> `ImageLoader` -> `DisplayRenderer` -> `[2DComposite | ThreeRenderer]` -> `Canvas Output`
