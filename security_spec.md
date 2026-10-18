# Security Specification & Test Matrix

## 1. Data Invariants
- A user can only read, create, update, and delete documents within their own subcollections `/users/{userId}/downloads/{downloadId}` and `/users/{userId}/settings/{settingId}` where `request.auth.uid == userId`.
- During document creation, `request.resource.data.userId == request.auth.uid` must hold.
- Path variables `{userId}`, `{downloadId}`, and `{settingId}` must satisfy `isValidId()`.
- Updates cannot alter immutable fields (`id`, `userId`, `createdAt`, `url`).
- Only verified users (`request.auth.token.email_verified == true`) or authenticated users are permitted, and unauthenticated access is strictly forbidden with a default deny catch-all `match /{document=**} { allow read, write: if false; }`.

## 2. The Dirty Dozen Payloads
1. **Unauthenticated Read**: Attempting to read `/users/user123/downloads/task1` without auth. -> Expected: PERMISSION_DENIED.
2. **Cross-User Snooping**: Authenticated user Alice attempts to read Bob's tasks at `/users/bob/downloads/task1`. -> Expected: PERMISSION_DENIED.
3. **Spoofed Owner Write**: Alice creates a task under `/users/bob/downloads/task2` with `userId: "bob"`. -> Expected: PERMISSION_DENIED.
4. **Mismatched Body UID**: Alice creates `/users/alice/downloads/task3` with `userId: "bob"`. -> Expected: PERMISSION_DENIED.
5. **Junk ID Poisoning**: Alice creates a task with a 2000-character malicious path ID or invalid characters like `../../hack`. -> Expected: PERMISSION_DENIED.
6. **Shadow Field Injection**: Alice sends an update or create payload containing extra keys like `{ admin: true, isSuperUser: true }`. -> Expected: PERMISSION_DENIED.
7. **Immutable Field Tampering**: Alice tries to change `userId` or `createdAt` on an existing task. -> Expected: PERMISSION_DENIED.
8. **Invalid Enum Format**: Alice provides a format not in allowed list e.g. `{ format: "malicious_exe" }`. -> Expected: PERMISSION_DENIED.
9. **Oversized String Payload**: Alice provides a URL or Title with size exceeding `maxLength`. -> Expected: PERMISSION_DENIED.
10. **Terminal State Reversal**: Trying to modify completed immutable artifacts or violate status transitions. -> Expected: PERMISSION_DENIED.
11. **Settings Cross-User Write**: Alice modifies `/users/bob/settings/config`. -> Expected: PERMISSION_DENIED.
12. **Blanket Collection Scrape**: Querying `/users` root or all subcollections without filtering by owned `userId`. -> Expected: PERMISSION_DENIED.
