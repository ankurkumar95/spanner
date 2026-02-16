import { create } from 'zustand';

interface ThemeState {
  sidebarTheme: 'light' | 'dark';
  toggleSidebarTheme: () => void;
  setSidebarTheme: (theme: 'light' | 'dark') => void;
}

const THEME_STORAGE_KEY = 'spanner-sidebar-theme';

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>((set) => ({
  sidebarTheme: getInitialTheme(),

  toggleSidebarTheme: () => {
    set((state) => {
      const newTheme = state.sidebarTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      return { sidebarTheme: newTheme };
    });
  },

  setSidebarTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    set({ sidebarTheme: theme });
  },
}));
