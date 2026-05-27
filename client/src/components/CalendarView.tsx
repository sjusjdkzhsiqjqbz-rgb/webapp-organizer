import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { X, Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  color?: string;
  description?: string;
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const calendarRef = useRef<FullCalendar>(null);
  const { settings } = useStore();
  const is12h = settings.timeFormat === '12h';
  const timeFormatOpts: Record<string, string | boolean | undefined> = is12h
    ? { hour: 'numeric', minute: '2-digit', meridiem: 'short' }
    : { hour: '2-digit', minute: '2-digit', hour12: false };

  const fetchEvents = async () => {
    const res = await axios.get('/api/events');
    setEvents(res.data);
  };

  const refreshKey = useStore((s) => s.refreshKey);

  useEffect(() => {
    fetchEvents();
  }, [refreshKey]);

  const handleDateSelect = (selectInfo: any) => {
    setEditing({
      id: '',
      title: '',
      start: selectInfo.startStr,
      end: selectInfo.endStr || selectInfo.startStr,
      allDay: selectInfo.allDay,
    });
    setModalOpen(true);
  };

  const handleEventClick = (clickInfo: any) => {
    const ev = clickInfo.event;
    setEditing({
      id: ev.id,
      title: ev.title,
      start: ev.startStr,
      end: ev.endStr || ev.startStr,
      allDay: ev.allDay,
      color: ev.backgroundColor || ev.color,
      description: ev.extendedProps?.description || '',
    });
    setModalOpen(true);
  };

  const saveEvent = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title,
      description: editing.description,
      start: editing.start,
      end: editing.end || editing.start,
      allDay: editing.allDay || false,
      color: editing.color,
    };
    if (editing.id) {
      await axios.put(`/api/events/${editing.id}`, payload);
    } else {
      await axios.post('/api/events', payload);
    }
    setModalOpen(false);
    setEditing(null);
    fetchEvents();
  };

  const deleteEvent = async () => {
    if (!editing?.id) return;
    await axios.delete(`/api/events/${editing.id}`);
    setModalOpen(false);
    setEditing(null);
    fetchEvents();
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const now = new Date();
              const iso = now.toISOString().slice(0, 16);
              setEditing({ id: '', title: '', start: iso, end: iso, allDay: false });
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={18} /> New Event
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView={settings.calendarView || 'dayGridMonth'}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          firstDay={1}
          events={events}
          select={handleDateSelect}
          eventClick={handleEventClick}
          slotLabelFormat={timeFormatOpts}
          eventTimeFormat={timeFormatOpts}
          height="100%"
        />
      </div>

      {modalOpen && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing.id ? 'Edit Event' : 'New Event'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    value={editing.start?.slice(0, 16) || ''}
                    onChange={(e) => setEditing({ ...editing, start: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End</label>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                    value={editing.end?.slice(0, 16) || ''}
                    onChange={(e) => setEditing({ ...editing, end: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <div className="flex gap-2">
                  {['#0ea5e9', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setEditing({ ...editing, color: c })}
                      className={`w-8 h-8 rounded-full border-2 ${editing.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={editing.allDay || false}
                  onChange={(e) => setEditing({ ...editing, allDay: e.target.checked })}
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
                {editing.id && (
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
      )}
    </div>
  );
}
