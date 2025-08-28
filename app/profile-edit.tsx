import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function ProfileEdit() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nome, cognome')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setNome(profile.nome || '');
          setCognome(profile.cognome || '');
        }
      }
    } catch (error) {
      console.log('Errore caricamento profilo:', error);
    }
  }

  async function handleSaveProfile() {
    try {
      setSaveLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Utente non autenticato');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          nome: nome.trim(),
          cognome: cognome.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      Alert.alert('Successo', 'Profilo aggiornato', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    } finally {
      setSaveLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.cardBackground }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.33,
        borderBottomColor: Colors.light.border,
        backgroundColor: Colors.light.cardBackground
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F2F2F7',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <MaterialCommunityIcons name="chevron-left" size={18} color={Colors.light.text} />
        </Pressable>
        
        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: Colors.light.text,
          textAlign: 'center',
          position: 'absolute',
          left: 0,
          right: 0
        }}>
          Il Mio Profilo
        </Text>
        
        <Pressable
          onPress={handleSaveProfile}
          disabled={saveLoading}
          style={{
            opacity: saveLoading ? 0.6 : 1,
            minWidth: 100,
            alignItems: 'flex-end'
          }}
        >
          <Text style={{
            fontSize: 17,
            color: '#007AFF',
            fontWeight: '600'
          }}>
            {saveLoading ? 'Salva...' : 'Salva'}
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: Colors.light.background }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16, paddingTop: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
            marginBottom: 24
          }}>
            <View style={{ gap: 16 }}>
              {/* Nome */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: Colors.light.text,
                  marginBottom: 8 
                }}>
                  Nome
                </Text>
                <TextInput
                  placeholder="Inserisci il tuo nome"
                  value={nome}
                  onChangeText={setNome}
                  autoCapitalize="words"
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

              {/* Cognome */}
              <View>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: Colors.light.text,
                  marginBottom: 8 
                }}>
                  Cognome
                </Text>
                <TextInput
                  placeholder="Inserisci il tuo cognome"
                  value={cognome}
                  onChangeText={setCognome}
                  autoCapitalize="words"
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
                  value={email || ''}
                  editable={false}
                  style={{
                    backgroundColor: '#f8f8f8',
                    borderWidth: 1,
                    borderColor: '#e1e1e6',
                    borderRadius: 12,
                    padding: 16,
                    fontSize: 16,
                    color: Colors.light.textSecondary
                  }}
                />
                <Text style={{ 
                  fontSize: 13, 
                  color: Colors.light.textSecondary, 
                  marginTop: 6
                }}>
                  L'email non può essere modificata
                </Text>
              </View>
            </View>
          </View>

          {/* Info Section */}
          <View style={{
            backgroundColor: '#F9F9F9',
            borderRadius: 12,
            padding: 16
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="information" size={16} color={Colors.light.textSecondary} />
              <Text style={{
                fontSize: 15,
                fontWeight: '600',
                color: Colors.light.text,
                marginLeft: 6
              }}>
                Informazioni sul Profilo
              </Text>
            </View>
            <Text style={{
              fontSize: 14,
              color: Colors.light.textSecondary,
              lineHeight: 20
            }}>
              Le informazioni del profilo vengono utilizzate per personalizzare 
              la tua esperienza e per scopi di identificazione nei documenti.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}