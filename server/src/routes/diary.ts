import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (req, res) => {
  const date = req.query.date as string | undefined;
  let rows: any[];
  if (date) {
    rows = db.prepare('SELECT * FROM diary_entries WHERE date = ? ORDER BY created_at DESC').all(date);
  } else {
    rows = db.prepare('SELECT * FROM diary_entries ORDER BY date DESC, created_at DESC').all();
  }
  const entries = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    content: r.content,
    date: r.date,
    mood: r.mood,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(entries);
});

router.post('/', (req, res) => {
  const { title, content, date, mood } = req.body;
  const result = db.prepare(
    'INSERT INTO diary_entries (title, content, date, mood) VALUES (?, ?, ?, ?)'
  ).run(title, content || '', date, mood || null);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, date, mood } = req.body;
  db.prepare(
    'UPDATE diary_entries SET title = ?, content = ?, date = ?, mood = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title, content || '', date, mood || null, id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM diary_entries WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
