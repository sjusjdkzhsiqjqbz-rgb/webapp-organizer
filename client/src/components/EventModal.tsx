import { useEffect, useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  description?: string;
}

interface EventModalProps {
  initialEvent: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function EventModal({ initialEvent, open, onClose, onSaved }: EventModalProps) {
  const [form, setForm] = useState<CalendarEvent>({
    id: '',
    title: '',
    start: '',
    end: '',
    allDay: false,
  });

  useEffect(() => {
    if (open) {
      setForm(
        initialEvent || {
          id: '',
          title: '',
          start: '',
          end: '',
          allDay: false,
        }
      );
    }
  }, [open, initialEvent]);

  const saveEvent = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      start: form.start,
      end: form.end || form.start,
      allDay: form.allDay || false,
      color: form.color,
    };
    if (form.id) {
      await axios.put(`/api/events/${form.id}`, payload);
    } else {
      await axios.post('/api/events', payload);
    }
    onSaved();
    onClose();
  };

  const deleteEvent = async () => {
    if (!form.id) return;
    await axios.delete(`/api/events/${form.id}`);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{form.id ? 'Edit Event' : 'New Event'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
              rows={3}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                value={form.start?.slice(0, 16) || ''}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                value={form.end?.slice(0, 16) || ''}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="flex gap-2">
              {['#0ea5e9', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((c) => (
                <button
                  key={c}
                  onClick={() => setForm({ ...form, color: c })}
                  className={`w-8 h-8 rounded-full border-2 ${form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={form.allDay || false}
              onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
            />
            <label htmlFor="allDay" className="text-sm font-medium">All day</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={saveEvent}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg transition-colors"
            >
              Save
            </button>
            {form.id && (
              <button
                onClick={deleteEvent}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
