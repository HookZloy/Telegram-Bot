// Firestore Security Rules - Dirty Dozen Attack Matrix Verification
export const dirtyDozenTestMatrix = [
  { id: 'Pillar 1', test: 'Reject unauthenticated read to /users/{userId}/downloads/{downloadId}', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 2', test: 'Reject cross-user snooping between different user IDs', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 3', test: 'Reject spoofed owner write with mismatched body userId', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 4', test: 'Reject path ID poisoning exceeding character boundary', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 5', test: 'Reject shadow field injection in downloadTask', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 6', test: 'Reject tampering of immutable fields (createdAt, url, userId)', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 7', test: 'Reject invalid enum values for format and platform', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 8', test: 'Reject blanket collection scrape on root /users', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 9', test: 'Reject cross-user settings write to /users/{otherId}/settings', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 10', test: 'Reject oversized payload strings exceeding boundary limit', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 11', test: 'Enforce affectedKeys().hasOnly() during status update', expected: 'PERMISSION_DENIED' },
  { id: 'Pillar 12', test: 'Catch-all default deny on unauthorized root documents', expected: 'PERMISSION_DENIED' },
];
