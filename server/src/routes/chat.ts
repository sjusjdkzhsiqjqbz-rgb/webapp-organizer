import { Router } from 'express';
import OpenAI from 'openai';
import db from '../db';

const router = Router();

function getClient() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'openaiUrl'").get() as any;
  const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'openaiKey'").get() as any;
  const baseURL = row?.value || 'https://api.openai.com/v1';
  const apiKey = keyRow?.value || '';
  return new OpenAI({ baseURL, apiKey });
}

function getApiKey() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'openaiKey'").get() as any;
  return row?.value || '';
}

function getModel() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'model'").get() as any;
  return row?.value || 'gpt-4o-mini';
}

const tools: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_calendar_event',
      description: 'Create a calendar event for the user',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Event title' },
          description: { type: 'string', description: 'Event description' },
          start: { type: 'string', description: 'ISO 8601 start datetime' },
          end: { type: 'string', description: 'ISO 8601 end datetime (optional)' },
          allDay: { type: 'boolean', description: 'Whether it is an all-day event' },
          color: { type: 'string', description: 'Color for the event (optional, hex or named color)' },
        },
        required: ['title', 'start'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_diary_entry',
      description: 'Create a personal diary entry for the user',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Diary entry title' },
          content: { type: 'string', description: 'Rich text content' },
          date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
          mood: { type: 'string', description: 'Mood or emotion tag (optional)' },
        },
        required: ['title', 'content', 'date'],
      },
    },
  },
];

interface ToolCallResult {
  name: string;
  success: boolean;
  id?: number;
  error?: string;
}

router.post('/', async (req, res) => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      res.status(400).json({ error: 'No API key configured. Please add your OpenAI API key in Settings.' });
      return;
    }

    const { messages } = req.body as { messages: OpenAI.Chat.ChatCompletionMessageParam[] };
    const client = getClient();

    const model = getModel();
    const completion = await client.chat.completions.create({
      model,
      messages,
      tools,
      tool_choice: 'auto',
    });

    const choice = completion.choices[0];
    if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCalls = choice.message.tool_calls;
      const toolResults: OpenAI.Chat.ChatCompletionToolMessageParam[] = [];
      const toolCallResults: ToolCallResult[] = [];

      for (const call of toolCalls) {
        const fnName = call.function.name;
        try {
          const rawArgs = JSON.parse(call.function.arguments);

          if (fnName === 'create_calendar_event') {
            const title = typeof rawArgs.title === 'string' ? rawArgs.title.trim() : '';
            const start = typeof rawArgs.start === 'string' ? rawArgs.start.trim() : '';
            if (!title) throw new Error('Event title is required');
            if (!start) throw new Error('Event start time is required');

            const result = db.prepare(
              'INSERT INTO events (title, description, start, end, all_day, color) VALUES (?, ?, ?, ?, ?, ?)'
            ).run(
              title,
              rawArgs.description || '',
              start,
              rawArgs.end || null,
              rawArgs.allDay ? 1 : 0,
              rawArgs.color || null
            );
            toolResults.push({
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify({ success: true, id: Number(result.lastInsertRowid) }),
            });
            toolCallResults.push({ name: fnName, success: true, id: Number(result.lastInsertRowid) });
          } else if (fnName === 'create_diary_entry') {
            const title = typeof rawArgs.title === 'string' ? rawArgs.title.trim() : '';
            const content = typeof rawArgs.content === 'string' ? rawArgs.content.trim() : '';
            const date = typeof rawArgs.date === 'string' ? rawArgs.date.trim() : '';
            if (!title) throw new Error('Diary title is required');
            if (!content) throw new Error('Diary content is required');
            if (!date) throw new Error('Diary date is required');

            const result = db.prepare(
              'INSERT INTO diary_entries (title, content, date, mood) VALUES (?, ?, ?, ?)'
            ).run(title, content, date, rawArgs.mood || null);
            toolResults.push({
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify({ success: true, id: Number(result.lastInsertRowid) }),
            });
            toolCallResults.push({ name: fnName, success: true, id: Number(result.lastInsertRowid) });
          } else {
            toolResults.push({
              tool_call_id: call.id,
              role: 'tool',
              content: JSON.stringify({ success: false, error: `Unknown tool: ${fnName}` }),
            });
            toolCallResults.push({ name: fnName, success: false, error: `Unknown tool: ${fnName}` });
          }
        } catch (toolErr: any) {
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            content: JSON.stringify({ success: false, error: toolErr.message }),
          });
          toolCallResults.push({ name: fnName, success: false, error: toolErr.message });
        }
      }

      const second = await client.chat.completions.create({
        model,
        messages: [
          ...messages,
          choice.message,
          ...toolResults,
        ],
        tools,
        tool_choice: 'auto',
      });
      res.json({ message: second.choices[0].message, toolCallResults });
    } else {
      res.json({ message: choice.message, toolCallResults: [] });
    }
  } catch (err: any) {
    console.error('Chat error:', err);
    const status = err.status || err.statusCode;
    if (status === 401 || status === 403) {
      res.status(401).json({ error: 'Authentication failed. Please check your API key in Settings.' });
    } else if (status === 429) {
      res.status(429).json({ error: 'Rate limited by the AI provider. Please wait and try again.' });
    } else {
      res.status(500).json({ error: err.message || 'Chat error' });
    }
  }
});

export default router;
