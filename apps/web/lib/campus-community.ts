export interface CampusNote {
  id: string;
  author_id: string;
  school_slug: string;
  uploader_username: string | null;
  program_id: string | null;
  body: string;
  created_at: string;
}

export interface UploaderInboxRequest {
  id: string;
  sender_id: string;
  uploader_username: string;
  program_id: string;
  body: string;
  status: 'pending' | 'accepted' | 'declined' | 'closed';
  created_at: string;
}

export function validateCampusNote(input: Omit<CampusNote, 'id' | 'author_id' | 'created_at'>) {
  const errors: string[] = [];
  if (!input.school_slug.trim()) errors.push('Choose a school locker.');
  if (!input.body.trim() || input.body.trim().length > 500) errors.push('Write a note of up to 500 characters.');
  if (containsContactDetails(input.body)) errors.push('Do not include phone numbers, email addresses, or social handles in a public note.');
  return errors;
}

export function validateUploaderInboxRequest(input: Pick<UploaderInboxRequest, 'uploader_username' | 'program_id' | 'body'>) {
  const errors: string[] = [];
  if (!input.uploader_username.trim()) errors.push('Choose an uploader.');
  if (!input.program_id.trim()) errors.push('Choose a program.');
  if (!input.body.trim() || input.body.trim().length > 500) errors.push('Write a message of up to 500 characters.');
  if (containsContactDetails(input.body)) errors.push('Do not include phone numbers, email addresses, or social handles in your first inbox request.');
  return errors;
}

function containsContactDetails(value: string) {
  return /@|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(value);
}
