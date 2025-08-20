import { Redirect } from 'expo-router';

export default function ResetWithCodeRedirect() {
  return <Redirect href="/(auth)/reset-with-code" />;
} 