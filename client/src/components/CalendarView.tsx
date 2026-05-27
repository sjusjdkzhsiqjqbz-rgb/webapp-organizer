import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Plus } from 'lucide-react';
import EventModal, { CalendarEvent } from './EventModal';

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

      <EventModal
        initialEvent={editing}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSaved={fetchEvents}
      />
    </div>
  );
}
