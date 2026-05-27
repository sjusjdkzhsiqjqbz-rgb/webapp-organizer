import { useEffect, useState } from 'react';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';

interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string | null;
  createdAt: string;
}

export default function DiaryView() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<DiaryEntry>>({});

  const fetchEntries = async () => {
    const res = await axios.get('/api/diary');
    setEntries(res.data);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const openNew = () => {
    const today = new Date().toISOString().slice(0, 10);
    setEditing({ title: '', content: '', date: today, mood: '' });
    setModalOpen(true);
  };

  const openEdit = (entry: DiaryEntry) => {
    setEditing({ ...entry });
    setModalOpen(true);
  };

  const saveEntry = async () => {
    if (!editing.title || !editing.date) return;
    const payload = {
      title: editing.title,
      content: editing.content || '',
      date: editing.date,
      mood: editing.mood || null,
    };
    if (editing.id) {
      await axios.put(`/api/diary/${editing.id}`, payload);
    } else {
      await axios.post('/api/diary', payload);
    }
    setModalOpen(false);
    setEditing({});
    fetchEntries();
  };

  const deleteEntry = async (id: string) => {
    await axios.delete(`/api/diary/${id}`);
    fetchEntries();
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Personal Diary</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} /> New Entry
        </button>
      </div>
      <div className="flex-1 overflow-auto space-y-4 pr-2">
        {entries.length === 0 && (
          <div className="text-center text-gray-500 py-20">No diary entries yet. Start writing!</div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-semibold">{entry.title}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{entry.date}</span>
                  {entry.mood && (
                    <span className="px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                      {entry.mood}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(entry)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div
              className="prose dark:prose-invert max-w-none ql-content"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl p-6 m-4 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing.id ? 'Edit Entry' : 'New Entry'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4 overflow-auto pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    value={editing.title || ''}
                    onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    value={editing.date || ''}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mood</label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  value={editing.mood || ''}
                  onChange={(e) => setEditing({ ...editing, mood: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content</label>
                <div className="dark:text-gray-100">
                  <ReactQuill
                    theme="snow"
                    value={editing.content || ''}
                    onChange={(value) => setEditing({ ...editing, content: value })}
                    className="bg-white dark:bg-gray-800 rounded-lg"
                    style={{ minHeight: 200 }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800 mt-4">
              <button
                onClick={saveEntry}
                className="flex items-center gap-2 flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors justify-center"
              >
                <Save size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
