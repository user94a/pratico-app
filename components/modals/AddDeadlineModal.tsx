import { Colors } from '@/constants/Colors';
import { RECURRENCE_TEMPLATES } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Asset, Document } from '@/lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function AddDeadlineModal({ visible, onClose, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { 
    title: string; 
    dueAt: string; 
    notes?: string; 
    isRecurring?: boolean;
    recurrenceRule?: string;
    selectedAssets?: Asset[];
    selectedDocuments?: Document[];
  }) => void;
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

  // Carica beni e documenti disponibili
  useEffect(() => {
    if (visible) {
      loadAvailableAssets();
      loadAvailableDocuments();
    }
  }, [visible]);

  const loadAvailableAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setAvailableAssets(data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei beni:', error);
    }
  };

  const loadAvailableDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('title');
      
      if (error) throw error;
      setAvailableDocuments(data || []);
    } catch (error) {
      console.error('Errore nel caricamento dei documenti:', error);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      Alert.alert('Errore', 'Il titolo è obbligatorio');
      return;
    }

    onSubmit({
      title: title.trim(),
      dueAt: dueDate.toISOString(),
      notes: notes.trim() || undefined,
      isRecurring,
      recurrenceRule: isRecurring ? RECURRENCE_TEMPLATES[selectedRecurrence].rule : undefined,
      selectedAssets: selectedAssets.length > 0 ? selectedAssets : undefined,
      selectedDocuments: selectedDocuments.length > 0 ? selectedDocuments : undefined
    });

    // Reset form
    setTitle('');
    setDueDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setSelectedRecurrence('monthly');
    setSelectedAssets([]);
    setSelectedDocuments([]);
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
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
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
              onPress={handleClose}
            >
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.textSecondary, 
                fontWeight: '600' 
              }}>
                Annulla
              </Text>
            </Pressable>
            
            <Text style={{
              fontSize: 17,
              fontWeight: '600',
              color: Colors.light.text
            }}>
              Aggiungi Scadenza
            </Text>

            <Pressable
              onPress={handleSubmit}
              disabled={!title.trim()}
              style={{ opacity: title.trim() ? 1 : 0.5 }}
            >
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.tint, 
                fontWeight: '600' 
              }}>
                Aggiungi
              </Text>
            </Pressable>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
          <View style={{ gap: 12 }}>
            {/* Titolo */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Titolo *
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 16,
                  color: Colors.light.text,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              />
            </View>

            {/* Data Scadenza */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Data Scadenza *
              </Text>
              <Pressable
                onPress={() => setShowDatePicker(true)}
                style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              >
                <Text style={{ 
                  fontSize: 16,
                  color: Colors.light.text
                }}>
                  {dueDate.toLocaleDateString('it-IT')}
                </Text>
                <MaterialCommunityIcons name="calendar" size={20} color={Colors.light.tint} />
              </Pressable>
            </View>

            {/* Note */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Note
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16, 
                  padding: 16, 
                  height: 80,
                  fontSize: 16,
                  color: Colors.light.text,
                  borderWidth: 0,
                  textAlignVertical: 'top',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              />
            </View>

            {/* Beni Associati */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Beni Associati
              </Text>
              
              {/* Beni selezionati */}
              {selectedAssets.length > 0 && (
                <View style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}>
                  {selectedAssets.map((asset) => (
                    <View key={asset.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: 0.33,
                      borderBottomColor: Colors.light.border
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons 
                          name={asset.custom_icon || 'package'} 
                          size={20} 
                          color={Colors.light.tint} 
                        />
                        <Text style={{
                          fontSize: 16,
                          color: Colors.light.text,
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
                        <MaterialCommunityIcons name="close" size={16} color={Colors.light.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Pulsante per aggiungere beni */}
              <Pressable
                onPress={() => setShowAssetPicker(true)}
                style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              >
                <Text style={{ 
                  fontSize: 16,
                  color: Colors.light.text
                }}>
                  {selectedAssets.length > 0 ? `Aggiungi altri beni (${selectedAssets.length} selezionati)` : 'Aggiungi beni'}
                </Text>
                <MaterialCommunityIcons name="plus" size={20} color={Colors.light.tint} />
              </Pressable>
            </View>

            {/* Documenti Associati */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Documenti Associati
              </Text>
              
              {/* Documenti selezionati */}
              {selectedDocuments.length > 0 && (
                <View style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}>
                  {selectedDocuments.map((document) => (
                    <View key={document.id} style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: 0.33,
                      borderBottomColor: Colors.light.border
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons 
                          name="text-box" 
                          size={20} 
                          color={Colors.light.tint} 
                        />
                        <Text style={{
                          fontSize: 16,
                          color: Colors.light.text,
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
                        <MaterialCommunityIcons name="close" size={16} color={Colors.light.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {/* Pulsante per aggiungere documenti */}
              <Pressable
                onPress={() => setShowDocumentPicker(true)}
                style={{ 
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              >
                <Text style={{ 
                  fontSize: 16,
                  color: Colors.light.text
                }}>
                  {selectedDocuments.length > 0 ? `Aggiungi altri documenti (${selectedDocuments.length} selezionati)` : 'Aggiungi documenti'}
                </Text>
                <MaterialCommunityIcons name="plus" size={20} color={Colors.light.tint} />
              </Pressable>
            </View>

            {/* Scadenza Ricorrente */}
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1
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
                  color: Colors.light.text
                }}>
                  Scadenza ricorrente
                </Text>
                <Pressable
                  onPress={() => setIsRecurring(!isRecurring)}
                  style={{
                    width: 51,
                    height: 31,
                    borderRadius: 15.5,
                    backgroundColor: isRecurring ? Colors.light.tint : Colors.light.border,
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
                <View style={{ gap: 12 }}>
                  <Text style={{ 
                    fontSize: 14, 
                    color: Colors.light.textSecondary,
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
                        backgroundColor: selectedRecurrence === key ? Colors.light.tint + '15' : 'transparent'
                      }}
                    >
                      <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: selectedRecurrence === key ? Colors.light.tint : Colors.light.border,
                        backgroundColor: selectedRecurrence === key ? Colors.light.tint : 'transparent',
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
                        color: Colors.light.text,
                        fontWeight: selectedRecurrence === key ? '600' : '400'
                      }}>
                        {RECURRENCE_TEMPLATES[key].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
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
            backgroundColor: Colors.light.cardBackground,
            borderTopWidth: 0.33,
            borderTopColor: Colors.light.border,
            paddingBottom: 20
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 0.33,
              borderBottomColor: Colors.light.border
            }}>
              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.textSecondary, 
                  fontWeight: '600' 
                }}>
                  Annulla
                </Text>
              </Pressable>
              
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: Colors.light.text
              }}>
                Seleziona Data
              </Text>

              <Pressable onPress={() => setShowDatePicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.tint, 
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
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
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
              <Pressable onPress={() => setShowAssetPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.textSecondary, 
                  fontWeight: '600' 
                }}>
                  Annulla
                </Text>
              </Pressable>
              
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: Colors.light.text
              }}>
                Seleziona Beni
              </Text>

              <Pressable onPress={() => setShowAssetPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.tint, 
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
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 16,
                  color: Colors.light.text,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              />
            </View>

            {/* Lista beni */}
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
                      backgroundColor: isSelected ? Colors.light.tint + '15' : 'transparent'
                    }}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? Colors.light.tint : Colors.light.border,
                      backgroundColor: isSelected ? Colors.light.tint : 'transparent',
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
                      color={Colors.light.tint} 
                    />
                    <Text style={{
                      fontSize: 16,
                      color: Colors.light.text,
                      marginLeft: 12,
                      flex: 1
                    }}>
                      {item.name}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Modal>

        {/* Modal per selezione documenti */}
        <Modal visible={showDocumentPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
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
              <Pressable onPress={() => setShowDocumentPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.textSecondary, 
                  fontWeight: '600' 
                }}>
                  Annulla
                </Text>
              </Pressable>
              
              <Text style={{
                fontSize: 17,
                fontWeight: '600',
                color: Colors.light.text
              }}>
                Seleziona Documenti
              </Text>

              <Pressable onPress={() => setShowDocumentPicker(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.tint, 
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
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  padding: 16,
                  fontSize: 16,
                  color: Colors.light.text,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 1,
                  elevation: 1
                }}
              />
            </View>

            {/* Lista documenti */}
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
                      backgroundColor: isSelected ? Colors.light.tint + '15' : 'transparent'
                    }}
                  >
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor: isSelected ? Colors.light.tint : Colors.light.border,
                      backgroundColor: isSelected ? Colors.light.tint : 'transparent',
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
                      color={Colors.light.tint} 
                    />
                    <Text style={{
                      fontSize: 16,
                      color: Colors.light.text,
                      marginLeft: 12,
                      flex: 1
                    }}>
                      {item.title}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </Modal>
    </>
  );
} 