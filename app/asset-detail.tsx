import { IconPickerModal } from '@/components/IconPickerModal';
import { DeadlineDetailModal } from '@/components/modals/DeadlineDetailModal';
import { DocumentDetailModal } from '@/components/modals/DocumentDetailModal';
import { Colors } from '@/constants/Colors';
import { getAssetDeadlines, getAssetDocuments } from '@/lib/api';
import { getAssetIcon } from '@/lib/assetIcons';
import { supabase } from '@/lib/supabase';
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
  const [editCustomIcon, setEditCustomIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  
  // Modal states
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showDeadlineDetail, setShowDeadlineDetail] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);

  useEffect(() => {
    if (id) {
      loadAsset();
      loadAssetData();
    }
  }, [id]);

  const loadAsset = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setAsset(data);
      setEditName(data.name);
      setEditIdentifier(data.identifier || '');
      setEditCustomIcon(data.custom_icon);
    } catch (error) {
      console.error('Error loading asset:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli del bene');
      router.back();
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
    } catch (error) {
      console.error('Error loading asset data:', error);
    } finally {
      setLoadingDeadlines(false);
      setLoadingDocuments(false);
    }
  };

  const handleSave = async () => {
    if (!asset || !editName.trim()) return;

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('assets')
        .update({
          name: editName.trim(),
          identifier: editIdentifier.trim() || null,
          custom_icon: editCustomIcon,
          updated_at: new Date().toISOString()
        })
        .eq('id', asset.id);

      if (error) throw error;

      // Update local state
      setAsset({
        ...asset,
        name: editName.trim(),
        identifier: editIdentifier.trim() || null,
        custom_icon: editCustomIcon,
        updated_at: new Date().toISOString()
      });
      
      setIsEditing(false);
      Alert.alert('Successo', 'Bene aggiornato con successo');
    } catch (error) {
      console.error('Error updating asset:', error);
      Alert.alert('Errore', 'Impossibile salvare le modifiche');
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
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', asset.id);

      if (error) throw error;
      
      Alert.alert('Successo', 'Bene eliminato con successo');
      router.back();
    } catch (error) {
      console.error('Error deleting asset:', error);
      Alert.alert('Errore', 'Impossibile eliminare il bene');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleIconSelect = (iconKey: string) => {
    setEditCustomIcon(iconKey);
    setShowIconPicker(false);
  };

  const resetIcon = () => {
    setEditCustomIcon(null);
  };

  // Navigation handlers
  const handleDeadlinePress = (deadline: Deadline) => {
    setSelectedDeadline(deadline);
    setShowDeadlineDetail(true);
  };

  const handleDocumentPress = (document: Document) => {
    setSelectedDocument(document);
    setShowDocumentDetail(true);
  };

  const handleDeadlineUpdate = async () => {
    // Ricarica le scadenze dopo una modifica
    await loadAssetData();
  };

  const handleDocumentUpdate = async () => {
    // Ricarica i documenti dopo una modifica
    await loadAssetData();
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
    if (deadline.status === 'skipped') {
      return { text: 'Saltata', color: '#8e8e93' };
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
      'RRULE:FREQ=WEEKLY': 'Ogni settimana',
      'RRULE:FREQ=MONTHLY': 'Ogni mese',
      'RRULE:FREQ=MONTHLY;INTERVAL=3': 'Ogni 3 mesi',
      'RRULE:FREQ=MONTHLY;INTERVAL=6': 'Ogni 6 mesi',
      'RRULE:FREQ=YEARLY': 'Ogni anno',
      'RRULE:FREQ=YEARLY;INTERVAL=2': 'Ogni 2 anni',
    };
    
    return recurrenceMap[rrule] || 'Ricorrente';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (!asset) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: Colors.light.textSecondary }}>
            Bene non trovato
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: Colors.light.border
      }}>
        <Pressable
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.light.tint} />
          <Text style={{ fontSize: 16, color: Colors.light.tint, fontWeight: '600' }}>
            Beni
          </Text>
        </Pressable>

        {isEditing ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => {
                setIsEditing(false);
                setEditName(asset.name);
                setEditIdentifier(asset.identifier || '');
                setEditCustomIcon(asset.custom_icon);
              }}
              disabled={isSaving}
              style={{ opacity: isSaving ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 16, color: Colors.light.textSecondary, fontWeight: '600' }}>
                Annulla
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving || !editName.trim()}
              style={{ opacity: (isSaving || !editName.trim()) ? 0.5 : 1 }}
            >
              <Text style={{ fontSize: 16, color: Colors.light.tint, fontWeight: '600' }}>
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
            <Text style={{ fontSize: 16, color: Colors.light.tint, fontWeight: '600' }}>
              Modifica
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flex: 1 }}>
        <View style={{ padding: 16 }}>
          {/* Asset Info Card */}
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderRadius: 16,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1,
            marginBottom: 24
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
                  name={getAssetIcon(asset) as any} 
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
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: '#e1e1e6',
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
                      placeholder="Opzionale"
                      style={{
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        padding: 16,
                        fontSize: 16,
                        borderWidth: 1,
                        borderColor: '#e1e1e6',
                        textAlign: 'center'
                      }}
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                      Icona
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
                      <Pressable
                        onPress={() => setShowIconPicker(true)}
                        style={{
                          backgroundColor: Colors.light.tint,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8
                        }}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>
                          Cambia icona
                        </Text>
                      </Pressable>
                      {editCustomIcon && (
                        <Pressable
                          onPress={resetIcon}
                          style={{
                            backgroundColor: '#f2f2f7',
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 8
                          }}
                        >
                          <Text style={{ color: '#666', fontWeight: '600' }}>
                            Ripristina
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: Colors.light.text,
                    textAlign: 'center',
                    marginBottom: 8
                  }}>
                    {asset.name}
                  </Text>
                  {asset.identifier && (
                    <Text style={{
                      fontSize: 16,
                      color: Colors.light.textSecondary,
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
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              marginBottom: 16
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: Colors.light.border
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: Colors.light.text
                }}>
                  Scadenze
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors.light.textSecondary
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
                  <Text style={{ color: Colors.light.textSecondary }}>
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
                            color: Colors.light.text,
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
                            {deadline.recurrence_rrule && (
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
                                  {getRecurrenceText(deadline.recurrence_rrule).toUpperCase()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                      </Pressable>
                      {!isLast && (
                        <View style={{
                          height: 0.5,
                          backgroundColor: Colors.light.border,
                          marginLeft: 16
                        }} />
                      )}
                    </View>
                  );
                })
              )}
              
              {deadlines.length > 3 && (
                <View style={{
                  borderTopWidth: 0.5,
                  borderTopColor: Colors.light.border
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
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              marginBottom: 24
            }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 0.5,
                borderBottomColor: Colors.light.border
              }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: Colors.light.text
                }}>
                  Documenti
                </Text>
                <Text style={{
                  fontSize: 14,
                  color: Colors.light.textSecondary
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
                  <Text style={{ color: Colors.light.textSecondary }}>
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
                            color: Colors.light.text,
                            marginBottom: 4
                          }}>
                            {document.title}
                          </Text>
                          <Text style={{
                            fontSize: 14,
                            color: Colors.light.textSecondary
                          }}>
                            {formatDate(document.created_at)}
                            {document.tags && document.tags.length > 0 && (
                              <Text> • {document.tags.join(', ')}</Text>
                            )}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="document" size={16} color={Colors.light.textSecondary} />
                          <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
                        </View>
                      </Pressable>
                      {!isLast && (
                        <View style={{
                          height: 0.5,
                          backgroundColor: Colors.light.border,
                          marginLeft: 16
                        }} />
                      )}
                    </View>
                  );
                })
              )}
              
              {documents.length > 3 && (
                <View style={{
                  borderTopWidth: 0.5,
                  borderTopColor: Colors.light.border
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
                      Vedi tutti ({documents.length})
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {/* Delete Button */}
          {!isEditing && (
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1
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
        </View>
      </ScrollView>

      {/* Icon Picker Modal */}
      <IconPickerModal
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        onSelectIcon={handleIconSelect}
        selectedIcon={editCustomIcon || getAssetIcon(asset)}
      />

      {/* Deadline Detail Modal */}
      {selectedDeadline && (
        <DeadlineDetailModal
          visible={showDeadlineDetail}
          deadline={selectedDeadline}
          onClose={() => {
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onEdit={handleDeadlineUpdate}
          onAssetPress={(assetData) => {
            // Questo bene è già quello che stiamo visualizzando, non serve fare nulla
          }}
        />
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <DocumentDetailModal
          visible={showDocumentDetail}
          document={selectedDocument}
          onClose={() => {
            setShowDocumentDetail(false);
            setSelectedDocument(null);
          }}
          onUpdate={handleDocumentUpdate}
          onAssetPress={(assetData) => {
            // Questo bene è già quello che stiamo visualizzando, non serve fare nulla
          }}
          onDeadlinePress={(deadline) => {
            // Chiudi il modal del documento e apri quello della scadenza
            setShowDocumentDetail(false);
            setSelectedDocument(null);
            setTimeout(() => {
              setSelectedDeadline(deadline);
              setShowDeadlineDetail(true);
            }, 100);
          }}
        />
      )}
    </SafeAreaView>
  );
}
