import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'password' | 'completed'>('email');

  // Controlla se l'utente ha già un token di accesso valido
  useEffect(() => {
    checkAuthStatus();
  }, []);

  async function checkAuthStatus() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Se l'utente ha già una sessione valida, vai direttamente al passo password
        setStep('password');
        // Pre-compila l'email se disponibile
        if (session.user.email) {
          setEmail(session.user.email);
        }
      }
    } catch (error) {
      console.log('Errore nel controllo della sessione:', error);
    }
  }

  async function sendResetEmail() {
    if (!email) {
      return Alert.alert('Errore', 'Inserisci l\'indirizzo email');
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pratico://reset-password',
      });
      
      if (error) throw error;
      
      Alert.alert(
        'Email inviata', 
        'Controlla la tua casella di posta per reimpostare la password. Clicca sul link per aprire l\'app.',
        [{ text: 'OK' }]
      );
      
      // Passa al passo password
      setStep('password');
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function updatePassword() {
    if (!password || !confirmPassword) {
      return Alert.alert('Errore', 'Compila tutti i campi');
    }
    
    if (password !== confirmPassword) {
      return Alert.alert('Errore', 'Le password non coincidono');
    }
    
    if (password.length < 6) {
      return Alert.alert('Errore', 'La password deve essere di almeno 6 caratteri');
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      
      if (error) throw error;
      
      setStep('completed');
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'email') {
    return (
      <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
        <Text style={{ fontSize: 34, fontWeight: '800', marginBottom: 8 }}>Reset Password</Text>
        
        <Text style={{ opacity: 0.7, marginBottom: 16 }}>
          Inserisci la tua email per ricevere il link di reset
        </Text>

        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          style={{ borderWidth: 1, borderColor: '#d1d1d6', borderRadius: 12, padding: 12 }}
        />

        <Pressable
          onPress={sendResetEmail}
          disabled={loading}
          style={{ backgroundColor: '#0a84ff', padding: 14, borderRadius: 12, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
              Invia Email
            </Text>
          )}
        </Pressable>

        <Pressable 
          onPress={() => router.back()} 
          style={{ padding: 14 }}
          disabled={loading}
        >
          <Text style={{ textAlign: 'center', fontWeight: '600' }}>
            Torna al login
          </Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'password') {
    return (
      <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
        <Text style={{ fontSize: 34, fontWeight: '800', marginBottom: 8 }}>Nuova Password</Text>
        
        <Text style={{ opacity: 0.7, marginBottom: 16 }}>
          Inserisci la tua nuova password
        </Text>

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

        <Pressable
          onPress={updatePassword}
          disabled={loading}
          style={{ backgroundColor: '#0a84ff', padding: 14, borderRadius: 12, opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
              Aggiorna Password
            </Text>
          )}
        </Pressable>

        <Pressable 
          onPress={() => setStep('email')} 
          style={{ padding: 14 }}
          disabled={loading}
        >
          <Text style={{ textAlign: 'center', fontWeight: '600' }}>
            Torna indietro
          </Text>
        </Pressable>
      </View>
    );
  }

  if (step === 'completed') {
    return (
      <View style={{ flex: 1, padding: 24, gap: 12, justifyContent: 'center' }}>
        <Text style={{ fontSize: 34, fontWeight: '800', marginBottom: 8 }}>Reset Completato</Text>
        
        <View style={{ backgroundColor: '#d4edda', padding: 20, borderRadius: 12, marginBottom: 20 }}>
          <Text style={{ color: '#155724', textAlign: 'center', fontWeight: '600' }}>
            ✅ Password aggiornata con successo!
          </Text>
          <Text style={{ color: '#155724', textAlign: 'center', marginTop: 8 }}>
            Ora puoi tornare al login e accedere con la tua nuova password.
          </Text>
        </View>

        <Pressable
          onPress={() => router.replace('/login')}
          style={{ backgroundColor: '#34c759', padding: 14, borderRadius: 12 }}
        >
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Vai al Login
          </Text>
        </Pressable>
      </View>
    );
  }

  return null;
}