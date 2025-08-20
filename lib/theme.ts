import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext } from 'react';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface ThemeContextType {
  mode: ThemeMode;
  actualTheme: 'light' | 'dark';
  setTheme: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'auto',
  actualTheme: 'light',
  setTheme: () => {}
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = '@theme_mode';

export const getStoredTheme = async (): Promise<ThemeMode> => {
  try {
    const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    return (storedTheme as ThemeMode) || 'auto';
  } catch {
    return 'auto';
  }
};

export const setStoredTheme = async (mode: ThemeMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Fail silently
  }
}; 