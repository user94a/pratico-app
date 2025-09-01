
import { Colors } from '@/constants/Colors';
import { getAsset, getAssetDeadlines, getAssetDocuments, updateAsset, deleteAsset } from '@/lib/api';
import { Asset, Deadline, Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View
} from 'react-native';

export default function AssetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [asset, setAsset] = useState<Asset | null>(null);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit state
  const [editName, setEditName] = useState('');
  const [editIdentifier, setEditIdentifier] = useState('');

  useEffect(() => {
    if (id) {
      loadAsset();
      loadAssetData();
    }
  }, [id]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const data = await getAsset(id);
      setAsset(data);
      setEditName(data.name);
      setEditIdentifier(data.identifier || '');
    } catch (error: any) {
      console.error('Error loading asset:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile caricare i dettagli del bene. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => loadAsset() },
          { text: 'Indietro', onPress: () => router.back(), style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAssetData = async () => {
    if (!id) return;
    
    try {
      // Carica deadlines
      setLoadingDeadlines(true);
      const assetDeadlines = await getAssetDeadlines(id);
      setDeadlines(assetDeadlines);
      
      // Carica documents
      setLoadingDocuments(true);
      const assetDocuments = await getAssetDocuments(id);
      setDocuments(assetDocuments);
    } catch (error: any) {
      console.error('Error loading asset data:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile caricare i dati associati. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => loadAssetData() },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setLoadingDeadlines(false);
      setLoadingDocuments(false);
    }
  };

  const handleSave = async () => {
    if (!asset || !editName.trim()) return;

    try {
      setIsSaving(true);
      const updatedAsset = await updateAsset(asset.id, {
        name: editName.trim(),
        identifier: editIdentifier.trim() || undefined
      });

      // Update local state
      setAsset(updatedAsset);
      setIsEditing(false);
      Alert.alert('Successo', 'Bene aggiornato con successo');
    } catch (error: any) {
      console.error('Error updating asset:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile salvare le modifiche. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => handleSave() },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina bene',
      'Sei sicuro di voler eliminare questo bene? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!asset) return;

    try {
      setIsDeleting(true);
      await deleteAsset(asset.id);
      
      Alert.alert('Successo', 'Bene eliminato con successo');
      router.back();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile eliminare il bene. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => confirmDelete() },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Navigation handlers
  const handleDeadlinePress = (deadline: Deadline) => {
    router.push({ pathname: '/deadline-detail', params: { id: deadline.id } });
  };

  const handleDocumentPress = (document: Document) => {
    router.push({ pathname: '/document-detail', params: { id: document.id } });
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    if (isToday) return 'Oggi';
    if (isTomorrow) return 'Domani';
    
    return date.toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  const getDeadlineStatus = (deadline: Deadline) => {
    if (deadline.status === 'done') {
      return { text: 'Completata', color: '#34c759' };
    }
    
    const dueDate = new Date(deadline.due_at);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Scaduta', color: '#ff3b30' };
    } else if (diffDays === 0) {
      return { text: 'Oggi', color: '#ff9500' };
    } else if (diffDays <= 7) {
      return { text: `Tra ${diffDays} giorn${diffDays === 1 ? 'o' : 'i'}`, color: '#ff9500' };
    } else {
      return { text: 'In programma', color: '#8e8e93' };
    }
  };

  const getRecurrenceText = (rrule: string | null): string => {
    if (!rrule) return '';
    
    const recurrenceMap: { [key: string]: string } = {
      'FREQ=WEEKLY': 'Ogni settimana',
      'FREQ=MONTHLY': 'Ogni mese',
      'FREQ=MONTHLY;INTERVAL=3': 'Ogni 3 mesi',
      'FREQ=MONTHLY;INTERVAL=6': 'Ogni 6 mesi',
      'FREQ=YEARLY': 'Ogni anno',
      'FREQ=YEARLY;INTERVAL=2': 'Ogni 2 anni',
    };
    
    return recurrenceMap[rrule] || 'Ricorrente';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={{ marginTop: 16, color: '#666' }}>Caricamento bene...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: '#666' }}>
            Bene non trovato
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 0.33,
        borderBottomColor: '#e5e5ea'
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#f2f2f7',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#000" />
        </Pressable>
        
        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: '#000',
          textAlign: 'center',
          position: 'absolute',
          left: 0,
          right: 0
        }}>
          Dettaglio Bene
        </Text>

        {isEditing ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => {
                setIsEditing(false);
                setEditName(asset.name);
                setEditIdentifier(asset.identifier || '');
              }}
              disabled={isSaving}
              style={{ opacity: isSaving ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 16, color: '#666', fontWeight: '600' }}>
                Annulla
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving || !editName.trim()}
              style={{ opacity: (isSaving || !editName.trim()) ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 16, color: '#0a84ff', fontWeight: '600' }}>
                {isSaving ? 'Salva...' : 'Salva'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setIsEditing(true)}
            disabled={isDeleting}
            style={{ opacity: isDeleting ? 0.5 : 1 }}
          >
            <Text style={{ fontSize: 16, color: '#0a84ff', fontWeight: '600' }}>
              Modifica
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: '#f2f2f7' }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Asset Info Card */}
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 12,
          padding: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          marginBottom: 16
        }}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              backgroundColor: Colors.light.tint,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Ionicons 
                name={(asset.asset_type?.icon || asset.asset_category?.icon || 'cube') as any} 
                size={40} 
                color="#fff" 
              />
            </View>
            
            {isEditing ? (
              <View style={{ width: '100%', gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                    Nome bene
                  </Text>
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Nome"
                    style={{
                      backgroundColor: '#f2f2f7',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 17,
                      fontWeight: '400',
                      textAlign: 'center'
                    }}
                  />
                </View>

                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                    Identificativo
                  </Text>
                  <TextInput
                    value={editIdentifier}
                    onChangeText={setEditIdentifier}
                    placeholder="Identificativo"
                    style={{
                      backgroundColor: '#f2f2f7',
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 17,
                      fontWeight: '400',
                      textAlign: 'center'
                    }}
                  />
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center' }}>
                <Text style={{
                  fontSize: 24,
                  fontWeight: '700',
                  color: '#000',
                  textAlign: 'center',
                  marginBottom: 8
                }}>
                  {asset.name}
                </Text>
                {asset.identifier && (
                  <Text style={{
                    fontSize: 16,
                    color: '#666',
                    textAlign: 'center'
                  }}>
                    {asset.identifier}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Scadenze Section */}
        {!isEditing && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 16
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.33,
              borderBottomColor: '#e5e5ea'
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#000'
              }}>
                Scadenze
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#666'
              }}>
                {deadlines.length}
              </Text>
            </View>
            
            {loadingDeadlines ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.light.tint} />
              </View>
            ) : deadlines.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>
                  Nessuna scadenza associata
                </Text>
              </View>
            ) : (
              deadlines.slice(0, 3).map((deadline, index) => {
                const status = getDeadlineStatus(deadline);
                const isLast = index === Math.min(deadlines.length, 3) - 1;
                
                return (
                  <View key={deadline.id}>
                    <Pressable
                      onPress={() => handleDeadlinePress(deadline)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        justifyContent: 'space-between'
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#000',
                          marginBottom: 4
                        }}>
                          {deadline.title}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{
                            fontSize: 14,
                            color: status.color,
                            fontWeight: '500'
                          }}>
                            {formatDate(deadline.due_at)} • {status.text}
                          </Text>
                          {deadline.recurrence_rule && (
                            <View style={{
                              backgroundColor: Colors.light.tint + '15',
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              borderRadius: 8
                            }}>
                              <Text style={{
                                fontSize: 11,
                                color: Colors.light.tint,
                                fontWeight: '600'
                              }}>
                                {getRecurrenceText(deadline.recurrence_rule).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
                    </Pressable>
                    {!isLast && (
                      <View style={{
                        height: 0.33,
                        backgroundColor: '#e5e5ea',
                        marginLeft: 16
                      }} />
                    )}
                  </View>
                );
              })
            )}
            
            {deadlines.length > 3 && (
              <View style={{
                borderTopWidth: 0.33,
                borderTopColor: '#e5e5ea'
              }}>
                <Pressable style={{
                  padding: 12,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: Colors.light.tint,
                    fontWeight: '600'
                  }}>
                    Vedi tutte ({deadlines.length})
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Documenti Section */}
        {!isEditing && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginBottom: 24
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.33,
              borderBottomColor: '#e5e5ea'
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#000'
              }}>
                Documenti
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#666'
              }}>
                {documents.length}
              </Text>
            </View>
            
            {loadingDocuments ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={Colors.light.tint} />
              </View>
            ) : documents.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>
                  Nessun documento associato
                </Text>
              </View>
            ) : (
              documents.slice(0, 3).map((document, index) => {
                const isLast = index === Math.min(documents.length, 3) - 1;
                
                return (
                  <View key={document.id}>
                    <Pressable
                      onPress={() => handleDocumentPress(document)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        justifyContent: 'space-between'
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: '#000',
                          marginBottom: 4
                        }}>
                          {document.title}
                        </Text>
                        <Text style={{
                          fontSize: 14,
                          color: '#666'
                        }}>
                          {formatDate(document.created_at)}
                          {document.tags && document.tags.length > 0 && (
                            <Text> • {document.tags.join(', ')}</Text>
                          )}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="document-text" size={16} color="#666" />
                        <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
                      </View>
                    </Pressable>
                    {!isLast && (
                      <View style={{
                        height: 0.33,
                        backgroundColor: '#e5e5ea',
                        marginLeft: 16
                      }} />
                    )}
                  </View>
                );
              })
            )}
            
            {documents.length > 3 && (
              <View style={{
                borderTopWidth: 0.33,
                borderTopColor: '#e5e5ea'
              }}>
                <Pressable style={{
                  padding: 12,
                  alignItems: 'center'
                }}>
                  <Text style={{
                    fontSize: 14,
                    color: Colors.light.tint,
                    fontWeight: '600'
                  }}>
                    Vedi tutte ({documents.length})
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Delete Button */}
        {!isEditing && (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3
          }}>
            <Pressable
              onPress={handleDelete}
              disabled={isDeleting}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                paddingHorizontal: 16,
                gap: 8,
                opacity: isDeleting ? 0.5 : 1
              }}
            >
              <Ionicons name="trash" size={20} color="#ff3b30" />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#ff3b30'
              }}>
                {isDeleting ? 'Eliminazione...' : 'Elimina bene'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
