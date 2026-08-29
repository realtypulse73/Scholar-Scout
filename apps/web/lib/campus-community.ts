export interface CampusNote {
  id: string;
  author_id: string;
  school_slug: string;
  uploader_username: string | null;
  program_id: string | null;
  body: string;
  created_at: string;
}

export interface PublicCampusNote {
  id: string;
  school_slug: string;
  uploader_username: string | null;
  program_id: string | null;
  body: string;
  created_at: string;
}

export type CampusNoteDraft = Omit<CampusNote, 'id' | 'author_id' | 'created_at'>;

export interface UploaderInboxRequest {
  id: string;
  sender_id: string;
  uploader_username: string;
  program_id: string;
  body: string;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
  created_at: string;
}

export function validateCampusNote(input: CampusNoteDraft): string[] {
  const errors: string[] = [];
  if (!input.school_slug.trim()) errors.push('Choose a school locker.');
  if (!input.body.trim() || input.body.trim().length > 500) errors.push('Write a note of up to 500 characters.');
  if (containsContactDetails(input.body)) errors.push('Do not include phone numbers, email addresses, or social handles in a public note.');
  return errors;
}

export function isCampusNoteDraft(value: unknown): value is CampusNoteDraft {
  if (!isRecord(value)) return false;

  return typeof value.school_slug === 'string'
    && (value.uploader_username === null || typeof value.uploader_username === 'string')
    && (value.program_id === null || typeof value.program_id === 'string')
    && typeof value.body === 'string';
}

export function toPublicCampusNote(note: CampusNote): PublicCampusNote {
  return {
    id: note.id,
    school_slug: note.school_slug,
    uploader_username: note.uploader_username,
    program_id: note.program_id,
    body: note.body,
    created_at: note.created_at,
  };
}

export function validateUploaderInboxRequest(input: Pick<UploaderInboxRequest, 'uploader_username' | 'program_id' | 'body'>) {
  const errors: string[] = [];
  if (!input.uploader_username.trim()) errors.push('Choose an uploader.');
  if (!input.program_id.trim()) errors.push('Choose a program.');
  if (!input.body.trim() || input.body.trim().length > 500) errors.push('Write a message of up to 500 characters.');
  if (containsContactDetails(input.body)) errors.push('Do not include phone numbers, email addresses, or social handles in your first inbox request.');
  return errors;
}

function containsContactDetails(value: string): boolean {
  const normalized = value.normalize('NFKC');
  return /@|\b\p{Nd}{3}[-.\s]?\p{Nd}{3}[-.\s]?\p{Nd}{4}\b/u.test(normalized);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
