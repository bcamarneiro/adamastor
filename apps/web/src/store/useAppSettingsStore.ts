import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppSettings {
  leftSidebarExpanded: boolean;
  setLeftSidebarExpanded: (expanded: boolean) => void;

  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useAppSettingsStore = create<AppSettings>()(
  persist(
    (set) => ({
      leftSidebarExpanded: true,
      setLeftSidebarExpanded: (expanded: boolean) =>
        set({ leftSidebarExpanded: expanded }),

      theme: 'light',
      setTheme: (theme: 'light' | 'dark') => set({ theme }),
    }),
    {
      name: 'sidebar-storage',
    },
  ),
);
