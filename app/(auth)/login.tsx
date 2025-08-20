import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'in' | 'up' | 'reset' | null>(null);

  async function signIn() {
    if (!email || !password) return Alert.alert('Compila email e password');
    try {
      setLoading('in');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange in app/index.tsx farà il redirect a /home
    } catch (e: any) {
      Alert.alert('Errore accesso', e.message);
    } finally {
      setLoading(null);
    }
  }

  async function signUp() {
    if (!email || !password) return Alert.alert('Compila email e password');
    try {
      setLoading('up');
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      Alert.alert('Codice inviato', 'Controlla la tua email: inserisci il codice di 6 cifre per confermare l\'account.');
      router.push({ pathname: '/reset-with-code', params: { email, flow: 'signup' } });
    } catch (e: any) {
      Alert.alert('Errore registrazione', e.message);
    } finally {
      setLoading(null);
    }
  }

  async function resetPassword() {
    if (!email) return Alert.alert('Inserisci l\'email', 'Inserisci l\'indirizzo email per reimpostare la password.');
    try {
      setLoading('reset');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      Alert.alert('Codice inviato', 'Abbiamo inviato un codice di 6 cifre alla tua email.', [
        {
          text: 'Ok',
          onPress: () => router.push({ pathname: '/reset-with-code', params: { email, flow: 'recovery' } }),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(null);
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 34, fontWeight: '800', marginBottom: 8 }}>Accedi</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable
          onPress={resetPassword}
          disabled={loading !== null}
          style={{ paddingVertical: 4 }}
        >
          <Text style={{ color: '#0a84ff', fontWeight: '600' }}>
            Password dimenticata? (Codice)
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={signIn}
        disabled={loading !== null}
        style={{ backgroundColor: '#0a84ff', padding: 14, borderRadius: 12, opacity: loading ? 0.7 : 1 }}
      >
        {loading === 'in' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Accedere</Text>
        )}
      </Pressable>

      <Pressable onPress={signUp} disabled={loading !== null} style={{ padding: 14 }}>
        {loading === 'up' ? (
          <ActivityIndicator />
        ) : (
          <Text style={{ textAlign: 'center', fontWeight: '600' }}>Creare un account</Text>
        )}
      </Pressable>
    </View>
  );
}