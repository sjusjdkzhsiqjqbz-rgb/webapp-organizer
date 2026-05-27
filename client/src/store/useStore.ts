import { create } from 'zustand';

interface Settings {
  openaiUrl: string;
  openaiKey: string;
  model: string;
  theme: 'light' | 'dark' | 'system';
  calendarView: string;
}

interface AppState {
  theme: 'light' | 'dark' | 'system';
  settings: Settings;
  refreshKey: number;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  applySystemTheme: () => void;
  setSettings: (settings: Partial<Settings>) => void;
  triggerRefresh: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  theme: 'dark',
  refreshKey: 0,
  settings: {
    openaiUrl: 'https://api.openai.com/v1',
    openaiKey: '',
    model: 'gpt-4o-mini',
    theme: 'system',
    calendarView: 'dayGridMonth',
  },
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
  applySystemTheme: () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
  setSettings: (partial) => {
    const next = { ...get().settings, ...partial };
    set({ settings: next });
    if (next.theme === 'light') get().setTheme('light');
    else if (next.theme === 'dark') get().setTheme('dark');
    else get().applySystemTheme();
  },
  triggerRefresh: () => set({ refreshKey: get().refreshKey + 1 }),
}));
