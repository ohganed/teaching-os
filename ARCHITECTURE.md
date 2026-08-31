# Teaching OS Architecture

## Core principle

Reduce presenter burden. Prefer reliable, useful classroom behavior over flashy presentation effects.

## Current layers

1. Teacher View — editing and authoring
2. Student View — 1280×720 presentation surface
3. Cockpit — live controls
4. Student Screens — editable screens with explicit TAKE LIVE
5. Teaching Flow — teacher-only NOW / NEXT cues
6. Media Layer — camera, video, per-screen audio
7. Source Layer — source material kept separate from instructional overlays
8. Blackboard Layer — pen, circle, arrow, text, pointer
9. Storage — localStorage for state; IndexedDB for larger media

## Output boundary

Teacher View and Student View must remain logically separated.

Future output adapters may include:
- Student Window
- HDMI / OS mirroring
- AirPlay
- projector-specific output
- Web URL / Local Web Presenter

Do not make the core editor depend on one projector vendor or OS API.

## Next architecture: Presentation Library

Library metadata should be lightweight and separate from presentation content.

Presentation metadata:
- id
- title
- subject
- unit
- tags
- favorite
- lastEdited
- lastUsed

A Presentation is reusable teaching material. A Session is a record of when/where a Presentation was used. Do not duplicate a Presentation for every class/session.

Do not load all presentation media/content at startup. Load catalog metadata first, then the selected Presentation.

## Stability rule

New versions must preserve working v0.29 features unless a removal is explicitly approved. Optimize internals rather than deleting classroom functionality.
