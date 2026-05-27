import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import CalendarView from './components/CalendarView';
import DiaryView from './components/DiaryView';
import ChatView from './components/ChatView';
import SettingsView from './components/SettingsView';
import { useStore } from './store/useStore';
import { useEffect } from 'react';
import axios from 'axios';

function App() {
  const { applySystemTheme, setSettings } = useStore();

  useEffect(() => {
    applySystemTheme();
    axios.get('/api/settings').then((res) => {
      setSettings(res.data);
      if (res.data.theme === 'light') useStore.getState().setTheme('light');
      else if (res.data.theme === 'dark') useStore.getState().setTheme('dark');
      else useStore.getState().applySystemTheme();
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/calendar" replace />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="diary" element={<DiaryView />} />
        <Route path="chat" element={<ChatView />} />
        <Route path="settings" element={<SettingsView />} />
      </Route>
    </Routes>
  );
}

export default App;
