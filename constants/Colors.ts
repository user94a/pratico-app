/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark theme.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a84ff';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000000',
    textSecondary: '#8e8e93',
    background: '#f2f2f7', // iOS Settings background
    cardBackground: '#ffffff', // White cards
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#c6c6c8', // iOS separator color
    success: '#34c759',
    warning: '#ff9500',
    error: '#ff3b30',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#8e8e93',
    background: '#000000',
    cardBackground: '#1c1c1e',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#38383a',
    success: '#34c759',
    warning: '#ff9500',
    error: '#ff3b30',
  },
};
