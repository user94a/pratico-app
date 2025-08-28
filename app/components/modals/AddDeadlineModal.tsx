import { Colors } from '@/constants/Colors';
import { createDeadline, getAssets, getDocuments } from '@/lib/api';
import { Asset, Document, Deadline } from '@/lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Template per le ricorrenze
const RECURRENCE_TEMPLATES = {
  daily: { label: 'Giornaliera', rule: 'FREQ=DAILY' },
  weekly: { label: 'Settimanale', rule: 'FREQ=WEEKLY' },
  monthly: { label: 'Mensile', rule: 'FREQ=MONTHLY' },
  yearly: { label: 'Annuale', rule: 'FREQ=YEARLY' }
};

export function AddDeadlineModal({ visible, onClose, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (deadline: Deadline) => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<keyof typeof RECURRENCE_TEMPLATES>('monthly');
  
  // Stati per beni e documenti
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [assetSearchText, setAssetSearchText] = useState('');
  const [documentSearchText, setDocumentSearchText] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  // Carica beni e documenti disponibili
  useEffect(() => {
    if (visible) {
      loadAvailableAssets();
      loadAvailableDocuments();
    }
  }, [visible]);

  const loadAvailableAssets = async () => {
    try {
      setLoadingAssets(true);
      const data = await getAssets();
      setAvailableAssets(data);
    } catch (error: any) {
      console.error('Errore nel caricamento dei beni:', error);
      Alert.alert('Errore', 'Impossibile caricare i beni');
    } finally {
      setLoadingAssets(false);
    }
  };

  const loadAvailableDocuments = async () => {
    try {
      setLoadingDocuments(true);
      const data = await getDocuments();
      setAvailableDocuments(data);
    } catch (error: any) {
      console.error('Errore nel caricamento dei documenti:', error);
      Alert.alert('Errore', 'Impossibile caricare i documenti');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Errore', 'Il titolo è obbligatorio');
      return;
    }

    try {
      setSaving(true);
      
      const deadlineData = {
        title: title.trim(),
        due_at: dueDate.toISOString(),
        notes: notes.trim() || null,
        recurrence_rule: isRecurring ? RECURRENCE_TEMPLATES[selectedRecurrence].rule : null
      };

      const newDeadline = await createDeadline(deadlineData);
      
      // TODO: Associare beni e documenti selezionati
      // Per ora creiamo solo la scadenza base
      
      onSubmit(newDeadline);

      // Reset form
      setTitle('');
      setDueDate(new Date());
      setNotes('');
      setIsRecurring(false);
      setSelectedRecurrence('monthly');
      setSelectedAssets([]);
      setSelectedDocuments([]);
    } catch (error: any) {
      console.error('Errore nella creazione della scadenza:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile creare la scadenza. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => handleSubmit() },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDueDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setSelectedRecurrence('monthly');
    setSelectedAssets([]);
    setSelectedDocuments([]);
    onClose();
  };

  const recurrenceKeys = Object.keys(RECURRENCE_TEMPLATES) as (keyof typeof RECURRENCE_TEMPLATES)[];

  // Filtra beni e documenti in base alla ricerca
  const filteredAssets = availableAssets.filter(asset => 
    asset.name.toLowerCase().includes(assetSearchText.toLowerCase())
  );
  
  const filteredDocuments = availableDocuments.filter(document => 
    document.title.toLowerCase().includes(documentSearchText.toLowerCase())
  );

  const handleAssetSelection = (asset: Asset) => {
    if (selectedAssets.find(a => a.id === asset.id)) {
      setSelectedAssets(selectedAssets.filter(a => a.id !== asset.id));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const handleDocumentSelection = (document: Document) => {
    if (selectedDocuments.find(d => d.id === document.id)) {
      setSelectedDocuments(selectedDocuments.filter(d => d.id !== document.id));
    } else {
      setSelectedDocuments([...selectedDocuments, document]);
    }
  };

  const removeAsset = (assetId: string) => {
    setSelectedAssets(selectedAssets.filter(a => a.id !== assetId));
  };

  const removeDocument = (documentId: string) => {
    setSelectedDocuments(selectedDocuments.filter(d => d.id !== documentId));
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 0.33,
            borderBottomColor: '#e5e5ea',
            backgroundColor: '#fff'
          }}>
            <Pressable onPress={handleClose}>
              <Text style={{ 
                fontSize: 16, 
                color: '#666', 
                fontWeight: '600' 
              }}>
                Annulla
              </Text>
            </Pressable>
            
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: '#333'
            }}>
              Aggiungi Scadenza
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={!title.trim() || saving}
              style={{ opacity: (title.trim() && !saving) ? 1 : 0.5 }}
            >
              <Text style={{ 
                fontSize: 16, 
                color: '#0a84ff', 
                fontWeight: '600' 
              }}>
                {saving ? 'Salvo...' : 'Aggiungi'}
              </Text>
            </Pressable>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
          <View style={{ gap: 16 }}>
            {/* Titolo */}
            <View>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#333',
                marginBottom: 8
              }}>
                Titolo *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: '#333'
                }}
                placeholder="Inserisci il titolo della scadenza"
              />
            </View>

            {/* Data Scadenza */}
            <View>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#333',
                marginBottom: 8
              }}>
                Data Scadenza *
              </Text>
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
                <Text style={{ 
                  fontSize: 16,
                  color: '#333'
                }}>
                  {dueDate.toLocaleDateString('it-IT')}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color="#0a84ff" />
              </Pressable>
            </View>

            {/* Note */}
            <View>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#333',
                marginBottom: 8
              }}>
                Note
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12, 
                  padding: 16, 
                  height: 80,
                  fontSize: 16,
                  color: '#333',
                  textAlignVertical: 'top'
                }}
                placeholder="Inserisci note aggiuntive (opzionale)"
              />
            </View>

            {/* Scadenza Ricorrente */}
            <View style={{
              backgroundColor: '#f2f2f7',
              borderRadius: 12,
              padding: 16
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: isRecurring ? 16 : 0
              }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '600',
                  color: '#333'
                }}>
                  Scadenza ricorrente
                </Text>
                <Pressable
                  onPress={() => setIsRecurring(!isRecurring)}
                  style={{
                    width: 51,
                    height: 31,
                    borderRadius: 15.5,
                    backgroundColor: isRecurring ? '#0a84ff' : '#e5e5ea',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <View style={{
                    width: 27,
                    height: 27,
                    borderRadius: 13.5,
                    backgroundColor: '#fff',
                    transform: [{ translateX: isRecurring ? 10 : -10 }]
                  }} />
                </Pressable>
              </View>

              {isRecurring && (
                <View style={{ gap: 8 }}>
                  <Text style={{ 
                    fontSize: 14, 
                    color: '#666',
                    marginBottom: 8
                  }}>
                    Seleziona la frequenza:
                  </Text>
                  {recurrenceKeys.map((key) => (
                    <Pressable
                      key={key}
                      onPress={() => setSelectedRecurrence(key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 8,
                        backgroundColor: selectedRecurrence === key ? '#0a84ff15' : 'transparent'
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: selectedRecurrence === key ? '#0a84ff' : '#e5e5ea',
                        backgroundColor: selectedRecurrence === key ? '#0a84ff' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        {selectedRecurrence === key && (
                          <MaterialCommunityIcons name="check" size={12} color="#fff" />
                        )}
                      </View>
                      <Text style={{
                        fontSize: 16,
                        color: '#333',
                        fontWeight: selectedRecurrence === key ? '600' : '400'
                      }}>
                        {RECURRENCE_TEMPLATES[key].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            {/* Beni Associati */}
            <View>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#333',
                marginBottom: 8
              }}>
                Beni Associati
              </Text>
              
              {/* Beni selezionati */}
              {selectedAssets.length > 0 && (
                <View style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}>
                  {selectedAssets.map((asset) => (
                    <View key={asset.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: 0.33,
                      borderBottomColor: '#e5e5ea'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons 
                          name={asset.custom_icon || 'package'} 
                          size={20} 
                          color="#0a84ff" 
                        />
                        <Text style={{
                          fontSize: 16,
                          color: '#333',
                          marginLeft: 12,
                          flex: 1
                        }}>
                          {asset.name}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeAsset(asset.id)}
                        style={{
                          padding: 4
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#666" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Pulsante per aggiungere beni */}
              <Pressable
                onPress={() => setShowAssetPicker(true)}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{ 
                  fontSize: 16,
                  color: '#333'
                }}>
                  {selectedAssets.length > 0 ? `Aggiungi altri beni (${selectedAssets.length} selezionati)` : 'Aggiungi beni'}
                </Text>
                <MaterialCommunityIcons name="plus" size={20} color="#0a84ff" />
              </Pressable>
            </View>

            {/* Documenti Associati */}
            <View>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: '#333',
                marginBottom: 8
              }}>
                Documenti Associati
              </Text>
              
              {/* Documenti selezionati */}
              {selectedDocuments.length > 0 && (
                <View style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12
                }}>
                  {selectedDocuments.map((document) => (
                    <View key={document.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: 0.33,
                      borderBottomColor: '#e5e5ea'
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons 
                          name="text-box" 
                          size={20} 
                          color="#0a84ff" 
                        />
                        <Text style={{
                          fontSize: 16,
                          color: '#333',
                          marginLeft: 12,
                          flex: 1
                        }}>
                          {document.title}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => removeDocument(document.id)}
                        style={{
                          padding: 4
                        }}
                      >
                        <MaterialCommunityIcons name="close" size={16} color="#666" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Pulsante per aggiungere documenti */}
              <Pressable
                onPress={() => setShowDocumentPicker(true)}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Text style={{ 
                  fontSize: 16,
                  color: '#333'
                }}>
                  {selectedDocuments.length > 0 ? `Aggiungi altri documenti (${selectedDocuments.length} selezionati)` : 'Aggiungi documenti'}
                </Text>
                <MaterialCommunityIcons name="plus" size={20} color="#0a84ff" />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Date Picker nativo */}
        {showDatePicker && (
          <View style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTopWidth: 0.33,
            borderTopColor: '#e5e5ea',
            paddingBottom: 20
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.33,
              borderBottomColor: '#e5e5ea'
            }}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#666', 
                  fontWeight: '600' 
                }}>
                  Annulla
                </Text>
              </Pressable>
              
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#333'
              }}>
                Seleziona Data
              </Text>

              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#0a84ff', 
                  fontWeight: '600' 
                }}>
                  Fatto
                </Text>
              </Pressable>
            </View>
            
            <DateTimePicker
              value={dueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          </View>
        )}

        {/* Modal per selezione beni */}
        <Modal visible={showAssetPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.33,
              borderBottomColor: '#e5e5ea',
              backgroundColor: '#fff'
            }}>
              <Pressable onPress={() => setShowAssetPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#666', 
                  fontWeight: '600' 
                }}>
                  Annulla
                </Text>
              </Pressable>
              
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#333'
              }}>
                Seleziona Beni
              </Text>

              <Pressable onPress={() => setShowAssetPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#0a84ff', 
                  fontWeight: '600' 
                }}>
                  Fatto
                </Text>
              </Pressable>
            </View>

            {/* Barra di ricerca */}
            <View style={{ padding: 16 }}>
              <TextInput
                value={assetSearchText}
                onChangeText={setAssetSearchText}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: '#333'
                }}
                placeholder="Cerca beni..."
              />
            </View>

            {/* Lista beni */}
            {loadingAssets ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0a84ff" />
                <Text style={{ marginTop: 16, color: '#666' }}>Caricamento beni...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredAssets}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedAssets.find(a => a.id === item.id);
                  return (
                    <Pressable
                      onPress={() => handleAssetSelection(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: isSelected ? '#0a84ff15' : 'transparent'
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0a84ff' : '#e5e5ea',
                        backgroundColor: isSelected ? '#0a84ff' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={12} color="#fff" />
                        )}
                      </View>
                      <MaterialCommunityIcons 
                        name={item.custom_icon || 'package'} 
                        size={20} 
                        color="#0a84ff" 
                      />
                      <Text style={{
                        fontSize: 16,
                        color: '#333',
                        marginLeft: 12,
                        flex: 1
                      }}>
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </Modal>

        {/* Modal per selezione documenti */}
        <Modal visible={showDocumentPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.33,
              borderBottomColor: '#e5e5ea',
              backgroundColor: '#fff'
            }}>
              <Pressable onPress={() => setShowDocumentPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#666', 
                  fontWeight: '600' 
                }}>
                  Annulla
                </Text>
              </Pressable>
              
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: '#333'
              }}>
                Seleziona Documenti
              </Text>

              <Pressable onPress={() => setShowDocumentPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: '#0a84ff', 
                  fontWeight: '600' 
                }}>
                  Fatto
                </Text>
              </Pressable>
            </View>

            {/* Barra di ricerca */}
            <View style={{ padding: 16 }}>
              <TextInput
                value={documentSearchText}
                onChangeText={setDocumentSearchText}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: '#333'
                }}
                placeholder="Cerca documenti..."
              />
            </View>

            {/* Lista documenti */}
            {loadingDocuments ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#0a84ff" />
                <Text style={{ marginTop: 16, color: '#666' }}>Caricamento documenti...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredDocuments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isSelected = selectedDocuments.find(d => d.id === item.id);
                  return (
                    <Pressable
                      onPress={() => handleDocumentSelection(item)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: isSelected ? '#0a84ff15' : 'transparent'
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: isSelected ? '#0a84ff' : '#e5e5ea',
                        backgroundColor: isSelected ? '#0a84ff' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12
                      }}>
                        {isSelected && (
                          <MaterialCommunityIcons name="check" size={12} color="#fff" />
                        )}
                      </View>
                      <MaterialCommunityIcons 
                        name="text-box" 
                        size={20} 
                        color="#0a84ff" 
                      />
                      <Text style={{
                        fontSize: 16,
                        color: '#333',
                        marginLeft: 12,
                        flex: 1
                      }}>
                        {item.title}
                      </Text>
                    </Pressable>
                  );
                }}
              />
            )}
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
    </>
  );
} 