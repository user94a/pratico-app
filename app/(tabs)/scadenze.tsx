import { AddDeadlineModal } from '@/components/modals/AddDeadlineModal';
import { AssetDetailModal } from '@/components/modals/AssetDetailModal';
import { Colors } from '@/constants/Colors';
import { createDeadlineWithAssociations, getAllDeadlines } from '@/lib/api';
import { Deadline } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

function getDeadlineStatus(deadline: Deadline) {
  if (deadline.status === 'done') return null;
  
  const now = new Date();
  const dueDate = new Date(deadline.due_at);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Se è scaduta (giorni negativi)
  if (diffDays < 0) {
    return {
      backgroundColor: Colors.light.error, // Rosso per scadute
    };
  }

  // Se scade entro 7 giorni
  if (diffDays <= 7) {
    return {
      backgroundColor: Colors.light.warning, // Arancione per prossima settimana
    };
  }

  // Se è lontana (più di 7 giorni) - nessun pallino
  return null;
}

// Funzione per convertire le regole RRULE in testo leggibile
function getRecurrenceText(rrule: string): string {
  if (!rrule) return 'Ricorrente';
  
  // Mappa delle regole comuni
  const recurrenceMap: { [key: string]: string } = {
    'RRULE:FREQ=WEEKLY': 'Ogni settimana',
    'RRULE:FREQ=MONTHLY': 'Ogni mese',
    'RRULE:FREQ=MONTHLY;INTERVAL=3': 'Ogni 3 mesi',
    'RRULE:FREQ=MONTHLY;INTERVAL=6': 'Ogni 6 mesi',
    'RRULE:FREQ=YEARLY': 'Ogni anno',
    'RRULE:FREQ=YEARLY;INTERVAL=2': 'Ogni 2 anni',
  };
  
  // Controlla se corrisponde a una regola mappata
  if (recurrenceMap[rrule]) {
    return recurrenceMap[rrule];
  }
  
  // Parsing più generico per altre regole
  try {
    if (rrule.includes('FREQ=DAILY')) {
      if (rrule.includes('INTERVAL=')) {
        const interval = rrule.match(/INTERVAL=(\d+)/)?.[1];
        return interval ? `Ogni ${interval} giorni` : 'Ogni giorno';
      }
      return 'Ogni giorno';
    }
    
    if (rrule.includes('FREQ=WEEKLY')) {
      if (rrule.includes('INTERVAL=')) {
        const interval = rrule.match(/INTERVAL=(\d+)/)?.[1];
        return interval ? `Ogni ${interval} settimane` : 'Ogni settimana';
      }
      return 'Ogni settimana';
    }
    
    if (rrule.includes('FREQ=MONTHLY')) {
      if (rrule.includes('INTERVAL=')) {
        const interval = rrule.match(/INTERVAL=(\d+)/)?.[1];
        return interval ? `Ogni ${interval} mesi` : 'Ogni mese';
      }
      return 'Ogni mese';
    }
    
    if (rrule.includes('FREQ=YEARLY')) {
      if (rrule.includes('INTERVAL=')) {
        const interval = rrule.match(/INTERVAL=(\d+)/)?.[1];
        return interval ? `Ogni ${interval} anni` : 'Ogni anno';
      }
      return 'Ogni anno';
    }
  } catch (error) {
    console.warn('Error parsing RRULE:', rrule, error);
  }
  
  return 'Ricorrente';
}

