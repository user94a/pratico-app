import { useColorScheme as useSystemColorScheme } from 'react-native'

export function useColorScheme() {
  const systemColorScheme = useSystemColorScheme()
  return systemColorScheme
} 