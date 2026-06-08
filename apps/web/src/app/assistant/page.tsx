'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Bot, Loader2, MessageSquareHeart, SendHorizonal } from 'lucide-react';

import { apiPost } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const suggestedQuestions = [
  'How do I reset my OctoCare device?',
  'What should I do if my shipment is delayed?',
  'How can I update my billing details?',
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hi! I am the OctoCare AI assistant. Ask about billing, shipping, account access, or troubleshooting and I will help you find the fastest next step.',
      createdAt: new Date().toISOString(),
    },
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function askAssistant(prompt: string) {
    if (!prompt.trim()) return;

    setError('');
    setLoading(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, userMessage]);
    setQuestion('');

    try {
      const response = await apiPost('/api/assistant/ask', {
        question: prompt.trim(),
        history: messages.map(({ role, content }) => ({ role, content })),
      });

      const answer =
        (typeof response?.answer === 'string' && response.answer) ||
        (typeof response?.response === 'string' && response.response) ||
        'I could not find a confident answer. Please consider opening a support case.';

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: answer,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (askError) {
      setError(askError instanceof Error ? askError.message : 'Unable to reach the AI assistant right now.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant(question);
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <section className="rounded-[2rem] bg-slate-950 px-8 py-10 text-white shadow-xl">
        <div className="flex items-center gap-3 text-primary-200">
          <div className="rounded-2xl bg-white/10 p-3">
            <Bot className="h-6 w-6" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">AI guidance</p>
        </div>
        <h1 className="mt-5 text-4xl font-semibold">Ask the OctoCare assistant</h1>
        <p className="mt-4 text-sm leading-6 text-slate-300">
          Use natural language to get troubleshooting help, product guidance, or account support answers before escalating to an agent.
        </p>
        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
          <p className="text-sm font-semibold text-white">Try asking:</p>
          <div className="mt-4 space-y-3">
            {suggestedQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void askAssistant(item)}
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/15"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-[42rem] flex-col rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Conversation</h2>
            <p className="text-sm text-slate-500">Responses are powered by the OctoCare support knowledge graph.</p>
          </div>
          <div className="rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700">Live assistant</div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-[1.5rem] px-5 py-4 shadow-sm ${
                message.role === 'assistant'
                  ? 'bg-slate-100 text-slate-800'
                  : 'ml-auto bg-primary-600 text-white'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
                {message.role === 'assistant' ? <MessageSquareHeart className="h-3.5 w-3.5" /> : <SendHorizonal className="h-3.5 w-3.5" />}
                {message.role}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6">{message.content}</p>
              <p className="mt-3 text-xs opacity-70">{formatDateTime(message.createdAt)}</p>
            </div>
          ))}

          {loading ? (
            <div className="flex max-w-[85%] items-center gap-3 rounded-[1.5rem] bg-slate-100 px-5 py-4 text-sm text-slate-500 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Thinking through your question...
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="border-t border-slate-100 p-6">
          <textarea
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about orders, billing, troubleshooting, or account access..."
            className="w-full rounded-3xl border border-slate-200 px-4 py-3 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/submit-case" className="text-sm font-medium text-primary-700 hover:text-primary-800">
              If this didn&apos;t help, open a support case.
            </Link>
            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
              {loading ? 'Sending...' : 'Send message'}
            </button>
          </div>
          {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
        </form>
      </section>
    </div>
  );
}
