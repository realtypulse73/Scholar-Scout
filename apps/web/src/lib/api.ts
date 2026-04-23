export type BackendUser = {
  id: string;
  email: string;
  profile?: StudentProfile | null;
};

export type StudentProfile = {
  id: string;
  userId: string;
  gpa: number;
  interests: string[];
  location: string;
  createdAt: string;
};

export type MatchResponse = {
  studentProfileId: string;
  totalProgramsConsidered: number;
  matches: Array<{
    programId: string;
    programName: string;
    score: number;
    reasons: string[];
  }>;
};

export type NotificationItem = {
  id: string;
  userId: string;
  channel: string;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  participantIds: string[];
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    readAt?: string | null;
    createdAt: string;
  }>;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (response.status === 404) {
    throw new Error('NOT_FOUND');
  }

  if (!response.ok) {
    throw new Error(`API_ERROR:${response.status}`);
  }

  return response.json();
}

export function getSocketUrl() {
  return apiBaseUrl.replace(/\/api$/, '');
}

export function syncClerkUser(input: { id: string; email: string }) {
  return apiRequest<BackendUser>('/users/clerk-sync', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getStudentProfile(userId: string) {
  try {
    return await apiRequest<StudentProfile>(`/student-profiles/user/${userId}`);
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      return null;
    }

    throw error;
  }
}

export function upsertStudentProfile(input: {
  userId: string;
  gpa: number;
  interests: string[];
  location: string;
}) {
  return apiRequest<StudentProfile>('/student-profiles', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getPrograms() {
  return apiRequest<
    Array<{
      id: string;
      name: string;
      school: string;
      minGpa: number;
      maxGpa: number;
      location: string;
      field: string;
    }>
  >('/programs');
}

export function getMatches(studentProfileId: string, limit = 10) {
  return apiRequest<MatchResponse>('/match', {
    method: 'POST',
    body: JSON.stringify({
      studentProfileId,
      limit,
    }),
  });
}

export function getNotifications(userId: string) {
  return apiRequest<NotificationItem[]>(`/notifications/${userId}`);
}

export function getConversations(userId: string) {
  return apiRequest<Conversation[]>(`/messages/conversations/${userId}`);
}

export function createConversation(input: { participantIds: string[] }) {
  return apiRequest<Conversation>('/messages/conversations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createMessage(input: {
  conversationId: string;
  senderId: string;
  body: string;
}) {
  return apiRequest<Conversation['messages'][number]>('/messages', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function markNotificationRead(id: string) {
  return apiRequest<NotificationItem>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export function markMessageRead(id: string) {
  return apiRequest<Conversation['messages'][number]>(`/messages/${id}/read`, {
    method: 'PATCH',
  });
}
