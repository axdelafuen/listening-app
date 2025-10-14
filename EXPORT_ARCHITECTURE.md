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

## Import

To import an exercice on the app, upload the `.zip` file from the home page.