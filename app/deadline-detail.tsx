import { AssociateAssetModal } from '@/components/modals/AssociateAssetModal';
import { AssociateDocumentModal } from '@/components/modals/AssociateDocumentModal';
import { EditDeadlineModal } from '@/components/modals/EditDeadlineModal';
import { Colors } from '@/constants/Colors';
import { RECURRENCE_TEMPLATES } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Deadline } from '@/lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DeadlineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [deadline, setDeadline] = useState<Deadline | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssociateAssetModal, setShowAssociateAssetModal] = useState(false);
  const [showAssociateDocumentModal, setShowAssociateDocumentModal] = useState(false);

  useEffect(() => {
    if (id) {
      loadDeadlineData();
    }
  }, [id]);

  const loadDeadlineData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deadlines')
        .select(`
          *,
          asset:assets(id, name, type),
          deadline_assets(
            asset:assets(
              id, name, type, identifier, custom_icon, template_key, created_at, updated_at
            )
          ),
          deadline_documents(
            document:documents(
              id, title, description, tags, storage_path, created_at, updated_at
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Processa i dati per estrarre gli array di beni e documenti
      const processedData = {
        ...data,
        assets: data.deadline_assets?.map((da: any) => da.asset) || [],
        documents: data.deadline_documents?.map((dd: any) => dd.document) || []
      };
      
      setDeadline(processedData);
    } catch (error) {
      console.error('Error loading deadline:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli della scadenza');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!deadline) return;

    try {
      const newStatus = deadline.status === 'done' ? 'pending' : 'done';
      const { error } = await supabase
        .from('deadlines')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', deadline.id);

      if (error) throw error;

      setDeadline({
        ...deadline,
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      Alert.alert('Successo', newStatus === 'done' ? 'Scadenza completata' : 'Scadenza riaperta');
    } catch (error) {
      console.error('Error updating deadline status:', error);
      Alert.alert('Errore', 'Impossibile aggiornare lo stato della scadenza');
    }
  };

  const handleRemoveAsset = async (assetId: string) => {
    if (!deadline) return;

    Alert.alert(
      'Rimuovi bene',
      'Sei sicuro di voler rimuovere questo bene dalla scadenza?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('deadline_assets')
                .delete()
                .eq('deadline_id', deadline.id)
                .eq('asset_id', assetId);

              if (error) throw error;

              // Aggiorna lo stato locale
              setDeadline({
                ...deadline,
                assets: deadline.assets?.filter(a => a.id !== assetId) || []
              });

              Alert.alert('Successo', 'Bene rimosso dalla scadenza');
            } catch (error) {
              console.error('Error removing asset:', error);
              Alert.alert('Errore', 'Impossibile rimuovere il bene');
            }
          }
        }
      ]
    );
  };

  const handleRemoveDocument = async (documentId: string) => {
    if (!deadline) return;

    Alert.alert(
      'Rimuovi documento',
      'Sei sicuro di voler rimuovere questo documento dalla scadenza?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Rimuovi',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('deadline_documents')
                .delete()
                .eq('deadline_id', deadline.id)
                .eq('document_id', documentId);

              if (error) throw error;

              // Aggiorna lo stato locale
              setDeadline({
                ...deadline,
                documents: deadline.documents?.filter(d => d.id !== documentId) || []
              });

              Alert.alert('Successo', 'Documento rimosso dalla scadenza');
            } catch (error) {
              console.error('Error removing document:', error);
              Alert.alert('Errore', 'Impossibile rimuovere il documento');
            }
          }
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina scadenza',
      'Sei sicuro di voler eliminare questa scadenza? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        { text: 'Elimina', style: 'destructive', onPress: confirmDelete }
      ]
    );
  };

  const confirmDelete = async () => {
    if (!deadline) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('deadlines')
        .delete()
        .eq('id', deadline.id);

      if (error) throw error;
      
      Alert.alert('Successo', 'Scadenza eliminata con successo');
      router.back();
    } catch (error) {
      console.error('Error deleting deadline:', error);
      Alert.alert('Errore', 'Impossibile eliminare la scadenza');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleSaveEdit = async (updatedDeadline: Deadline) => {
    // Ricarica i dati completi dal database per assicurarsi che tutto sia aggiornato
    await loadDeadlineData();
  };

  const handleDocumentPress = (document: any) => {
    // TODO: Navigare al dettaglio del documento
    Alert.alert('Info', 'Dettaglio documento in sviluppo');
  };

  const handleAssociateAsset = () => {
    setShowAssociateAssetModal(true);
  };

  const handleAssetAssociated = async (assetId: string) => {
    // Ricarica i dati della scadenza per mostrare il bene associato
    await loadDeadlineData();
  };

  const handleAssociateDocument = () => {
    setShowAssociateDocumentModal(true);
  };

  const handleDocumentAssociated = async (documentId: string) => {
    // Ricarica i dati della scadenza per mostrare i documenti associati
    await loadDeadlineData();
  };

  const handleAssetPress = (asset?: Asset) => {
    const assetToNavigate = asset || deadline?.asset;
    if (assetToNavigate) {
      router.push({ pathname: '/asset-detail', params: { id: assetToNavigate.id } });
    }
  };

  function getDaysUntil(date: string) {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Oggi';
    if (days === 1) return 'Domani';
    if (days < 0) return `${Math.abs(days)} giorni fa`;
    return `Fra ${days} giorni`;
  }

  function getRecurrenceLabel(rrule: string): string {
    const template = Object.values(RECURRENCE_TEMPLATES).find(t => t.rule === rrule);
    return template ? template.label : 'Ricorrenza personalizzata';
  }

  function getDeadlineStatus(deadline: Deadline) {
    if (deadline.status === 'done') {
      return { text: 'Completata', color: '#34c759', showCheckmark: true };
    }
    
    const days = Math.ceil((new Date(deadline.due_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (days < 0) {
      return { text: 'Scaduta', color: '#ff3b30', showCheckmark: false };
    } else if (days === 0) {
      return { text: 'Oggi', color: '#ff9500', showCheckmark: false };
    } else if (days <= 7) {
      return { text: 'Prossima', color: '#ff9500', showCheckmark: false };
    } else {
      return { text: 'Futura', color: '#007aff', showCheckmark: false };
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.light.textSecondary }}>Caricamento...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!deadline) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.light.textSecondary }}>Scadenza non trovata</Text>
        </View>
      </SafeAreaView>
    );
  }

  const status = getDeadlineStatus(deadline);

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
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          Dettaglio Scadenza
        </Text>

        <Pressable
          onPress={handleEdit}
          disabled={isDeleting}
          style={{ opacity: isDeleting ? 0.5 : 1 }}
        >
          <Text style={{ 
            fontSize: 16, 
            color: Colors.light.tint, 
            fontWeight: '600' 
          }}>
            Modifica
          </Text>
        </Pressable>
      </View>

      <ScrollView 
        style={{ flex: 1, backgroundColor: Colors.light.background }} 
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingBottom: 32 }}>
          {/* Titolo e Note in Card - Stile iOS */}
          <View style={{
            marginBottom: 32,
            paddingHorizontal: 16,
            paddingTop: 16
          }}>
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              alignItems: 'center'
            }}>
              {/* Titolo */}
              <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: Colors.light.text,
                textAlign: 'center',
                marginBottom: deadline.notes && deadline.notes.trim() !== '' ? 16 : 0
              }}>
                {deadline.title}
              </Text>
              
              {/* Note - Solo se presenti */}
              {deadline.notes && deadline.notes.trim() !== '' && (
                <Text style={{
                  fontSize: 16,
                  color: Colors.light.textSecondary,
                  textAlign: 'center',
                  lineHeight: 22
                }}>
                  {deadline.notes}
                </Text>
              )}
            </View>
            
            {/* Status Badge - Fuori dalla card */}
            {deadline.status === 'done' ? (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'center',
                marginTop: 16
              }}>
                <View style={{
                  backgroundColor: status.color + '15',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}>
                  <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: status.color
                  }}>
                    {status.text}
                  </Text>
                </View>
                {status.showCheckmark && (
                  <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#34c759',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MaterialCommunityIcons name="check" size={14} color="#fff" />
                  </View>
                )}
              </View>
            ) : null}
          </View>

          {/* Informazioni Principali */}
          <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: Colors.light.text,
              marginBottom: 12,
              marginLeft: 4
            }}>
              Informazioni
            </Text>
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1
            }}>
              <View>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}>
                  <View style={{
                    width: 29,
                    height: 29,
                    borderRadius: 6,
                    backgroundColor: Colors.light.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <MaterialCommunityIcons name="calendar" size={18} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: Colors.light.text
                    }}>
                      {new Date(deadline.due_at).toLocaleDateString('it-IT', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </Text>
                    <Text style={{
                      fontSize: 14,
                      color: status.color,
                      fontWeight: '500',
                      marginTop: 2
                    }}>
                      {deadline.status === 'done' ? 'Completata' : getDaysUntil(deadline.due_at)}
                    </Text>
                  </View>
                  
                  {/* Icona stato in alto a destra */}
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: status.color + '15',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <MaterialCommunityIcons 
                      name={
                        deadline.status === 'done' ? 'check-circle' : 
                        deadline.status === 'skipped' ? 'close-circle' :
                        new Date(deadline.due_at) < new Date() ? 'alert-circle' : 'clock-outline'
                      } 
                      size={20} 
                      color={status.color} 
                    />
                  </View>
                </View>
                
                {deadline.recurrence_rrule && (
                  <>
                    <View style={{
                      height: 0.33,
                      backgroundColor: Colors.light.border,
                      marginLeft: 57
                    }} />
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12
                    }}>
                      <View style={{
                        width: 29,
                        height: 29,
                        borderRadius: 6,
                        backgroundColor: Colors.light.tint,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        <MaterialCommunityIcons name="repeat" size={18} color="#fff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          fontSize: 16,
                          fontWeight: '600',
                          color: Colors.light.text
                        }}>
                          {getRecurrenceLabel(deadline.recurrence_rrule)}
                        </Text>
                      </View>
                    </View>
                  </>
                )}


              </View>
            </View>
          </View>

          {/* Pulsante Completa/Riapri - Fuori dal container */}
          <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
            <Pressable
              onPress={handleToggleStatus}
              disabled={isDeleting}
              style={{
                backgroundColor: deadline.status === 'done' ? '#ff9500' + '15' : '#34c759' + '15',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderRadius: 12,
                opacity: isDeleting ? 0.5 : 1,
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: deadline.status === 'done' ? '#ff9500' : '#34c759'
              }}>
                {deadline.status === 'done' ? 'Riapri Scadenza' : 'Segna come Completata'}
              </Text>
            </Pressable>
          </View>
          </View>

          {/* Beni Associati - Sempre visibile */}
          <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: Colors.light.text,
              marginBottom: 12,
              marginLeft: 4
            }}>
              Beni Associati {deadline.assets && deadline.assets.length > 0 && `(${deadline.assets.length})`}
            </Text>
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              overflow: 'hidden'
            }}>
              {deadline.assets && deadline.assets.length > 0 ? (
                deadline.assets.map((asset, index) => (
                  <Pressable
                    key={asset.id}
                    onPress={() => handleAssetPress(asset)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: index < deadline.assets.length - 1 ? 0.33 : 0,
                      borderBottomColor: Colors.light.border
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
                      <MaterialCommunityIcons 
                        name={asset.type === 'vehicle' ? 'car' : asset.type === 'home' ? 'home' : 'cube'} 
                        size={18} 
                        color="#fff" 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: Colors.light.text
                      }}>
                        {asset.name}
                      </Text>
                      <Text style={{
                        fontSize: 14,
                        color: Colors.light.textSecondary,
                        marginTop: 2
                      }}>
                        {asset.type === 'vehicle' ? 'Veicolo' : asset.type === 'home' ? 'Casa' : 'Altro'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Pressable
                        onPress={() => handleRemoveAsset(asset.id)}
                        style={{
                          padding: 8,
                          marginRight: 8
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={16} color={Colors.light.textSecondary} />
                      </Pressable>
                      <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}>
                  <Text style={{
                    fontSize: 16,
                    color: Colors.light.textSecondary
                  }}>
                    Nessun bene associato
                  </Text>
                </View>
              )}
              
              {/* Placeholder per aggiungere bene */}
              <Pressable
                onPress={handleAssociateAsset}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 0.33,
                  borderTopColor: Colors.light.border
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
                  <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                </View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Colors.light.tint
                }}>
                  Associa Bene
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Documenti Associati - Sempre visibile */}
          <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '600', 
              color: Colors.light.text,
              marginBottom: 12,
              marginLeft: 4
            }}>
              Documenti Associati {deadline.documents && deadline.documents.length > 0 && `(${deadline.documents.length})`}
            </Text>
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              overflow: 'hidden'
            }}>
              {deadline.documents && deadline.documents.length > 0 ? (
                deadline.documents.map((document, index) => (
                  <Pressable
                    key={document.id}
                    onPress={() => handleDocumentPress(document)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderBottomWidth: index < deadline.documents.length - 1 ? 0.33 : 0,
                      borderBottomColor: Colors.light.border
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
                      <MaterialCommunityIcons name="file-document" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: Colors.light.text
                      }}>
                        {document.title}
                      </Text>
                      {document.description && (
                        <Text style={{
                          fontSize: 14,
                          color: Colors.light.textSecondary,
                          marginTop: 2
                        }}>
                          {document.description}
                        </Text>
                      )}
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Pressable
                        onPress={() => handleRemoveDocument(document.id)}
                        style={{
                          padding: 8,
                          marginRight: 8
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={16} color={Colors.light.textSecondary} />
                      </Pressable>
                      <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
                    </View>
                  </Pressable>
                ))
              ) : (
                <View style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}>
                  <Text style={{
                    fontSize: 16,
                    color: Colors.light.textSecondary
                  }}>
                    Nessun documento associato
                  </Text>
                </View>
              )}
              
              {/* Placeholder per aggiungere documento */}
              <Pressable
                onPress={handleAssociateDocument}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 0.33,
                  borderTopColor: Colors.light.border
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
                  <MaterialCommunityIcons name="plus" size={18} color="#fff" />
                </View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: Colors.light.tint
                }}>
                  Associa Documento
                </Text>
              </Pressable>
            </View>
          </View>
      </ScrollView>

      <EditDeadlineModal
        visible={showEditModal}
        deadline={deadline}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEdit}
      />

      <AssociateAssetModal
        visible={showAssociateAssetModal}
        deadlineId={deadline?.id || ''}
        onClose={() => setShowAssociateAssetModal(false)}
        onAssociate={handleAssetAssociated}
      />

      <AssociateDocumentModal
        visible={showAssociateDocumentModal}
        deadlineId={deadline?.id || ''}
        onClose={() => setShowAssociateDocumentModal(false)}
        onAssociate={handleDocumentAssociated}
      />
    </SafeAreaView>
  );
}
