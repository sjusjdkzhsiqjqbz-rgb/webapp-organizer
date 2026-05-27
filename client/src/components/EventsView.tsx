import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Plus, Search } from 'lucide-react';
import EventModal, { CalendarEvent } from './EventModal';

interface GroupedEvents {
  [day: string]: CalendarEvent[];
}

export default function EventsView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const refreshKey = useStore((s) => s.refreshKey);

  const fetchEvents = async () => {
    const res = await axios.get('/api/events');
    setEvents(res.data);
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshKey]);

  const uniqueMonths = useMemo(() => {
    const months = new Set<string>();
    for (const ev of events) {
      if (ev.start) {
        months.add(ev.start.slice(0, 7));
      }
    }
    return Array.from(months).sort();
  }, [events]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (monthFilter !== 'all') {
      result = result.filter((ev) => ev.start?.slice(0, 7) === monthFilter);
    }

    if (timeFilter !== 'all') {
      result = result.filter((ev) => {
        const hour = new Date(ev.start).getHours();
        if (timeFilter === 'before') return hour < 12;
        if (timeFilter === 'after') return hour >= 12;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (ev) =>
          ev.title.toLowerCase().includes(q) ||
          (ev.description && ev.description.toLowerCase().includes(q))
      );
    }

    return result;
  }, [events, monthFilter, timeFilter, search]);

  const grouped: GroupedEvents = useMemo(() => {
    const groups: GroupedEvents = {};
    for (const ev of filteredEvents) {
      const day = ev.start?.slice(0, 10) ?? '';
      if (!groups[day]) groups[day] = [];
      groups[day].push(ev);
    }
    for (const day of Object.keys(groups)) {
      groups[day].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    }
    return groups;
  }, [filteredEvents]);

  const sortedDays = useMemo(
    () => Object.keys(grouped).sort(),
    [grouped]
  );

  const openNew = () => {
    const now = new Date();
    const iso = now.toISOString().slice(0, 16);
    setEditing({ id: '', title: '', start: iso, end: iso, allDay: false });
    setModalOpen(true);
  };

  const openEdit = (ev: CalendarEvent) => {
    setEditing(ev);
    setModalOpen(true);
  };

  const formatDay = (day: string) => {
    const d = new Date(day + 'T00:00:00');
    return d.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Events</h2>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={18} /> New Event
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All months</option>
          {uniqueMonths.map((m) => (
            <option key={m} value={m}>
              {new Date(m + '-01T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All times</option>
          <option value="before">Before 12:00</option>
          <option value="after">After 12:00</option>
        </select>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
        {sortedDays.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-12">
            No events found.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDays.map((day) => (
              <div key={day}>
                <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {formatDay(day)}
                  </h3>
                </div>
                <div className="space-y-2">
                  {grouped[day].map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => openEdit(ev)}
                      className="w-full text-left flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div
                        className="w-1.5 h-full min-h-[2.5rem] rounded-full flex-shrink-0 self-stretch"
                        style={{ backgroundColor: ev.color || '#0ea5e9' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
                            {ev.title}
                          </span>
                          {ev.allDay && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">
                              All day
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {ev.allDay
                            ? 'All day'
                            : `${formatTime(ev.start)}${ev.end && ev.end !== ev.start ? ' – ' + formatTime(ev.end) : ''}`}
                        </div>
                        {ev.description && (
                          <div
                            className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2"
                            dangerouslySetInnerHTML={{ __html: ev.description }}
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
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
