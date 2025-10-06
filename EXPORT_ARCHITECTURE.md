# Export System Architecture

## Overview

The export system has been restructured to cleanly separate static templates from data generation code. This new architecture provides better maintainability and reliability.

## Generated File Structure

When you export an exercise, the system generates a ZIP file containing:

```
exercise-name.zip/
├── index.html              (static template)
├── styles.css              (static template)
├── exercise-engine.js      (static template)
├── exercise-data.js        (dynamically generated)
├── import.json             (JSON data for compatibility)
└── assets/
    ├── audio_0.mp3
    ├── audio_1.mp3
    ├── image_0.jpg
    └── ...
```

## Static Templates

Static templates are stored in `src/assets/templates/`:

### `index.html`
- Complete HTML structure for the exercise
- Volume controls
- Drag & drop zones
- Responsive user interface

### `styles.css`
- Complete styles for the entire interface
- Drag & drop animations
- Responsive design
- Visual effects (correct/incorrect)

### `exercise-engine.js`
- Complete JavaScript exercise engine
- Drag & drop management
- Audio playback with volume controls
- Answer validation
- Scoring system

## Dynamic Generation

### `exercise-data.js`
This file contains only the exercise-specific data:
```javascript
const EXERCISE_DATA = {
  "title": "My exercise",
  "groups": [...],
  "generatedAt": "2024-..."
};
```

## Architecture Benefits

1. **Separation of concerns**: Static templates vs dynamic data
2. **Simplified maintenance**: HTML/CSS/JS modifications in separate files
3. **Easier debugging**: JavaScript code not dynamically generated
4. **Reusability**: Templates reusable for different exercises
5. **Reliability**: Lower risk of generation errors

## How It Works

1. User creates their exercise in the Angular interface
2. During export, the `ExportService`:
   - Copies static templates from `assets/templates/`
   - Processes audio/image files and places them in `assets/`
   - Generates `exercise-data.js` with exercise data
   - Creates the final ZIP file

3. The exported exercise works autonomously:
   - `index.html` loads `exercise-engine.js` and `exercise-data.js`
   - `exercise-engine.js` reads data from `EXERCISE_DATA`
   - The exercise initializes and becomes interactive

## Compatibility

- ✅ Works with `file://` protocol
- ✅ No web server required
- ✅ Compatible with all modern browsers
- ✅ Responsive design for mobile/tablet