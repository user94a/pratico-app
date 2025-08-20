import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function Impostazioni() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');
  const [originalNome, setOriginalNome] = useState('');
  const [originalCognome, setOriginalCognome] = useState('');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setEmail(user?.email ?? null);
      
      // Carica i dati del profilo utente se esistono
      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('nome, cognome')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setNome(profile.nome || '');
          setCognome(profile.cognome || '');
          setOriginalNome(profile.nome || '');
          setOriginalCognome(profile.cognome || '');
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

      setOriginalNome(nome.trim());
      setOriginalCognome(cognome.trim());
      setIsEditingProfile(false);
      Alert.alert('Successo', 'Profilo aggiornato');
    } catch (error: any) {
      Alert.alert('Errore', error.message);
    } finally {
      setSaveLoading(false);
    }
  }

  function handleCancelEditProfile() {
    setNome(originalNome);
    setCognome(originalCognome);
    setIsEditingProfile(false);
  }

  async function handleLogout() {
    Alert.alert(
      'Conferma logout',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Esci',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              router.replace('/login');
            } catch (error: any) {
              Alert.alert('Errore', error.message);
            }
          }
        }
      ]
    );
  }

  function showAppInfo() {
    Alert.alert(
      'Pratico',
      'Versione 1.0.0\n\nApp per la gestione di scadenze, documenti e beni personali.\n\n© 2024 Extendi',
      [{ text: 'OK' }]
    );
  }

  function showSupport() {
    Alert.alert(
      'Supporto',
      'Per assistenza tecnica o segnalazioni:\n\nsupport@extendi.it',
      [
        { text: 'Annulla', style: 'cancel' },
        { 
          text: 'Invia email', 
          onPress: () => {
            // Qui si potrebbe aprire l'app email del dispositivo
            Alert.alert('Info', 'Apri la tua app email e scrivi a: support@extendi.it');
          }
        }
      ]
    );
  }

  function navigateToNotificheScadenze() {
    // TODO: Navigare alla pagina dettaglio notifiche scadenze
    Alert.alert('Info', 'Pagina notifiche scadenze in sviluppo');
  }

  function navigateToPromemoria() {
    // TODO: Navigare alla pagina dettaglio promemoria
    Alert.alert('Info', 'Pagina promemoria in sviluppo');
  }

  // Componente per le voci del menu
  function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: Colors.light.text,
          marginBottom: 12,
          marginLeft: 4
        }}>
          {title}
        </Text>
        <View style={{
          backgroundColor: Colors.light.cardBackground,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
        }}>
          {children}
        </View>
      </View>
    );
  }

  function MenuItem({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement,
    isLast = false 
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    rightElement?: React.ReactNode;
    isLast?: boolean;
  }) {
    return (
      <Pressable
        onPress={onPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: isLast ? 0 : 0.5,
          borderBottomColor: Colors.light.border
        }}
      >
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: Colors.light.tint,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons name={icon as any} size={18} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600',
            color: Colors.light.text 
          }}>
            {title}
          </Text>
          {subtitle && (
            <Text style={{ 
              fontSize: 14, 
              color: Colors.light.textSecondary,
              marginTop: 2
            }}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement || (
          <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
        )}
      </Pressable>
    );
  }

  if (isEditingProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            {/* Header */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: 24
            }}>
              <Text style={{ 
                fontSize: 32, 
                fontWeight: '800',
                color: Colors.light.text
              }}>
                Modifica Profilo
              </Text>
            </View>

            {/* Form di modifica */}
            <View style={{ flex: 1 }}>
              <View style={{
                padding: 20,
                borderRadius: 16,
                backgroundColor: Colors.light.cardBackground,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 1,
                elevation: 1,
                marginBottom: 24
              }}>
                <View style={{ gap: 16 }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: Colors.light.text }}>
                      Nome
                    </Text>
                    <TextInput
                      value={nome}
                      onChangeText={setNome}
                      style={{
                        backgroundColor: '#f2f2f7',
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        color: Colors.light.text,
                        borderWidth: 0
                      }}
                      placeholder="Inserisci il tuo nome"
                      placeholderTextColor={Colors.light.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: Colors.light.text }}>
                      Cognome
                    </Text>
                    <TextInput
                      value={cognome}
                      onChangeText={setCognome}
                      style={{
                        backgroundColor: '#f2f2f7',
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        color: Colors.light.text,
                        borderWidth: 0
                      }}
                      placeholder="Inserisci il tuo cognome"
                      placeholderTextColor={Colors.light.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: Colors.light.text }}>
                      Email
                    </Text>
                    <View style={{
                      backgroundColor: '#f2f2f7',
                      borderRadius: 12,
                      padding: 16,
                      opacity: 0.6
                    }}>
                      <Text style={{ fontSize: 16, color: Colors.light.textSecondary }}>
                        {email}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: Colors.light.textSecondary, marginTop: 4 }}>
                      L'email non può essere modificata
                    </Text>
                  </View>
                </View>
              </View>

              {/* Logout nel profilo */}
              <MenuSection title="Account">
                <MenuItem 
                  icon="log-out"
                  title="Logout"
                  subtitle="Esci dall'app"
                  onPress={handleLogout}
                  isLast
                />
              </MenuSection>

              {/* Pulsanti azione */}
              <View style={{ flexDirection: 'row', gap: 12, paddingBottom: 20 }}>
                <Pressable 
                  onPress={handleCancelEditProfile}
                  disabled={saveLoading}
                  style={{ 
                    flex: 1, 
                    padding: 16, 
                    borderRadius: 12, 
                    backgroundColor: Colors.light.cardBackground, 
                    borderWidth: 1,
                    borderColor: Colors.light.border,
                    alignItems: 'center',
                    opacity: saveLoading ? 0.5 : 1
                  }}
                >
                  <Text style={{ fontWeight: '600', color: Colors.light.text }}>Annulla</Text>
                </Pressable>
                <Pressable 
                  onPress={handleSaveProfile}
                  disabled={saveLoading}
                  style={{ 
                    flex: 1, 
                    padding: 16, 
                    borderRadius: 12, 
                    backgroundColor: Colors.light.tint, 
                    alignItems: 'center',
                    opacity: saveLoading ? 0.6 : 1
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    {saveLoading ? 'Salvataggio...' : 'Salva'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, padding: 16 }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: 24
          }}>
            <Text style={{ 
              fontSize: 32, 
              fontWeight: '800',
              color: Colors.light.text
            }}>
              Impostazioni
            </Text>
          </View>

          {/* Profilo */}
          <MenuSection title="Profilo">
            <Pressable
              onPress={() => setIsEditingProfile(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16
              }}
            >
              <View style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: Colors.light.tint,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: Colors.light.text 
                }}>
                  {nome && cognome ? `${nome} ${cognome}` : 'Nome e Cognome'}
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: Colors.light.textSecondary,
                  marginTop: 2
                }}>
                  {email}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
            </Pressable>
          </MenuSection>

          {/* Notifiche */}
          <MenuSection title="Notifiche">
            <MenuItem 
              icon="notifications"
              title="Notifiche scadenze"
              subtitle="Configura promemoria per le scadenze"
              onPress={navigateToNotificheScadenze}
            />
            <MenuItem 
              icon="alarm"
              title="Promemoria"
              subtitle="Imposta promemoria personalizzati"
              onPress={navigateToPromemoria}
              isLast
            />
          </MenuSection>

          {/* Informazioni */}
          <MenuSection title="Informazioni">
            <MenuItem 
              icon="information-circle"
              title="Info sull'app"
              subtitle="Versione e dettagli"
              onPress={showAppInfo}
            />
            <MenuItem 
              icon="help-circle"
              title="Supporto"
              subtitle="Contatta l'assistenza"
              onPress={showSupport}
              isLast
            />
          </MenuSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 