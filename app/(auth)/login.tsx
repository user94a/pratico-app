import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';
import { supabase } from '../../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'in' | 'reset' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function signIn() {
    console.log('signIn called with:', { email, password: password ? '***' : 'empty' });
    
    if (!email || !password) {
      console.log('Validation failed - missing email or password');
      return Alert.alert('Errore', 'Compila email e password');
    }
    
    try {
      console.log('Starting login process...');
      setLoading('in');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.log('Supabase error:', error);
        throw error;
      }
      console.log('Login successful');
      // onAuthStateChange in app/index.tsx farà il redirect, ma aggiungiamo un backup
      setTimeout(() => {
        router.replace('/(tabs)/scadenze');
      }, 100);
    } catch (e: any) {
      console.log('Login error:', e);
      Alert.alert('Errore accesso', e.message);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
            {/* Header con logo */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: Colors.light.tint,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Ionicons name="cube" size={40} color="#fff" />
              </View>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '800', 
                color: Colors.light.text,
                marginBottom: 8
              }}>
                Benvenuto
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.textSecondary,
                textAlign: 'center'
              }}>
                Accedi al tuo account
              </Text>
            </View>

            {/* Form */}
            <View style={{ gap: 16 }}>
              {/* Email */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: Colors.light.text,
                  marginBottom: 8 
                }}>
                  Email
                </Text>
                <TextInput
                  placeholder="la-tua-email@esempio.com"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                  style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#e1e1e6',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16
                  }}
                />
              </View>

              {/* Password */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: Colors.light.text,
                  marginBottom: 8 
                }}>
                  Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    placeholder="La tua password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    style={{
                      backgroundColor: '#fff',
                      borderWidth: 1,
                      borderColor: '#e1e1e6',
                      borderRadius: 12,
                      padding: 16,
                      paddingRight: 50,
                      fontSize: 16
                    }}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: 16,
                      padding: 4
                    }}
                  >
                    <Ionicons 
                      name={showPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={Colors.light.textSecondary} 
                    />
                  </Pressable>
                </View>
              </View>

              {/* Password dimenticata */}
              <View style={{ alignItems: 'flex-end' }}>
                <Pressable
                  onPress={resetPassword}
                  disabled={loading !== null}
                  style={{ paddingVertical: 4 }}
                >
                  <Text style={{ color: Colors.light.tint, fontWeight: '600' }}>
                    Password dimenticata?
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Pulsanti */}
            <View style={{ gap: 12, marginTop: 32 }}>
              <Pressable
                onPress={() => {
                  console.log('Login button pressed');
                  signIn();
                }}
                disabled={loading !== null}
                style={{
                  backgroundColor: loading ? '#80a8ff' : Colors.light.tint,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: loading ? 0.8 : 1
                }}
              >
                {loading === 'in' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    Accedi
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push('/signup')}
                disabled={loading !== null}
                style={{
                  backgroundColor: '#fff',
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e1e1e6',
                  opacity: loading ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: Colors.light.tint,
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Crea Account
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}