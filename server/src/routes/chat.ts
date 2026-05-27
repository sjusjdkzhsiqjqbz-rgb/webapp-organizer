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

router.post('/', async (req, res) => {
  try {
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
      for (const call of toolCalls) {
        const args = JSON.parse(call.function.arguments);
        if (call.function.name === 'create_calendar_event') {
          const result = db.prepare(
            'INSERT INTO events (title, description, start, end, all_day, color) VALUES (?, ?, ?, ?, ?, ?)'
          ).run(
            args.title,
            args.description || '',
            args.start,
            args.end || null,
            args.allDay ? 1 : 0,
            args.color || null
          );
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            content: JSON.stringify({ success: true, id: result.lastInsertRowid }),
          });
        } else if (call.function.name === 'create_diary_entry') {
          const result = db.prepare(
            'INSERT INTO diary_entries (title, content, date, mood) VALUES (?, ?, ?, ?)'
          ).run(args.title, args.content || '', args.date, args.mood || null);
          toolResults.push({
            tool_call_id: call.id,
            role: 'tool',
            content: JSON.stringify({ success: true, id: result.lastInsertRowid }),
          });
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
      res.json({ message: second.choices[0].message });
    } else {
      res.json({ message: choice.message });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Chat error' });
  }
});

export default router;
