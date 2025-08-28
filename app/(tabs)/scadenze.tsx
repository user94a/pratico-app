import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, Alert, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAllDeadlines, createDeadline, updateDeadlineStatus, deleteDeadline } from '@/lib/api';
import { AddDeadlineModal } from '@/app/components/modals/AddDeadlineModal';
import { Deadline } from '@/lib/types';
import { Colors } from '@/constants/Colors';

export default function Scadenze() {
  const router = useRouter();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Carica le scadenze
  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const data = await getAllDeadlines();
      setDeadlines(data || []);
    } catch (error: any) {
      console.error('Errore nel caricamento delle scadenze:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile caricare le scadenze. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => loadDeadlines() },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Carica le scadenze all'avvio
  useEffect(() => {
    loadDeadlines();
  }, []);

  // Gestisce il pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadDeadlines();
    } catch (error) {
      console.error('Errore durante il refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Gestisce l'aggiunta di una nuova scadenza
  const handleAddDeadline = async (newDeadline: Deadline) => {
    try {
      await loadDeadlines(); // Ricarica la lista
      setShowAddModal(false);
      Alert.alert('Successo', 'Scadenza aggiunta con successo!');
    } catch (error: any) {
      console.error('Errore nell\'aggiunta della scadenza:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile aggiungere la scadenza. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => handleAddDeadline(newDeadline) },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    }
  };

  // Completa o riapre una scadenza
  const toggleDeadlineStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'done' ? 'pending' : 'done';
      await updateDeadlineStatus(id, newStatus);
      await loadDeadlines(); // Ricarica la lista
    } catch (error: any) {
      console.error('Errore nell\'aggiornamento della scadenza:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile aggiornare la scadenza. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => toggleDeadlineStatus(id, currentStatus) },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    }
  };

  // Elimina una scadenza
  const removeDeadline = async (id: string) => {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questa scadenza?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDeadline(id);
              await loadDeadlines(); // Ricarica la lista
            } catch (error: any) {
              console.error('Errore nell\'eliminazione della scadenza:', error);
              Alert.alert(
                'Errore di connessione', 
                error.message || 'Impossibile eliminare la scadenza. Verifica la tua connessione internet.',
                [
                  { text: 'Riprova', onPress: () => removeDeadline(id) },
                  { text: 'Annulla', style: 'cancel' }
                ]
              );
            }
          }
        }
      ]
    );
  };

  // Formatta la data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  // Determina se una scadenza è scaduta
  const isExpired = (deadline: Deadline) => {
    const now = new Date();
    const dueDate = new Date(deadline.due_at);
    return dueDate < now && deadline.status !== 'done';
  };

  // Filtra le scadenze in base alla ricerca
  const filteredDeadlines = deadlines.filter(deadline =>
    deadline.title.toLowerCase().includes(searchText.toLowerCase())
  );

  // Separa le scadenze in tre categorie
  const expiredDeadlines = filteredDeadlines.filter(deadline => 
    isExpired(deadline) && deadline.status !== 'done'
  );
  const completedDeadlines = filteredDeadlines.filter(deadline => 
    deadline.status === 'done'
  );
  const upcomingDeadlines = filteredDeadlines.filter(deadline => 
    !isExpired(deadline) && deadline.status !== 'done'
  );

  // Renderizza una singola scadenza
  const renderDeadline = ({ item }: { item: Deadline }) => {
    const isExpiredItem = isExpired(item);
    const isCompleted = item.status === 'done';

    return (
      <Pressable
        onPress={() => router.push(`/deadline-detail?id=${item.id}`)}
        style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 16,
          marginBottom: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: isCompleted ? '#8E8E93' : '#000000',
            textDecorationLine: isCompleted ? 'line-through' : 'none',
            marginBottom: 4
          }}>
            {item.title}
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: isExpiredItem ? '#FF3B30' : '#666'
          }}>
            {formatDate(item.due_at)}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {/* Indicatore di stato */}
          {isExpiredItem && (
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#FF3B30'
            }} />
          )}
          
          {/* Freccia di navigazione */}
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </View>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f7' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Caricamento scadenze...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f7' }}>
      <View style={{ flex: 1, padding: 16 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 24 
        }}>
          <Text style={{ fontSize: 28, fontWeight: '800' }}>
            Scadenze
          </Text>
          
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.light.tint,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Barra di ricerca */}
        <View style={{ paddingHorizontal: 0, paddingBottom: 8 }}>
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
              value={searchText}
              onChangeText={setSearchText}
              style={{ 
                flex: 1, 
                fontSize: 17,
                color: '#000000',
                paddingVertical: 4
              }}
              placeholder="Cerca"
              placeholderTextColor="#8e8e93"
            />
            {searchText.length > 0 && (
              <Pressable onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={17} color="#8e8e93" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Contenuto */}
        <View style={{ flex: 1 }}>
          {expiredDeadlines.length === 0 && upcomingDeadlines.length === 0 && completedDeadlines.length === 0 ? (
            /* Stato vuoto */
            <View style={{ 
              flex: 1, 
              justifyContent: 'center', 
              alignItems: 'center',
              paddingHorizontal: 32
            }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#e5e5ea',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}>
                <Ionicons name="calendar-outline" size={32} color="#999" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
                {searchText ? 'Nessuna scadenza trovata' : 'Nessuna scadenza'}
              </Text>
              <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>
                {searchText ? 'Prova a modificare la ricerca' : 'Inizia ad aggiungere le tue scadenze per tenerle tracciate'}
              </Text>
              {!searchText && (
                <Pressable
                  onPress={() => setShowAddModal(true)}
                  style={{
                    marginTop: 24,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    backgroundColor: Colors.light.tint,
                    borderRadius: 8
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    Aggiungi la prima scadenza
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            /* Lista con pull-to-refresh */
            <FlatList
              data={[]}
              renderItem={() => null}
              ListHeaderComponent={() => (
                <View>
                  {/* Sezione Scadute */}
                  {expiredDeadlines.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: '#000000',
                        marginBottom: 12
                      }}>
                        Scadute
                      </Text>
                      {expiredDeadlines.map((item) => (
                        <View key={item.id}>
                          {renderDeadline({ item })}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Sezione Prossime Scadenze */}
                  {upcomingDeadlines.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: '#000000',
                        marginBottom: 12
                      }}>
                        Prossime
                      </Text>
                      {upcomingDeadlines.map((item) => (
                        <View key={item.id}>
                          {renderDeadline({ item })}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Sezione Completate */}
                  {completedDeadlines.length > 0 && (
                    <View style={{ marginBottom: 24 }}>
                      <Text style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: '#000000',
                        marginBottom: 12
                      }}>
                        Completate
                      </Text>
                      {completedDeadlines.map((item) => (
                        <View key={item.id}>
                          {renderDeadline({ item })}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[Colors.light.tint]}
                  tintColor={Colors.light.tint}
                />
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          )}
        </View>
      </View>

      {/* Modal per aggiungere scadenza */}
      <AddDeadlineModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddDeadline}
      />
    </SafeAreaView>
  );
} 