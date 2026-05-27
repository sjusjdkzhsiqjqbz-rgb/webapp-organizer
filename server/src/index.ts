import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import eventsRouter from './routes/events';
import diaryRouter from './routes/diary';
import settingsRouter from './routes/settings';
import chatRouter from './routes/chat';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

app.use('/api/events', eventsRouter);
app.use('/api/diary', diaryRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/chat', chatRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
