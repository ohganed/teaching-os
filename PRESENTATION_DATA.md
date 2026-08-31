# Teaching OS Presentation Data Layer — v0.31

## Principle

The Teaching OS application and teaching content are separate concerns.

- GitHub: application delivery and version history
- Presentation Data: user-owned teaching content
- Local Provider: browser localStorage + IndexedDB
- Future Sync Provider: iCloud/CloudKit or another pluggable sync provider

## Presentation record v1

A presentation record contains:

- schemaVersion
- id
- title
- lessonKey
- updatedAt
- activeScreenId
- liveScreenId
- screens[]
- notes

Large media continues to live in IndexedDB and is referenced by the presentation data.

## Migration

v0.31 first looks for the new presentation record. If it does not exist, it reads the existing v0.29/v0.30 localStorage keys and writes a v1 presentation record. Legacy keys are retained during the migration period for rollback safety.

## Offline rule

Offline edits are saved locally first. Future cloud sync must never be required for an active lesson to continue.
