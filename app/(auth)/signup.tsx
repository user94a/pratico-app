import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
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

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('Errore', 'Inserisci l\'email');
      return false;
    }
    if (!email.includes('@')) {
      Alert.alert('Errore', 'Inserisci un\'email valida');
      return false;
    }
    if (password.length < 8) {
      Alert.alert('Errore', 'La password deve essere di almeno 8 caratteri');
      return false;
    }
    
    // Validazione requisiti Cognito
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      Alert.alert('Errore', 'La password deve contenere almeno:\n• Una lettera maiuscola\n• Una lettera minuscola\n• Un numero\n• Un carattere speciale');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Errore', 'Le password non coincidono');
      return false;
    }
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const { error } = await api.auth.signUp(email.trim(), password);

      if (error) throw error;

      // Mostra modale di sistema per verifica email
      Alert.alert(
        'Controlla la tua email',
        'Ti abbiamo inviato un codice di verifica a 6 cifre. Controlla la tua email e inserisci il codice per confermare l\'account.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/reset-with-code',
                params: { 
                  email: email.trim(), 
                  flow: 'signup'
                }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Errore registrazione', error.message);
    } finally {
      setLoading(false);
    }
  };

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
                marginBottom: 8
              }}>
                Crea Account
              </Text>
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.textSecondary,
                textAlign: 'center'
              }}>
                Inserisci i tuoi dati per registrarti
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
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
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
                    placeholder="Almeno 8 caratteri con maiuscole, minuscole, numeri e simboli"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
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

              {/* Conferma Password */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: Colors.light.text,
                  marginBottom: 8 
                }}>
                  Conferma Password
                </Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    placeholder="Ripeti la password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    style={{
                      backgroundColor: '#fff',
                      borderWidth: 1,
                      borderColor: password !== confirmPassword && confirmPassword ? '#ff3b30' : '#e1e1e6',
                      borderRadius: 12,
                      padding: 16,
                      paddingRight: 50,
                      fontSize: 16
                    }}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: 16,
                      top: 16,
                      padding: 4
                    }}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? 'eye-off' : 'eye'} 
                      size={20} 
                      color={Colors.light.textSecondary} 
                    />
                  </Pressable>
                </View>
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
            </View>

            {/* Pulsanti */}
            <View style={{ gap: 12, marginTop: 32 }}>
              <Pressable
                onPress={handleSignUp}
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
                    Crea Account
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
                  Hai già un account? Accedi
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