export default function Scadenze() {
  const router = useRouter();
  const [items, setItems] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeadline, setShowDeadline] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);

  async function load(forceRefresh = false) {
    try { 
      // Se non è un refresh forzato e abbiamo dati recenti (meno di 30 secondi), non ricaricare
      if (!forceRefresh && lastLoadTime && (Date.now() - lastLoadTime) < 30000 && items.length > 0) {
        return;
      }
      
      setLoading(true);
      const data = await getAllDeadlines(); 
      setItems(data);
      setLastLoadTime(Date.now());
    } catch (e: any) {
      Alert.alert('Errore', e.message); 
    } finally { 
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  // Carica solo al primo focus, non ad ogni cambio tab
  useFocusEffect(useCallback(() => { 
    if (items.length === 0) {
      load();
    }
  }, [items.length]));

  // Ordina per prossimità alla scadenza (prima le scadute, poi quelle prossime)
  const sortedItems = [...items].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    
    const now = new Date().getTime();
    const aDiff = Math.abs(new Date(a.due_at).getTime() - now);
    const bDiff = Math.abs(new Date(b.due_at).getTime() - now);
    
    return aDiff - bDiff;
  });

  const filteredItems = sortedItems.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(searchLower);
    const assetMatch = item.asset?.name && item.asset.name.toLowerCase().includes(searchLower);
    const notesMatch = item.notes && item.notes.toLowerCase().includes(searchLower);
    return titleMatch || assetMatch || notesMatch;
  }).sort((a, b) => {
    const aDate = new Date(a.due_at);
    const bDate = new Date(b.due_at);
    return aDate.getTime() - bDate.getTime();
  });

  // Funzione per calcolare la categoria temporale di una scadenza
  function getTimeCategory(dueDate: string, status: string): string {
    if (status === 'done') return 'completed';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 7) return 'thisWeek';
    if (diffDays <= 30) return 'thisMonth';
    if (diffDays <= 90) return 'next3Months';
    if (diffDays <= 180) return 'next6Months';
    if (diffDays <= 365) return 'thisYear';
    return 'future';
  }

  // Raggruppa le scadenze per categoria temporale
  const groupedDeadlines = filteredItems.reduce((groups, deadline) => {
    const category = getTimeCategory(deadline.due_at, deadline.status);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(deadline);
    return groups;
  }, {} as Record<string, typeof filteredItems>);

  // Mapping per le etichette delle categorie temporali
  const categoryLabels = {
    overdue: 'Scadute',
    thisWeek: 'Questa settimana',
    thisMonth: 'Questo mese',
    next3Months: 'Prossimi 3 mesi',
    next6Months: 'Prossimi 6 mesi',
    thisYear: 'Quest\'anno',
    future: 'Più avanti',
    completed: 'Completate'
  };

  // Ordine di visualizzazione delle categorie
  const categoryOrder = ['overdue', 'thisWeek', 'thisMonth', 'next3Months', 'next6Months', 'thisYear', 'future', 'completed'];

  // Mapping per le icone predefinite per tipo
  const typeIcons = {
    // Nuove categorie
    vehicles: 'car',
    properties: 'home',
    animals: 'paw',
    people: 'person',
    devices: 'phone-portrait',
    subscriptions: 'card',
    other: 'cube',
    // Retrocompatibilità con vecchie categorie
    car: 'car',
    house: 'home'
  } as const;

  // Helper per ottenere l'icona da mostrare
  function getAssetIcon(asset: any): string {
    // Se ha un'icona personalizzata, usala con fallback
    if (asset?.custom_icon && typeof asset.custom_icon === 'string') {
      // Lista di icone valide per fallback
      const validIcons = [
        'car', 'home', 'paw', 'person', 'phone-portrait', 'card', 'cube', 
        'boat', 'bicycle', 'airplane', 'train', 'bus', 'medical', 'business',
        'restaurant', 'school', 'fitness', 'camera', 'laptop', 'watch'
      ];
      
      // Se l'icona personalizzata è valida, usala, altrimenti fallback
      if (validIcons.includes(asset.custom_icon)) {
        return asset.custom_icon;
      } else {
        // Fallback per icone non valide
        const fallbackMap: Record<string, string> = {
          'hospital': 'medical',
          'building': 'business', 
          'factory': 'business',
          'office': 'business',
          'bank': 'business',
          'store': 'business'
        };
        const fallbackIcon = fallbackMap[asset.custom_icon];
        if (fallbackIcon && validIcons.includes(fallbackIcon)) {
          return fallbackIcon;
        }
      }
    }
    
    // Fallback all'icona predefinita per il tipo
    if (asset?.type && typeIcons[asset.type as keyof typeof typeIcons]) {
      return typeIcons[asset.type as keyof typeof typeIcons];
    }
    
    // Ultimo fallback
    return typeIcons.other;
  }

  // Componente per le sezioni delle scadenze
  function DeadlineSection({ title, deadlines }: { title: string; deadlines: typeof filteredItems }) {
    if (deadlines.length === 0) return null;
    
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
          {deadlines.map((deadline, index) => {
            const isLast = index === deadlines.length - 1;
            return (
              <View key={deadline.id}>
                {renderDeadline({ item: deadline })}
                {!isLast && (
                  <View style={{
                    height: 0.33,
                    backgroundColor: Colors.light.border,
                    marginLeft: 0,
                    marginRight: 0
                  }} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  const renderDeadline = ({ item }: { item: Deadline }) => {
    const isCompleted = item.status === 'done';
    const now = new Date();
    const dueDate = new Date(item.due_at);
    const isOverdue = dueDate < now && !isCompleted;
    const isUpcoming = !isOverdue && !isCompleted && (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 7;

  return (
      <Pressable
        onPress={() => router.push({ pathname: '/deadline-detail', params: { id: item.id } })}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 16,
          paddingHorizontal: 16,
          justifyContent: 'space-between'
        }}
      >
        <View style={{ flex: 1 }}>
          {/* Titolo scadenza con icona ricorrenza */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600',
              color: isCompleted ? Colors.light.textSecondary : Colors.light.text,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
              flex: 1
            }}>
              {item.title}
            </Text>
            {item.recurrence_rrule && (
              <View style={{
                backgroundColor: Colors.light.warning + '20',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3
              }}>
                <Ionicons name="repeat" size={12} color={Colors.light.warning} />
                <Text style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: Colors.light.warning
                }}>
                  {getRecurrenceText(item.recurrence_rrule).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Data scadenza con colore in base allo stato */}
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '500',
            color: isOverdue ? Colors.light.error : isUpcoming ? Colors.light.warning : Colors.light.textSecondary,
            marginBottom: item.asset?.name ? 4 : 0
          }}>
            {new Date(item.due_at).toLocaleDateString('it-IT', {
              weekday: 'short',
              day: 'numeric',
              month: 'short'
            })}
          </Text>
          
          {/* Asset associato con icona del tipo */}
          {item.asset?.name && (
            <View style={{
              backgroundColor: Colors.light.tint + '15',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12,
              alignSelf: 'flex-start',
              marginTop: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6
            }}>
              <Ionicons 
                name={getAssetIcon(item.asset) as any} 
                size={12} 
                color={Colors.light.tint} 
              />
              <Text style={{ 
                fontSize: 13, 
                fontWeight: '500',
                color: Colors.light.tint 
              }}>
                {item.asset.name}
              </Text>
            </View>
          )}
        </View>

        {/* Urgency dot e chevron */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {(isOverdue || isUpcoming) && (
                <View style={{ 
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: isOverdue ? Colors.light.error : Colors.light.warning
            }} />
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                  </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8
        }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800',
            color: Colors.light.text
          }}>
            Scadenze
                  </Text>
          <Pressable
            onPress={() => setShowDeadline(true)}
            style={{
              backgroundColor: Colors.light.tint,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{
            backgroundColor: '#e5e5ea',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="search" size={17} color="#8e8e93" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ 
                flex: 1, 
                fontSize: 17,
                color: Colors.light.text,
                paddingVertical: 4
              }}
              placeholder="Cerca"
              placeholderTextColor="#8e8e93"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color="#8e8e93" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Deadlines List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.tint}
            />
          }
        >
          {Object.keys(groupedDeadlines).length === 0 ? (
            <View style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 60
            }}>
              <Ionicons name="time-outline" size={60} color={Colors.light.textSecondary} />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: Colors.light.textSecondary,
                marginTop: 16,
                textAlign: 'center'
              }}>
                {searchQuery ? 'Nessuna scadenza trovata' : 'Nessuna scadenza aggiunta'}
              </Text>
              {!searchQuery && (
                <Text style={{ 
                  fontSize: 14,
                  color: Colors.light.textSecondary,
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  Tocca + per aggiungere la tua prima scadenza
                </Text>
              )}
            </View>
          ) : (
            categoryOrder.map((category) => {
              const deadlines = groupedDeadlines[category];
              if (!deadlines || deadlines.length === 0) return null;
              
              return (
                <DeadlineSection 
                  key={category} 
                  title={(categoryLabels as any)[category] || category} 
                  deadlines={deadlines} 
          />
              );
            })
          )}
        </ScrollView>
      </View>

      <AddDeadlineModal
        visible={showDeadline}
        onClose={() => setShowDeadline(false)}
        onSubmit={async (result) => {
          try {
            await createDeadlineWithAssociations(result as any);
            await load(true); // Forza refresh dopo creazione
            setShowDeadline(false);
          } catch (e: any) {
            Alert.alert('Errore', e.message || 'Impossibile creare la scadenza');
          }
        }}
      />

      {selectedAsset && (
        <AssetDetailModal
          visible={showAssetDetail}
            onClose={() => { 
            setShowAssetDetail(false);
            setSelectedAsset(null);
            }} 
          asset={selectedAsset}
          onEdit={async () => {
                await load(true); // Forza refresh dopo modifica
          }}
          onDelete={() => {
            setShowAssetDetail(false);
            setSelectedAsset(null);
          }}
          onDeadlinePress={(deadline) => {
            // Chiudi prima il modal del bene, poi naviga alla pagina della scadenza
            setShowAssetDetail(false);
            setTimeout(() => {
              router.push({ pathname: '/deadline-detail', params: { id: deadline.id } });
            }, 100);
            }} 
          />
      )}
      </SafeAreaView>
  );
} 