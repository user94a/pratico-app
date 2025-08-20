import { getAssets, RECURRENCE_TEMPLATES, updateDeadline } from '@/lib/api';
import { Asset, Deadline } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const typeIcons = {
  car: 'car-outline',
  house: 'home-outline',
  other: 'cube-outline',
} as const;

interface EditDeadlineModalProps {
  visible: boolean;
  onClose: () => void;
  deadline: Deadline | null;
  onUpdate: () => void;
}

export function EditDeadlineModal({ visible, onClose, deadline, onUpdate }: EditDeadlineModalProps) {
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(new Date());
  const [notes, setNotes] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<keyof typeof RECURRENCE_TEMPLATES>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deadline && visible) {
      setTitle(deadline.title);
      setDueAt(new Date(deadline.due_at));
      setNotes(deadline.notes || '');
      setSelectedAsset(deadline.asset ? { 
        id: deadline.asset_id!, 
        name: deadline.asset.name, 
        type: 'other' as const, 
        identifier: null, 
        created_at: '', 
        updated_at: '' 
      } : null);
      setIsRecurring(!!deadline.recurrence_rrule);
      
      // Trova il tipo di ricorrenza dall'RRULE
      if (deadline.recurrence_rrule) {
        const foundType = Object.entries(RECURRENCE_TEMPLATES).find(
          ([_, template]) => template.rule === deadline.recurrence_rrule
        )?.[0] as keyof typeof RECURRENCE_TEMPLATES;
        
        if (foundType) {
          setRecurrenceType(foundType);
        }
      }
      
      loadAssets();
    }
  }, [deadline, visible]);

  async function loadAssets() {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  }

  async function handleSubmit() {
    if (!deadline || !title.trim()) {
      Alert.alert('Errore', 'Il titolo è richiesto');
      return;
    }

    try {
      setIsLoading(true);
      await updateDeadline(deadline.id, {
        title: title.trim(),
        dueAt: dueAt.toISOString(),
        notes: notes.trim() || undefined,
        assetId: selectedAsset?.id,
        isRecurring,
        recurrenceRule: isRecurring ? RECURRENCE_TEMPLATES[recurrenceType].rule : undefined
      });
      
      Alert.alert('Successo', 'Scadenza aggiornata');
      onUpdate();
      onClose();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Impossibile aggiornare la scadenza');
    } finally {
      setIsLoading(false);
    }
  }

  if (!deadline) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <View style={{ gap: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: '800' }}>Modifica scadenza</Text>
              <Pressable onPress={onClose} style={{ padding: 8, backgroundColor: '#f2f2f7', borderRadius: 8 }}>
                <Text style={{ fontWeight: '600' }}>Chiudi</Text>
              </Pressable>
            </View>

            <View>
              <Text style={{ fontWeight: '600', marginBottom: 8 }}>Titolo</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12, 
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 0
                }}
              />
            </View>

            <View>
              <Text style={{ fontWeight: '600', marginBottom: 8 }}>Data scadenza</Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{ fontSize: 16 }}>{dueAt.toLocaleDateString('it-IT')}</Text>
                <Ionicons name="calendar" size={20} color="#0a84ff" />
              </Pressable>
              {showDatePicker && (
                <DateTimePicker
                  value={dueAt}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) setDueAt(selectedDate);
                  }}
                  themeVariant="light"
                  style={Platform.OS === 'ios' ? { backgroundColor: '#ffffff' } : undefined}
                />
              )}
            </View>

            <View>
              <Text style={{ fontWeight: '600', marginBottom: 8 }}>Bene associato (opzionale)</Text>
              <Pressable
                onPress={() => setShowAssetPicker(!showAssetPicker)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 12,
                  borderWidth: 1,
                  borderColor: '#e5e5ea',
                  borderRadius: 12,
                  backgroundColor: '#fff'
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="cube" size={20} color="#0a84ff" />
                  <Text>{selectedAsset ? selectedAsset.name : 'Seleziona bene'}</Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </Pressable>
              
              {showAssetPicker && (
                <View style={{ marginTop: 8, borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, backgroundColor: '#fff' }}>
                  <Pressable
                    onPress={() => {
                      setSelectedAsset(null);
                      setShowAssetPicker(false);
                    }}
                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f2f2f7' }}
                  >
                    <Text>Nessun bene</Text>
                  </Pressable>
                  {assets.map((asset) => (
                    <Pressable
                      key={asset.id}
                      onPress={() => {
                        setSelectedAsset(asset);
                        setShowAssetPicker(false);
                      }}
                      style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}
                    >
                      <Ionicons name={typeIcons[asset.type as keyof typeof typeIcons] || 'cube-outline'} size={16} color="#666" />
                      <Text>{asset.name}</Text>
                      {asset.identifier && <Text style={{ color: '#666' }}>• {asset.identifier}</Text>}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontWeight: '600' }}>Scadenza ricorrente</Text>
                <Pressable
                  onPress={() => setIsRecurring(!isRecurring)}
                  style={{
                    width: 51,
                    height: 31,
                    borderRadius: 15.5,
                    backgroundColor: isRecurring ? '#34c759' : '#e5e5ea',
                    justifyContent: 'center',
                    paddingHorizontal: 2
                  }}
                >
                  <View style={{
                    width: 27,
                    height: 27,
                    borderRadius: 13.5,
                    backgroundColor: '#fff',
                    transform: [{ translateX: isRecurring ? 18 : 0 }]
                  }} />
                </Pressable>
              </View>

              {isRecurring && (
                <Pressable
                  onPress={() => {
                    if (Platform.OS === 'ios') {
                      const options = ['Annulla', ...Object.values(RECURRENCE_TEMPLATES).map(t => t.label)];
                      ActionSheetIOS.showActionSheetWithOptions(
                        {
                          options,
                          cancelButtonIndex: 0,
                          title: 'Seleziona frequenza'
                        },
                        (buttonIndex) => {
                          if (buttonIndex > 0) {
                            const keys = Object.keys(RECURRENCE_TEMPLATES) as (keyof typeof RECURRENCE_TEMPLATES)[];
                            setRecurrenceType(keys[buttonIndex - 1]);
                          }
                        }
                      );
                    }
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    borderWidth: 1,
                    borderColor: '#e5e5ea',
                    borderRadius: 12,
                    backgroundColor: '#fff'
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="refresh" size={20} color="#0a84ff" />
                    <Text>{RECURRENCE_TEMPLATES[recurrenceType].label}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#999" />
                </Pressable>
              )}

              {showRecurrencePicker && (
                <View style={{ marginTop: 8, borderWidth: 1, borderColor: '#e5e5ea', borderRadius: 12, backgroundColor: '#fff' }}>
                  {Object.entries(RECURRENCE_TEMPLATES).map(([key, template]) => (
                    <Pressable
                      key={key}
                      onPress={() => {
                        setRecurrenceType(key as keyof typeof RECURRENCE_TEMPLATES);
                        setShowRecurrencePicker(false);
                      }}
                      style={{
                        padding: 12,
                        borderBottomWidth: key === Object.keys(RECURRENCE_TEMPLATES).pop() ? 0 : 1,
                        borderBottomColor: '#f2f2f7'
                      }}
                    >
                      <Text>{template.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View>
              <Text style={{ fontWeight: '600', marginBottom: 8 }}>Note (opzionali)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12, 
                  padding: 16,
                  fontSize: 16,
                  borderWidth: 0,
                  height: 80,
                  textAlignVertical: 'top'
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: '#f2f2f7',
                  alignItems: 'center'
                }}
              >
                <Text style={{ fontWeight: '600' }}>Annulla</Text>
              </Pressable>

              <Pressable
                onPress={handleSubmit}
                disabled={isLoading || !title.trim()}
                style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: !title.trim() ? '#f2f2f7' : '#0a84ff',
                  alignItems: 'center',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <Text style={{
                  fontWeight: '600',
                  color: !title.trim() ? '#000' : '#fff'
                }}>
                  {isLoading ? 'Salvando...' : 'Salva'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
} 