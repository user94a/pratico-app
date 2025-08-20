import { Redirect } from 'expo-router';
 
export default function ResetPasswordRedirect() {
  // Redirect al reset password nella directory auth
  return <Redirect href="/(auth)/reset-password" />;
} 