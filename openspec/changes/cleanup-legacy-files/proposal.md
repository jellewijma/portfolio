## Why

Remove unused legacy files to reduce repository size (~38MB), simplify project structure, and keep documentation accurate. The empty car.html file and anthias directory with video files are not referenced by any pages and serve no purpose, adding unnecessary bloat to the repository.

## What Changes

- **Remove car.html**: Empty HTML file with no content or references
- **Remove anthias directory**: Contains index.html with FPS counter test page and video files (~38MB total)
- **Update AGENTS.md documentation**: Remove references to car.html and anthias directory from project documentation
- **Git operations**: Commit cleanup with clear message describing removed files

## Capabilities

### New Capabilities
- `legacy-file-cleanup`: Identification and removal of unused files from repository, including associated documentation updates

### Modified Capabilities
<!-- No existing capabilities are being modified -->

## Impact

- **Repository size**: ~38MB reduction from video file removal
- **Documentation**: AGENTS.md requires updates to reflect current file structure
- **Code references**: No active pages reference these files (confirmed via grep)
- **Deployment**: GitHub Pages deployment unaffected (these files are not served)
- **Testing**: No functional changes to portfolio site; only unused files removed