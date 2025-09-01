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
    View,
    Image
} from 'react-native';
import { api } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendResetCode() {
    if (!email) {
      return Alert.alert('Errore', 'Inserisci l\'indirizzo email');
    }

    try {
      setLoading(true);
      const { error } = await api.auth.resetPasswordForEmail(email);
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
      setLoading(false);
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
                <Image 
                  source={require('@/assets/icon.png')}
                  style={{
                    width: 65,
                    height: 65,
                    borderRadius: 10
                  }}
                  resizeMode="contain"
                />
              </View>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '800', 
                color: Colors.light.text,
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Password dimenticata
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.textSecondary,
                textAlign: 'center'
              }}>
                Inserisci la tua email per ricevere il codice di recupero
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
            </View>

            {/* Pulsanti */}
            <View style={{ gap: 12, marginTop: 32 }}>
              <Pressable
                onPress={sendResetCode}
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
                    Invia codice recupero
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
                  Torna al login
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
