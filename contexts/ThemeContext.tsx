'use client';

import React, { createContext, useContext, useCallback, useEffect, useSyncExternalStore, ReactNode } from 'react';

const STORAGE_KEY = 'contraband-theme';
const THEME_EVENT = 'contraband-theme-change';

interface ThemeContextType {
  isLightMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getSnapshot() {
  // Light-first (FML brand default): light unless the user explicitly chose dark.
  return localStorage.getItem(STORAGE_KEY) !== 'dark';
}

// Server (and first hydration paint) render the light theme by default. The
// pre-hydration inline script in the root layout applies the `light-mode`
// class to <html> before paint (unless the user chose dark), so there is no
// flash even though React state catches up immediately after hydration.
function getServerSnapshot() {
  return true;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const isLightMode = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const currentlyLight = localStorage.getItem(STORAGE_KEY) !== 'dark';
    const nextLight = !currentlyLight;
    localStorage.setItem(STORAGE_KEY, nextLight ? 'light' : 'dark');
    document.documentElement.classList.toggle('light-mode', nextLight);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  useEffect(() => {
    document.body.classList.add('ready');
  }, []);

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
