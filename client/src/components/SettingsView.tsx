import { useState, useEffect } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';
import { Save, CheckCircle } from 'lucide-react';

export default function SettingsView() {
  const { settings, setSettings } = useStore();
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setForm({ ...settings });
  }, [settings]);

  const handleSave = async () => {
    await axios.post('/api/settings', {
      openaiUrl: form.openaiUrl,
      openaiKey: form.openaiKey,
      theme: form.theme,
      calendarView: form.calendarView,
    });
    setSettings({ ...form });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-auto p-6">
      <h2 className="text-xl font-semibold mb-6">Settings</h2>
      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-lg font-medium mb-4">AI Provider</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">API URL</label>
              <input
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                value={form.openaiUrl}
                onChange={(e) => setForm({ ...form, openaiUrl: e.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                value={form.openaiKey}
                onChange={(e) => setForm({ ...form, openaiKey: e.target.value })}
                placeholder="sk-..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-lg font-medium mb-4">Appearance</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Theme</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                value={form.theme}
                onChange={(e) => setForm({ ...form, theme: e.target.value as any })}
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h3 className="text-lg font-medium mb-4">Calendar Defaults</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Default View</label>
              <select
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"
                value={form.calendarView}
                onChange={(e) => setForm({ ...form, calendarView: e.target.value })}
              >
                <option value="dayGridMonth">Month</option>
                <option value="timeGridWeek">Week</option>
                <option value="timeGridDay">Day</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
        >
          {saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
