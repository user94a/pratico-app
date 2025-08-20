import { ThemeContext, ThemeMode, getStoredTheme, setStoredTheme } from '@/lib/theme';
import { ReactNode, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('auto');

  // Calcola il tema effettivo basato su mode e sistema
  const actualTheme = themeMode === 'auto' 
    ? (systemColorScheme || 'light')
    : themeMode === 'dark' 
      ? 'dark' 
      : 'light';

  // Carica il tema salvato all'avvio
  useEffect(() => {
    getStoredTheme().then(setThemeMode);
  }, []);

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    await setStoredTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{
      mode: themeMode,
      actualTheme,
      setTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
} 