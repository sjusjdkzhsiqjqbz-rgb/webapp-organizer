import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM events ORDER BY start').all();
  const events = rows.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    start: r.start,
    end: r.end,
    allDay: !!r.all_day,
    color: r.color,
  }));
  res.json(events);
});

router.post('/', (req, res) => {
  const { title, description, start, end, allDay, color } = req.body;
  const result = db.prepare(
    'INSERT INTO events (title, description, start, end, all_day, color) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, description || '', start, end || null, allDay ? 1 : 0, color || null);
  res.json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, start, end, allDay, color } = req.body;
  db.prepare(
    'UPDATE events SET title = ?, description = ?, start = ?, end = ?, all_day = ?, color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(title, description || '', start, end || null, allDay ? 1 : 0, color || null, id);
  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM events WHERE id = ?').run(id);
  res.json({ success: true });
});

export default router;
