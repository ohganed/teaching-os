# Changelog

## v0.29 — Effects Fix

Baseline candidate for GitHub migration.

- Restored `renderEffectsPanel()` lost during earlier migration.
- Preserved v0.28 selection-status fix.
- Preserved preview-safe explicit DOM bindings and visible boot-error reporting.
- Static JavaScript syntax check passed.
- Static undefined-function scan found no additional obvious missing function calls.

## v0.28 — Selection Fix

- Restored `renderSelectionStatus()`.

## v0.27 — Preview Safe

- Added explicit DOM bindings instead of relying on implicit element globals.
- Added defensive boot error display.

## v0.26 — Stability Fix

- Removed periodic full Student Window sync.
- Moved camera captures to IndexedDB blobs.
- Improved audio crossfade timer handling.
- Added object URL cleanup.
- Preserved EDIT/PRESENT, Student Screens, TAKE LIVE, blackboard, pointer, media, notes, and physics parts.
