import { deleteAsset, getAllDeadlines, getDocuments } from '@/lib/api';
import { Asset, Deadline, Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getDeadlineStatus(deadline: Deadline) {
  const now = new Date();
  const dueDate = new Date(deadline.due_at);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Se è scaduta (giorni negativi)
  if (diffDays < 0) {
    return {
      backgroundColor: '#ff3b30', // Rosso per scadute
    };
  }

  // Se scade entro 7 giorni
  if (diffDays <= 7) {
    return {
      backgroundColor: '#ff9500', // Arancione per prossima settimana
    };
  }

  // Se è lontana (più di 7 giorni) - nessun pallino
  return null;
}

interface AssetDetailModalProps {
  visible: boolean;
  onClose: () => void;
  asset: Asset | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onDeadlinePress?: (deadline: Deadline) => void;
  onDocumentPress?: (document: Document) => void;
}

export default function AssetDetailModal({ visible, onClose, asset, onEdit, onDelete, onDeadlinePress, onDocumentPress }: AssetDetailModalProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'deadlines' | 'documents'>('deadlines');
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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

  useFocusEffect(useCallback(() => { if (visible && asset) load(); }, [visible, asset]));

  async function load() {
    if (!asset) return;
    try {
      setLoading(true);
      const [dls, docs] = await Promise.all([getAllDeadlines(), getDocuments()]);
      setDeadlines(dls.filter(d => d.asset_id === asset.id));
      setDocuments(docs.filter(d => d.asset_id === asset.id));
    } catch (e) {
      Alert.alert('Errore', 'Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    if (!asset) return;
    Alert.alert('Conferma', `Eliminare "${asset.name}"?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => { await deleteAsset(asset.id); onClose(); onDelete?.(); } }
    ]);
  }

  function closeModal() {
    setShowActionsMenu(false);
    onClose();
  }

  if (!asset) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#0a84ff', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={getAssetIcon(asset) as any} size={18} color={'#fff'} />
              </View>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '800' }}>{asset.name}</Text>
                <Text style={{ color: '#666' }}>{asset.type}{asset.identifier ? ` • ${asset.identifier}` : ''}</Text>
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* Menu azioni */}
              <View style={{ position: 'relative' }}>
                <Pressable 
                  onPress={() => setShowActionsMenu(!showActionsMenu)}
                  style={{ 
                    width: 36,
                    height: 36,
                    backgroundColor: '#0a84ff', 
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
                </Pressable>

                {showActionsMenu && (
                  <View style={{
                    position: 'absolute',
                    top: 40,
                    right: 0,
                    backgroundColor: '#fff',
                    borderRadius: 12,
                    paddingVertical: 8,
                    minWidth: 150,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    elevation: 8,
                    borderWidth: 1,
                    borderColor: '#e5e5ea',
                    zIndex: 1000
                  }}>
                    {onEdit && (
                      <Pressable
                        onPress={() => {
                          setShowActionsMenu(false);
                          onEdit();
                        }}
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: 12, 
                          paddingHorizontal: 16, 
                          paddingVertical: 12 
                        }}
                      >
                        <Ionicons name="pencil" size={16} color="#0a84ff" />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0a84ff' }}>
                          Modifica
                        </Text>
                      </Pressable>
                    )}
                    {onDelete && (
                      <Pressable
                        onPress={() => {
                          setShowActionsMenu(false);
                          handleDelete();
                        }}
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: 12, 
                          paddingHorizontal: 16, 
                          paddingVertical: 12 
                        }}
                      >
                        <Ionicons name="trash" size={16} color="#ff3b30" />
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#ff3b30' }}>
                          Elimina
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              {/* Pulsante chiudi */}
              <Pressable 
                onPress={closeModal}
                style={{ 
                  width: 36,
                  height: 36,
                  backgroundColor: '#f2f2f7', 
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="close" size={18} color="#666" />
              </Pressable>
            </View>
          </View>

              <View style={{ flexDirection: 'row', backgroundColor: '#f2f2f7', padding: 4, borderRadius: 12, marginBottom: 12 }}>
                <Pressable onPress={() => setTab('deadlines')} style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: tab==='deadlines' ? '#0a84ff' : 'transparent', alignItems: 'center' }}>
                  <Text style={{ color: tab==='deadlines' ? '#fff' : '#000', fontWeight: '600' }}>
                    Scadenze ({deadlines.length})
                  </Text>
                </Pressable>
                <Pressable onPress={() => setTab('documents')} style={{ flex: 1, padding: 8, borderRadius: 8, backgroundColor: tab==='documents' ? '#0a84ff' : 'transparent', alignItems: 'center' }}>
                  <Text style={{ color: tab==='documents' ? '#fff' : '#000', fontWeight: '600' }}>
                    Documenti ({documents.length})
                  </Text>
                </Pressable>
              </View>

              <View style={{ flex: 1 }}>
                {loading ? (
                  <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
                    <ActivityIndicator />
                    <Text style={{ color: '#666', marginTop: 8 }}>Caricamento...</Text>
                  </View>
                ) : tab==='deadlines' ? (
                  <FlatList
                    data={deadlines}
                    keyExtractor={(i)=>i.id}
                    renderItem={({ item }: { item: Deadline }) => {
                      const isOverdue = new Date(item.due_at) < new Date() && item.status === 'pending';
                      const isUpcoming = !isOverdue && item.status === 'pending' && (new Date(item.due_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24) <= 7;
                      
                      return (
                        <Pressable 
                          onPress={() => onDeadlinePress?.(item)}
                          style={{ 
                            padding: 12, 
                            borderRadius: 8, 
                            backgroundColor: '#f8f9fa', 
                            marginBottom: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              {(isOverdue || isUpcoming) && (
                                <View style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: isOverdue ? '#ff3b30' : '#ff9500'
                                }} />
                              )}
                              <Text style={{ 
                                fontSize: 14, 
                                fontWeight: '600',
                                textDecorationLine: item.status === 'done' ? 'line-through' : 'none',
                                opacity: item.status === 'done' ? 0.6 : 1
                              }}>
                                {item.title}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                              {new Date(item.due_at).toLocaleDateString('it-IT')}
                              {item.recurrence_rrule && ' • Ricorrente'}
                            </Text>
                          </View>
                          <Ionicons name="chevron-forward" size={16} color="#999" />
                        </Pressable>
                      );
                    }}
                    ListEmptyComponent={()=> (<View style={{ padding: 32, alignItems: 'center' }}><Text style={{ color:'#666' }}>Nessuna scadenza</Text></View>)}
                  />
                ) : (
                  <FlatList
                    data={documents}
                    keyExtractor={(i)=>i.id}
                    renderItem={({ item }: { item: Document }) => (
                      <Pressable 
                        onPress={() => onDocumentPress?.(item)}
                        style={{ 
                          padding: 12, 
                          borderRadius: 8, 
                          backgroundColor: '#f8f9fa', 
                          marginBottom: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600' }}>{item.title}</Text>
                          {item.tags && item.tags.length > 0 && (
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
                              {item.tags.slice(0, 2).map((tag, index) => (
                                <View key={index} style={{ backgroundColor: '#e8f4ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginRight: 4 }}>
                                  <Text style={{ fontSize: 10, color: '#0a84ff' }}>{tag}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#999" />
                      </Pressable>
                    )}
                    ListEmptyComponent={()=> (<View style={{ padding: 32, alignItems: 'center' }}><Text style={{ color:'#666' }}>Nessun documento</Text></View>)}
                  />
                )}
              </View>
            </View>
          </SafeAreaView>
    </Modal>
  );
} 