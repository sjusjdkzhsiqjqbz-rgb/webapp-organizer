import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, BookOpen, MessageCircle, Settings, Moon, Sun, List } from 'lucide-react';
import { useStore } from '../store/useStore';

export default function Layout() {
  const { theme, setTheme } = useStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
      isActive
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col p-4 bg-gray-50 dark:bg-gray-950">
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-purple-600 bg-clip-text text-transparent">
            Organizer
          </h1>
        </div>
        <nav className="flex-1 space-y-1">
          <NavLink to="/calendar" className={navClass}>
            <Calendar size={20} />
            <span className="font-medium">Calendar</span>
          </NavLink>
          <NavLink to="/events" className={navClass}>
            <List size={20} />
            <span className="font-medium">Events</span>
          </NavLink>
          <NavLink to="/diary" className={navClass}>
            <BookOpen size={20} />
            <span className="font-medium">Diary</span>
          </NavLink>
          <NavLink to="/chat" className={navClass}>
            <MessageCircle size={20} />
            <span className="font-medium">AI Chat</span>
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            <Settings size={20} />
            <span className="font-medium">Settings</span>
          </NavLink>
        </nav>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            <span className="font-medium">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
