import { RECURRENCE_TEMPLATES } from '@/lib/api';
import { Deadline } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function DeadlineDetailModal({ visible, onClose, deadline, onToggleStatus, onDelete, onEdit, onAssetPress }: {
  visible: boolean;
  onClose: () => void;
  deadline: Deadline | null;
  onToggleStatus?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onAssetPress?: (asset: { id: string; name: string }) => void;
}) {
  const [showActionsMenu, setShowActionsMenu] = useState(false);

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

  function closeModal() {
    setShowActionsMenu(false);
    onClose();
  }

  if (!deadline) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, padding: 16 }}>
          {/* Header con titolo e pulsanti */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            marginBottom: 24 
          }}>
            <Text style={{ 
              fontSize: 24, 
              fontWeight: '800', 
              flex: 1, 
              marginRight: 16 
            }}>
              {deadline.title}
            </Text>
            
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
                    minWidth: 180,
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
                    {onToggleStatus && (
                      <Pressable
                        onPress={() => {
                          setShowActionsMenu(false);
                          onToggleStatus();
                        }}
                        style={{ 
                          flexDirection: 'row', 
                          alignItems: 'center', 
                          gap: 12, 
                          paddingHorizontal: 16, 
                          paddingVertical: 12 
                        }}
                      >
                        <Ionicons 
                          name={deadline.status === 'done' ? 'refresh' : 'checkmark'} 
                          size={16} 
                          color={deadline.status === 'done' ? '#ff9500' : '#34c759'} 
                        />
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: '600', 
                          color: deadline.status === 'done' ? '#ff9500' : '#34c759' 
                        }}>
                          {deadline.status === 'done' ? 'Riapri' : 'Completa'}
                        </Text>
                      </Pressable>
                    )}
                    {onDelete && (
                      <Pressable
                        onPress={() => {
                          setShowActionsMenu(false);
                          onDelete();
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

          {/* Contenuto principale */}
          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontWeight: '600', marginBottom: 4 }}>Data scadenza</Text>
              <Text style={{ color: '#666' }}>
                {new Date(deadline.due_at).toLocaleDateString('it-IT', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
              <Text style={{ color: '#666', marginTop: 4 }}>
                {deadline.status === 'done' ? 'Completata' : getDaysUntil(deadline.due_at)}
              </Text>
            </View>
            
            {deadline.recurrence_rrule && (
              <View>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>Ricorrenza</Text>
                <View style={{
                  backgroundColor: '#e8f4ff',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Ionicons name="repeat" size={16} color="#0a84ff" />
                  <Text style={{ color: '#0a84ff', fontWeight: '600' }}>
                    {getRecurrenceLabel(deadline.recurrence_rrule)}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Asset associato */}
            {deadline.asset?.name && (
              <>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Bene Associato</Text>
                <Pressable
                  onPress={() => deadline.asset && onAssetPress?.({ id: deadline.asset_id!, name: deadline.asset.name })}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 12,
                    marginBottom: 16
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#0a84ff',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Ionicons 
                        name={deadline.asset?.type === 'car' ? 'car' : deadline.asset?.type === 'house' ? 'home' : 'cube'} 
                        size={16} 
                        color="#fff" 
                      />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{deadline.asset.name}</Text>
                      {deadline.asset?.type && (
                        <Text style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>
                          {deadline.asset.type === 'car' ? 'Auto/Moto' : deadline.asset.type === 'house' ? 'Casa' : 'Altro'}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#999" />
                </Pressable>
              </>
            )}
            
            {deadline.notes && (
              <View>
                <Text style={{ fontWeight: '600', marginBottom: 4 }}>Note</Text>
                <Text style={{ color: '#666' }}>{deadline.notes}</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
} 