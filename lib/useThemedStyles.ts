import { createThemedStyles } from './styles';
import { useTheme } from './theme';

export function useThemedStyles() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const styles = createThemedStyles(isDark);
  
  return {
    isDark,
    styles,
    actualTheme
  };
} 