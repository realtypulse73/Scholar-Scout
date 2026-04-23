export class NotificationService {
  createNotification(userId: string, title: string, body: string) {
    return {
      userId,
      title,
      body,
      createdAt: new Date().toISOString(),
    };
  }
}

