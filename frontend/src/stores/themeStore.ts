import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  sidebarTheme: Theme;
  toggleSidebarTheme: () => void;
  setSidebarTheme: (theme: Theme) => void;
}

const THEME_STORAGE_KEY = 'spanner-sidebar-theme';

const getInitialTheme = (): Theme => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

const applyDarkClass = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Apply initial theme on load
applyDarkClass(getInitialTheme());

export const useThemeStore = create<ThemeState>((set) => ({
  sidebarTheme: getInitialTheme(),

  toggleSidebarTheme: () => {
    set((state) => {
      const newTheme = state.sidebarTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      applyDarkClass(newTheme);
      return { sidebarTheme: newTheme };
    });
  },

  setSidebarTheme: (theme: Theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    applyDarkClass(theme);
    set({ sidebarTheme: theme });
  },
}));
