import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all() as any[];
  const settings: Record<string, string> = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json({
    openaiUrl: settings.openaiUrl || 'https://api.openai.com/v1',
    openaiKey: settings.openaiKey || '',
    model: settings.model || 'gpt-4o-mini',
    theme: settings.theme || 'system',
    calendarView: settings.calendarView || 'dayGridMonth',
  });
});

router.post('/', (req, res) => {
  const { openaiUrl, openaiKey, model, theme, calendarView } = req.body;
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  if (openaiUrl !== undefined) stmt.run('openaiUrl', openaiUrl);
  if (openaiKey !== undefined) stmt.run('openaiKey', openaiKey);
  if (model !== undefined) stmt.run('model', model);
  if (theme !== undefined) stmt.run('theme', theme);
  if (calendarView !== undefined) stmt.run('calendarView', calendarView);
  res.json({ success: true });
});

export default router;
