import { Colors } from '@/constants/Colors';
import { getUserProfile, auth } from '@/lib/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function Impostazioni() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cognome, setCognome] = useState('');


  useEffect(() => {
    loadUserData();
  }, []);

  // Ricarica i dati quando la pagina torna in focus
  useFocusEffect(
    useCallback(() => {
      loadUserData();
    }, [])
  );

  async function loadUserData() {
    try {
      const profile = await getUserProfile();
      setEmail(profile.email);
      setNome(profile.name || '');
      setCognome(profile.surname || '');
    } catch (error) {
      console.log('Errore caricamento profilo:', error);
    }
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
              await auth.signOut();
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

  function navigateToNotifications() {
    router.push('/notifications-settings');
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
      <View>
        <Pressable
          onPress={onPress}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 16,
            minHeight: 44
          }}
        >
          <View style={{
            width: 29,
            height: 29,
            borderRadius: 6,
            backgroundColor: Colors.light.tint,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <MaterialCommunityIcons name={icon as any} size={18} color="#fff" />
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
            <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
          )}
        </Pressable>
                          {!isLast && (
                    <View style={{
                      height: 0.33,
                      backgroundColor: Colors.light.border,
                      marginLeft: 57
                    }} />
                  )}
      </View>
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
              onPress={() => router.push('/profile-edit')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 16,
                minHeight: 44
              }}
            >
              <View style={{
                width: 29,
                height: 29,
                borderRadius: 6,
                backgroundColor: Colors.light.tint,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <MaterialCommunityIcons name="account" size={18} color="#fff" />
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
              <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
            </Pressable>
          </MenuSection>

          {/* Notifiche */}
          <MenuSection title="Notifiche">
            <MenuItem 
              icon="bell"
              title="Notifiche"
              subtitle="Configura avvisi e promemoria"
              onPress={navigateToNotifications}
              isLast
            />
          </MenuSection>

          {/* Account */}
          <MenuSection title="Account">
            <MenuItem 
              icon="logout"
              title="Logout"
              subtitle="Esci dall'app"
              onPress={handleLogout}
              isLast
            />
          </MenuSection>

          {/* Informazioni */}
          <MenuSection title="Informazioni">
            <MenuItem 
              icon="information"
              title="Info sull'app"
              subtitle="Versione e dettagli"
              onPress={showAppInfo}
              rightElement={
                <MaterialCommunityIcons name="information" size={16} color={Colors.light.textSecondary} />
              }
            />
            <MenuItem 
              icon="help-circle"
              title="Supporto"
              subtitle="Contatta l'assistenza"
              onPress={showSupport}
              rightElement={
                <MaterialCommunityIcons name="information" size={16} color={Colors.light.textSecondary} />
              }
              isLast
            />
          </MenuSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 