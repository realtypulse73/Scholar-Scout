export type PeerConnectionStatus = 'pending' | 'accepted' | 'declined' | 'closed';

export interface PeerConnectionRequest {
  id: string;
  requester_id: string;
  peer_guide_username: string;
  program_id: string;
  topic: string;
  question: string;
  status: PeerConnectionStatus;
  created_at: string;
}

export interface CreatePeerConnectionRequest {
  peer_guide_username: string;
  program_id: string;
  topic: string;
  question: string;
}

export function validatePeerConnectionRequest(
  request: CreatePeerConnectionRequest,
): string[] {
  const errors: string[] = [];
  if (!request.peer_guide_username.trim()) errors.push('Choose a student guide.');
  if (!request.program_id.trim()) errors.push('Choose a program.');
  if (!request.topic.trim() || request.topic.trim().length > 80) {
    errors.push('Choose a short conversation topic.');
  }
  if (!request.question.trim() || request.question.trim().length > 500) {
    errors.push('Write a question of up to 500 characters.');
  }
  if (containsContactDetails(request.question)) {
    errors.push('Do not include phone numbers, email addresses, or social handles in a peer request.');
  }
  return errors;
}

function containsContactDetails(value: string) {
  return /@|\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(value);
}
