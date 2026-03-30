import { nanoid } from '@agent/utils';

import { ChatMessage } from '@/types/message';
import { ChatStreamPayload } from '@/types/openai/chat';

const DEFAULT_MODEL_ID = 'multi-agent-v1';

export const isMultiAgentEnabled = () => process.env.MULTI_AGENT_ENABLED === '1';

const parseModelAllowList = () => {
  const raw = process.env.MULTI_AGENT_MODEL_IDS;

  if (!raw) return new Set([DEFAULT_MODEL_ID]);

  return new Set(
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
};

export const isMultiAgentModel = (payload: ChatStreamPayload) => {
  const allowList = parseModelAllowList();
  const rawModel = (payload.model || '').trim();
  const normalizedModel = rawModel
    .split('/')
    .pop()
    ?.split(':')
    .pop()
    ?.trim();

  if (!rawModel) return false;

  return (
    allowList.has(rawModel) ||
    (normalizedModel ? allowList.has(normalizedModel) : false) ||
    rawModel.includes('multi-agent') ||
    (normalizedModel ? normalizedModel.includes('multi-agent') : false)
  );
};

export const isMultiAgentRequest = (payload: ChatStreamPayload) => {
  if (!isMultiAgentEnabled()) return false;

  return isMultiAgentModel(payload);
};

const stringifyMessageContent = (message: ChatMessage) => {
  if (typeof message.content === 'string') return message.content;

  if (Array.isArray(message.content)) {
    return message.content
      .map((part: any) => {
        if (part?.type === 'text') return part.text || '';
        if (part?.type === 'image_url') return part.image_url?.url || '';
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  return '';
};

const extractQuestion = (messages: ChatMessage[]) => {
  const userMessages = messages.filter((m) => m.role === 'user');
  const last = userMessages.at(-1);

  return last ? stringifyMessageContent(last) : '';
};

const toConversationHistory = (messages: ChatMessage[]) => {
  const history = messages
    .slice(0, -1)
    .map((m) => ({ content: stringifyMessageContent(m), role: m.role }))
    .filter((m) => Boolean(m.content));

  return history.length > 0 ? history : undefined;
};

const encodeSSE = (event: string, data: unknown, id = 'multi-agent') => {
  return `id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
};

const createTextEventStream = (text: string) => {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(encodeSSE('text', text)));
      controller.enqueue(encoder.encode(encodeSSE('stop', 'stop')));
      controller.close();
    },
  });
};

const normalizeMultiAgentText = (payload: any): string => {
  return (
    payload?.message ||
    payload?.response ||
    payload?.answer ||
    payload?.data?.message ||
    payload?.data?.response ||
    ''
  );
};

export const requestMultiAgent = async (payload: ChatStreamPayload, userId: string) => {
  const endpoint = process.env.MULTI_AGENT_ENDPOINT || 'http://localhost:3011/chat';

  if (!endpoint) throw new Error('MULTI_AGENT_ENDPOINT is not configured');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (process.env.MULTI_AGENT_API_KEY) {
    headers.Authorization = `Bearer ${process.env.MULTI_AGENT_API_KEY}`;
  }

  const messages = payload.messages as ChatMessage[];
  const question = extractQuestion(messages);

  const body = {
    conversation_history: toConversationHistory(messages),
    conversationId: nanoid(),
    message: question,
    model: payload.model,
    userId,
  };

  const res = await fetch(endpoint, {
    body: JSON.stringify(body),
    headers,
    method: 'POST',
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Multi-agent upstream error (${res.status}): ${detail}`);
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream') && res.body) {
    return new Response(res.body, {
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'text/event-stream',
        'X-Accel-Buffering': 'no',
      },
    });
  }

  const data = await res.json();
  const text = normalizeMultiAgentText(data);

  return new Response(createTextEventStream(text), {
    headers: {
      'Cache-Control': 'no-cache',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  });
};