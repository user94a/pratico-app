import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type FlowType = 'signup' | 'recovery';

export default function ResetWithCode() {
  const params = useLocalSearchParams<{ email?: string; flow?: FlowType }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [flow, setFlow] = useState<FlowType>((params.flow as FlowType) ?? 'recovery');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) return Alert.alert('Errore', 'Inserisci la tua email');
    if (!code || code.length < 6) return Alert.alert('Errore', 'Inserisci il codice a 6 cifre');

    try {
      setLoading(true);
      // Verifica OTP in base al flow
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: flow === 'signup' ? 'signup' : 'recovery',
      });
      if (verifyErr) throw verifyErr;

      if (flow === 'recovery') {
        if (!password || !confirmPassword) throw new Error('Compila tutti i campi password');
        if (password !== confirmPassword) throw new Error('Le password non coincidono');
        if (password.length < 6) throw new Error('La password deve essere di almeno 6 caratteri');
        const { error: updErr } = await supabase.auth.updateUser({ password });
        if (updErr) throw updErr;
        Alert.alert('Password aggiornata', 'Ora puoi accedere con la nuova password.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
        return;
      }

      // Flow signup: utente confermato (di solito già autenticato)
      Alert.alert('Email confermata', 'Il tuo account è stato confermato.', [
        { text: 'OK', onPress: () => router.replace('/home') },
      ]);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  }

  const isRecovery = flow === 'recovery';

  return (
    <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
      <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 8 }}>
        {isRecovery ? 'Reset con Codice' : 'Conferma Email'}
      </Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
      />

      <TextInput
        placeholder="Codice (6 cifre)"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
        style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
      />

      {isRecovery && (
        <>
          <TextInput
            placeholder="Nuova password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
          />

          <TextInput
            placeholder="Conferma password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
          />
        </>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={{ backgroundColor: '#0a84ff', padding: 14, borderRadius: 12, opacity: loading ? 0.7 : 1 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            {isRecovery ? 'Conferma e aggiorna' : 'Conferma'}
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.back()} style={{ padding: 14 }} disabled={loading}>
        <Text style={{ textAlign: 'center', fontWeight: '600' }}>Annulla</Text>
      </Pressable>
    </View>
  );
} 