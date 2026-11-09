'use client';

import React, { createContext, useContext, useCallback, useEffect, useSyncExternalStore, ReactNode } from 'react';

const STORAGE_KEY = 'contraband-theme';
const THEME_EVENT = 'contraband-theme-change';
let memoryPreference: boolean | undefined;

interface ThemeContextType {
  isLightMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    memoryPreference = undefined;
    callback();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getSnapshot() {
  // Light-first (FML brand default): light unless the user explicitly chose dark.
  if (memoryPreference !== undefined) return memoryPreference;
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'dark';
  } catch {
    return true;
  }
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
    const nextLight = !getSnapshot();
    try {
      localStorage.setItem(STORAGE_KEY, nextLight ? 'light' : 'dark');
      memoryPreference = undefined;
    } catch {
      memoryPreference = nextLight;
    }
    document.documentElement.classList.toggle('light-mode', nextLight);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', getSnapshot());
  }, [isLightMode]);

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
