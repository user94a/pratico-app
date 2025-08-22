import { Colors } from '@/constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';

export default function NotificationsSettings() {
  const router = useRouter();

  function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <View style={{ marginBottom: 32 }}>
        <Text style={{ 
          fontSize: 13, 
          fontWeight: '400', 
          color: Colors.light.textSecondary,
          marginBottom: 8,
          marginLeft: 16,
          textTransform: 'uppercase',
          letterSpacing: 0.5
        }}>
          {title}
        </Text>
        <View style={{
          backgroundColor: Colors.light.cardBackground,
          marginHorizontal: 16,
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }}>
          {children}
        </View>
      </View>
    );
  }

  function SettingsItem({ 
    icon, 
    title, 
    subtitle, 
    onPress,
    showArrow = false,
    isLast = false,
    comingSoon = false
  }: { 
    icon: string; 
    title: string; 
    subtitle?: string; 
    onPress?: () => void;
    showArrow?: boolean;
    isLast?: boolean;
    comingSoon?: boolean;
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
            backgroundColor: comingSoon ? Colors.light.textSecondary : Colors.light.tint,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12
          }}>
            <MaterialCommunityIcons 
              name={icon as any} 
              size={18} 
              color="#fff" 
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ 
                fontSize: 17, 
                fontWeight: '400',
                color: Colors.light.text,
                flex: 1
              }}>
                {title}
              </Text>
              {comingSoon && (
                <View style={{
                  backgroundColor: '#007AFF',
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginLeft: 8
                }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: '#fff'
                  }}>
                    Presto
                  </Text>
                </View>
              )}
            </View>
            {subtitle && (
              <Text style={{ 
                fontSize: 15, 
                color: Colors.light.textSecondary,
                marginTop: 2,
                lineHeight: 20
              }}>
                {subtitle}
              </Text>
            )}
          </View>
          
          {showArrow && (
            <MaterialCommunityIcons 
              name="chevron-right" 
              size={14} 
              color={Colors.light.textSecondary} 
            />
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

  function ComingSoonBanner() {
    return (
      <View style={{
        backgroundColor: '#F2F8FF',
        borderColor: '#007AFF',
        borderWidth: 1,
        borderRadius: 12,
        margin: 16,
        padding: 16,
        marginBottom: 24
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <MaterialCommunityIcons name="information" size={20} color="#007AFF" />
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: '#007AFF',
            marginLeft: 8
          }}>
            Funzionalità in Sviluppo
          </Text>
        </View>
        <Text style={{
          fontSize: 15,
          color: '#1D1D1F',
          lineHeight: 22
        }}>
          Le notifiche intelligenti e i promemoria personalizzati sono in fase di sviluppo. 
          Presto potrai ricevere avvisi automatici per scadenze imminenti, 
          report periodici sui tuoi beni e molto altro.
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.cardBackground }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
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
          Notifiche
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: Colors.light.background }} 
        showsVerticalScrollIndicator={false}
      >
        <ComingSoonBanner />

        {/* Impostazioni Generali */}
        <SettingsSection title="Generale">
          <SettingsItem
            icon="bell"
            title="Abilita Notifiche"
            subtitle="Ricevi notifiche per scadenze e promemoria"
            comingSoon
          />
          <SettingsItem
            icon="cellphone"
            title="Notifiche Push"
            subtitle="Mostra notifiche anche quando l'app è chiusa"
            comingSoon
          />
          <SettingsItem
            icon="email"
            title="Notifiche Email"
            subtitle="Ricevi reminder anche via email"
            comingSoon
            isLast
          />
        </SettingsSection>

        {/* Scadenze */}
        <SettingsSection title="Scadenze">
          <SettingsItem
            icon="alarm"
            title="Promemoria Scadenze"
            subtitle="Avvisi automatici per scadenze imminenti"
            comingSoon
          />
          <SettingsItem
            icon="clock"
            title="Tempistiche Avvisi"
            subtitle="Quando ricevere i promemoria"
            comingSoon
          />
          <SettingsItem
            icon="repeat"
            title="Scadenze Ricorrenti"
            subtitle="Gestione automatica delle ricorrenze"
            comingSoon
            isLast
          />
        </SettingsSection>

        {/* Promemoria Personalizzati */}
        <SettingsSection title="Promemoria Personalizzati">
          <SettingsItem
            icon="plus-circle"
            title="Promemoria Custom"
            subtitle="Crea avvisi personalizzati per i tuoi beni"
            comingSoon
          />
          <SettingsItem
            icon="calendar"
            title="Report Settimanali"
            subtitle="Riepilogo settimanale dei tuoi beni e scadenze"
            comingSoon
          />
          <SettingsItem
            icon="chart-bar"
            title="Report Mensili"
            subtitle="Analisi mensile e suggerimenti"
            comingSoon
            isLast
          />
        </SettingsSection>

        {/* Funzionalità Avanzate */}
        <SettingsSection title="Intelligenza Artificiale">
          <SettingsItem
            icon="lightbulb"
            title="Suggerimenti Smart"
            subtitle="AI che suggerisce nuove scadenze basate sui tuoi beni"
            comingSoon
          />
          <SettingsItem
            icon="chart-line"
            title="Analisi Predittiva"
            subtitle="Previeni problemi con i tuoi beni"
            comingSoon
          />
          <SettingsItem
            icon="shield-check"
            title="Monitoraggio Automatico"
            subtitle="Controlla automaticamente lo stato dei tuoi beni"
            comingSoon
            isLast
          />
        </SettingsSection>

        {/* Sezione informativa */}
        <View style={{
          backgroundColor: '#F9F9F9',
          margin: 16,
          padding: 16,
          borderRadius: 12,
          marginBottom: 32
        }}>
          <Text style={{
            fontSize: 15,
            color: Colors.light.textSecondary,
            lineHeight: 22,
            textAlign: 'center'
          }}>
            Stiamo lavorando per portarti il miglior sistema di notifiche e promemoria. 
            Le funzionalità saranno abilitate gradualmente nei prossimi aggiornamenti.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
