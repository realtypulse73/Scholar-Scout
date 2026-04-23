'use client';

import { useUser } from '@clerk/nextjs';
import { FormEvent, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { Shell } from '../../components/shell';
import {
  createConversation,
  createMessage,
  getConversations,
  getNotifications,
  getSocketUrl,
  markMessageRead,
  markNotificationRead,
  syncClerkUser,
} from '../../lib/api';

type InboxItem = {
  id: string;
  kind: 'notification' | 'message';
  title: string;
  body: string;
  conversationId?: string;
  readAt?: string | null;
  createdAt: string;
};

export default function InboxPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [backendUserId, setBackendUserId] = useState<string | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('Loading inbox...');

  useEffect(() => {
    let socket: Socket | undefined;

    async function loadInbox() {
      if (!isLoaded || !isSignedIn || !user?.primaryEmailAddress?.emailAddress) {
        setStatus('Sign in to view your inbox.');
        return;
      }

      const backendUser = await syncClerkUser({
        id: user.id,
        email: user.primaryEmailAddress.emailAddress,
      });
      const notifications = await getNotifications(backendUser.id);
      const conversations = await getConversations(backendUser.id);
      const messageItems = conversations.flatMap((conversation) =>
        conversation.messages.map((message) => ({
          id: message.id,
          kind: 'message' as const,
          title:
            message.senderId === backendUser.id
              ? 'You sent a message'
              : 'New conversation message',
          body: message.body,
          conversationId: conversation.id,
          readAt: message.readAt,
          createdAt: message.createdAt,
        })),
      );
      const notificationItems = notifications.map((notification) => ({
        id: notification.id,
        kind: 'notification' as const,
        title: notification.title,
        body: notification.body,
        readAt: notification.readAt,
        createdAt: notification.createdAt,
      }));
      const mergedItems = [...notificationItems, ...messageItems].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      );
      setItems(mergedItems);
      setBackendUserId(backendUser.id);
      setActiveConversationId(conversations[0]?.id ?? null);
      setStatus(
        mergedItems.length > 0
          ? `Loaded ${mergedItems.length} inbox items.`
          : 'Your inbox is empty.',
      );

      socket = io(getSocketUrl(), {
        transports: ['websocket'],
      });

      socket.on(`notifications:${backendUser.id}`, (incoming) => {
        setItems((current) => [
          {
            id: incoming.id,
            kind: 'notification',
            title: incoming.title,
            body: incoming.body,
            readAt: null,
            createdAt: incoming.createdAt,
          },
          ...current,
        ]);
      });
      socket.on(`inbox:${backendUser.id}`, (incoming) => {
        setItems((current) => [
          {
            id: incoming.id,
            kind: 'message',
            title:
              incoming.senderId === backendUser.id
                ? 'You sent a message'
                : 'New conversation message',
            body: incoming.body,
            conversationId: incoming.conversationId,
            readAt: null,
            createdAt: incoming.createdAt,
          },
          ...current,
        ]);
      });
    }

    loadInbox().catch(() => {
      setStatus('Unable to load inbox.');
    });

    return () => {
      socket?.disconnect();
    };
  }, [isLoaded, isSignedIn, user]);

  async function handleMarkRead(item: InboxItem) {
    try {
      if (item.kind === 'notification') {
        await markNotificationRead(item.id);
      } else {
        await markMessageRead(item.id);
      }

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id
            ? { ...currentItem, readAt: new Date().toISOString() }
            : currentItem,
        ),
      );
    } catch {
      setStatus('Unable to mark item as read.');
    }
  }

  async function handleSendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!backendUserId || draft.trim().length === 0) {
      return;
    }

    try {
      let conversationId = activeConversationId;

      if (!conversationId) {
        const conversation = await createConversation({
          participantIds: [backendUserId, 'support'],
        });
        conversationId = conversation.id;
        setActiveConversationId(conversation.id);
      }

      await createMessage({
        conversationId,
        senderId: backendUserId,
        body: draft.trim(),
      });
      setDraft('');
      setStatus('Message sent.');
    } catch {
      setStatus('Unable to send message.');
    }
  }

  return (
    <Shell>
      <section style={{ display: 'grid', gap: 20 }}>
        <h1>Inbox</h1>
        <p style={{ maxWidth: 680, margin: 0, color: '#6b7b52' }}>{status}</p>
        <form
          onSubmit={handleSendMessage}
          style={{
            display: 'grid',
            gap: 12,
            padding: 20,
            borderRadius: 18,
            border: '1px solid #d9dfc8',
            background: '#fffaf0',
          }}
        >
          <label>
            Message support
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              placeholder="Ask about applications, scholarships, or profile setup."
              style={{
                display: 'block',
                width: '100%',
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                border: '1px solid #d9dfc8',
              }}
            />
          </label>
          <button
            type="submit"
            style={{
              width: 160,
              padding: 12,
              borderRadius: 999,
              border: 0,
              background: '#355e3b',
              color: '#fff',
            }}
          >
            Send message
          </button>
        </form>
        {items.map((item) => (
          <article
            key={item.id}
            style={{
              padding: 24,
              borderRadius: 18,
              border: '1px solid #d9dfc8',
              background: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <strong>
                {item.title}
                {!item.readAt ? ' - unread' : ''}
              </strong>
              <span style={{ color: '#6b7b52' }}>
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>
            <p style={{ marginBottom: 0 }}>{item.body}</p>
            {!item.readAt ? (
              <button
                type="button"
                onClick={() => handleMarkRead(item)}
                style={{
                  marginTop: 16,
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: '1px solid #355e3b',
                  background: 'transparent',
                  color: '#355e3b',
                }}
              >
                Mark read
              </button>
            ) : null}
          </article>
        ))}
      </section>
    </Shell>
  );
}
