# Teaching OS

授業・講演で「何を、いつ、生徒画面に見せるか」を扱うためのブラウザベース Teaching OS。

## Current baseline

- Baseline: v0.29 Effects Fix
- 16:9 Student View (1280×720)
- EDIT / PRESENT modes
- Multiple Student Screens + TAKE LIVE
- Teaching Flow NOW / NEXT cards
- Blackboard / Pointer / Stick
- Camera / Video / per-screen Audio
- Notes → Presentation
- Physics diagram parts
- Local-first storage (localStorage + IndexedDB media)

## Design direction

Teaching OS should remain browser-first and output-agnostic. Student View is kept logically separate so future output can include a separate browser window, HDMI/AirPlay, projector browser, or URL-based web delivery.

Next major architecture step: Presentation Library, while preserving the current v0.29 feature set and stability.
