import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import { api } from '@/lib/api';

type FlowType = 'signup' | 'recovery';

export default function ResetWithCode() {
  const params = useLocalSearchParams<{ email?: string; flow?: FlowType; confirmationCode?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [flow, setFlow] = useState<FlowType>((params.flow as FlowType) ?? 'recovery');
  const [code, setCode] = useState(params.confirmationCode ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) return Alert.alert('Errore', 'Inserisci la tua email');
    if (!code || code.length < 6) return Alert.alert('Errore', 'Inserisci il codice a 6 cifre');

    try {
      setLoading(true);
      
      if (flow === 'signup') {
        // Conferma email per nuovo utente con Cognito
        const { error } = await api.auth.verifyOtp({
          email,
          token: code,
          type: 'signup'
        });
        if (error) throw error;
        
        Alert.alert('Account confermato!', 'Il tuo account è stato confermato con successo. Ora puoi accedere.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      } else {
        // Flow recovery: reset password
        if (!password || !confirmPassword) throw new Error('Compila tutti i campi password');
        if (password !== confirmPassword) throw new Error('Le password non coincidono');
        if (password.length < 6) throw new Error('La password deve essere di almeno 6 caratteri');
        
        // TODO: Implementare reset password
        Alert.alert('Password aggiornata', 'Ora puoi accedere con la nuova password.', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      }
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  }

  const isRecovery = flow === 'recovery';

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
                <Ionicons name="mail" size={40} color="#fff" />
              </View>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '800', 
                color: Colors.light.text,
                marginBottom: 8,
                textAlign: 'center'
              }}>
                {isRecovery ? 'Reset Password' : 'Conferma Email'}
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.textSecondary,
                textAlign: 'center'
              }}>
                {isRecovery 
                  ? 'Inserisci il codice ricevuto via email per reimpostare la password'
                  : 'Inserisci il codice di 6 cifre inviato alla tua email'
                }
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
                  editable={!params.email} // Bloccato se passato come parametro
                  style={{
                    backgroundColor: params.email ? '#f8f8f8' : '#fff',
                    borderWidth: 1,
                    borderColor: '#e1e1e6',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: params.email ? Colors.light.textSecondary : Colors.light.text
                  }}
                />
              </View>

              {/* Codice */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: Colors.light.text,
                  marginBottom: 8 
                }}>
                  Codice di verifica
                </Text>
                <TextInput
                  placeholder="123456"
                  keyboardType="number-pad"
                  value={code}
                  onChangeText={setCode}
                  maxLength={6}
                  style={{
                    backgroundColor: '#fff',
                    borderWidth: 1,
                    borderColor: '#e1e1e6',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 20,
                    textAlign: 'center',
                    letterSpacing: 4
                  }}
                />
              </View>

              {/* Password fields per recovery */}
              {isRecovery && (
                <>
                  <View>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: Colors.light.text,
                      marginBottom: 8 
                    }}>
                      Nuova password
                    </Text>
                    <TextInput
                      placeholder="Almeno 6 caratteri"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
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

                  <View>
                    <Text style={{ 
                      fontSize: 14, 
                      fontWeight: '600', 
                      color: Colors.light.text,
                      marginBottom: 8 
                    }}>
                      Conferma password
                    </Text>
                    <TextInput
                      placeholder="Ripeti la password"
                      secureTextEntry
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={{
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: password !== confirmPassword && confirmPassword ? '#ff3b30' : '#e1e1e6',
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16
                      }}
                    />
                    {password !== confirmPassword && confirmPassword ? (
                      <Text style={{ 
                        fontSize: 12, 
                        color: '#ff3b30', 
                        marginTop: 4 
                      }}>
                        Le password non coincidono
                      </Text>
                    ) : null}
                  </View>
                </>
              )}
            </View>

            {/* Pulsanti */}
            <View style={{ gap: 12, marginTop: 32 }}>
              <Pressable
                onPress={handleSubmit}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#80a8ff' : Colors.light.tint,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  opacity: loading ? 0.8 : 1
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {isRecovery ? 'Conferma e Aggiorna' : 'Conferma Account'}
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.back()}
                disabled={loading}
                style={{
                  padding: 16,
                  alignItems: 'center',
                  opacity: loading ? 0.5 : 1
                }}
              >
                <Text style={{
                  color: Colors.light.textSecondary,
                  fontSize: 16,
                  fontWeight: '600'
                }}>
                  Annulla
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 