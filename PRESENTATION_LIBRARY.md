# Teaching OS v0.32 — Presentation Library

## Added

- Presentation Library overlay
- Search by title, subject, unit, and tags
- Favorites
- Recent-use ordering
- Create a new blank Presentation
- Open/switch between saved Presentations
- Remember the last active Presentation across restarts
- Existing lesson presets now create a new Presentation instead of overwriting the currently open Presentation

## Storage boundary

Application code remains on GitHub.
Presentation content remains local-first in the browser data layer.

This version does not yet synchronize across Mac/iPad/iPhone. That is intentionally the next layer.

## Offline behavior

The Service Worker cache version is bumped to v0.32 so the updated application shell is refreshed after the next online launch.
