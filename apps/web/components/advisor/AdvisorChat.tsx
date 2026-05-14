'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';

interface ChatMessage {
  role: 'student' | 'advisor';
  text: string;
}

export default function AdvisorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'advisor',
      text: 'Tell me what you are considering, and I will help narrow the next step.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function sendMessage() {
    if (!input.trim()) {
      return;
    }

    const nextMessages = [...messages, { role: 'student' as const, text: input }];
    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    const response = await fetch('/api/advisor-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userKey: 'local-student',
        message: input,
      }),
    });
    const body = (await response.json()) as { reply: string };
    setMessages([...nextMessages, { role: 'advisor', text: body.reply }]);
    setIsSending(false);
  }

  return (
    <Card className="p-5">
      <div className="h-[28rem] space-y-3 overflow-y-auto rounded-card border border-ink-200 bg-ink-50 p-4">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[85%] rounded-card border p-3 text-sm leading-6 ${
              message.role === 'student'
                ? 'ml-auto border-brand-200 bg-brand-600 text-white'
                : 'border-ink-200 bg-white text-ink-700'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-3">
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about paths, costs, fit, or next steps"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              void sendMessage();
            }
          }}
        />
        <Button disabled={isSending} onClick={() => void sendMessage()}>
          Send
        </Button>
      </div>
    </Card>
  );
}
