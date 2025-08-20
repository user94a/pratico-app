import { Colors } from '@/constants/Colors';
import { RECURRENCE_TEMPLATES, getAssets, getDocuments } from '@/lib/api';
import { Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuickCreateDocumentModal } from './QuickCreateDocumentModal';

type Asset = {
  id: string;
  name: string;
  type: 'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other';
  identifier: string | null;
};

export function AddDeadlineModal({ visible, onClose, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { 
    title: string; 
    dueAt: string; 
    notes?: string; 
    assetId?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
    newAsset?: {
      name: string;
      type: 'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other';
      identifier?: string;
    };
    associatedDocument?: {
      title: string;
      tags?: string;
    } | { existingDocumentId: string };
  }) => void;
}) {
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<keyof typeof RECURRENCE_TEMPLATES>('monthly');
  
  // Gestione beni
  const [hasAsset, setHasAsset] = useState(false);
  const [assetType, setAssetType] = useState<'existing' | 'new'>('new');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other'>('vehicles');
  const [newAssetIdentifier, setNewAssetIdentifier] = useState('');

  // Stati per la gestione documenti
  const [hasDocument, setHasDocument] = useState(false);
  const [documentType, setDocumentType] = useState<'existing' | 'new'>('new');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentPicker, setShowDocumentPicker] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentTags, setNewDocumentTags] = useState('');
  const [newDocumentNotes, setNewDocumentNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Stati per le modali di creazione rapida

  const [showQuickCreateDocument, setShowQuickCreateDocument] = useState(false);

  async function loadAssets() {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (error) {
      console.error('Errore caricamento beni:', error);
    }
  }

  async function loadDocuments() {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (error) {
      console.error('Errore caricamento documenti:', error);
    }
  }

  // Funzioni per la creazione rapida
  function handleAssetCreated(newAsset: Asset) {
    // Aggiorna la lista degli asset
    setAssets(prev => [...prev, newAsset]);
    // Seleziona automaticamente l'asset appena creato
    setSelectedAsset(newAsset);
    setAssetType('existing');
    // Chiude la modale di creazione rapida

  }

  function handleAssetCreationCancelled() {
    // Chiude la modale di creazione rapida senza creare

    // Se non c'è nulla selezionato, disattiva lo switch
    if (!selectedAsset) {
      setHasAsset(false);
    }
  }

  function handleDocumentCreated(newDocument: Document) {
    // Aggiorna la lista dei documenti
    setDocuments(prev => [...prev, newDocument]);
    // Seleziona automaticamente il documento appena creato
    setSelectedDocument(newDocument);
    setDocumentType('existing');
    // Chiude la modale di creazione rapida
    setShowQuickCreateDocument(false);
  }

  function handleDocumentCreationCancelled() {
    // Chiude la modale di creazione rapida senza creare
    setShowQuickCreateDocument(false);
    // Se non c'è nulla selezionato, disattiva lo switch
    if (!selectedDocument) {
      setHasDocument(false);
    }
  }

  useFocusEffect(useCallback(() => {
    if (visible) {
      loadAssets();
      loadDocuments();
    }
  }, [visible]));

  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    (asset.identifier && asset.identifier.toLowerCase().includes(assetSearch.toLowerCase()))
  );

  const filteredDocuments = documents.filter(doc =>
    doc.title.toLowerCase().includes(documentSearch.toLowerCase()) ||
    (doc.tags && doc.tags.some((tag: string) => tag.toLowerCase().includes(documentSearch.toLowerCase())))
  );

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  }

  function handleSave() {
    if (!title.trim()) return Alert.alert('Errore', 'Il titolo è richiesto');

    if (hasAsset && assetType === 'new' && !newAssetName.trim()) {
      return Alert.alert('Errore', 'Il nome del nuovo bene è richiesto');
    }

    if (hasDocument && documentType === 'new' && !newDocumentTitle.trim()) {
      return Alert.alert('Errore', 'Il titolo del nuovo documento è richiesto');
    }

    let associatedDocument;
    if (hasDocument) {
      if (documentType === 'existing' && selectedDocument) {
        associatedDocument = { existingDocumentId: selectedDocument.id };
      } else if (documentType === 'new') {
        associatedDocument = {
          title: newDocumentTitle.trim(),
          tags: newDocumentTags.trim() || undefined
        };
      }
    }

    let newAsset;
    if (hasAsset && assetType === 'new') {
      newAsset = {
        name: newAssetName.trim(),
        type: newAssetType,
        identifier: newAssetIdentifier.trim() || undefined
      };
    }

    const isoDate = dueDate.toISOString().split('T')[0];

    onSubmit({ 
      title: title.trim(), 
      dueAt: isoDate, 
      notes: notes.trim() || undefined,
      assetId: hasAsset && assetType === 'existing' ? selectedAsset?.id : undefined,
      newAsset,
      isRecurring,
      recurrenceRule: isRecurring ? RECURRENCE_TEMPLATES[selectedRecurrence].rule : undefined,
      associatedDocument
    });

    // Reset form
    setTitle('');
    setDueDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setSelectedRecurrence('monthly');
    setAssetSearch('');
    setHasAsset(false);
    setAssetType('new');
    setSelectedAsset(null);
    setNewAssetName('');
    setNewAssetType('vehicles');
    setNewAssetIdentifier('');
    setShowAssetPicker(false);
    setHasDocument(false);
    setDocumentType('new');
    setSelectedDocument(null);
    setDocumentSearch('');
    setNewDocumentTitle('');
    setNewDocumentTags('');
    setNewDocumentNotes('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowDocumentPicker(false);
  }

  function handleClose() {
    setTitle('');
    setDueDate(new Date());
    setNotes('');
    setIsRecurring(false);
    setSelectedRecurrence('monthly');
    setAssetSearch('');
    setHasAsset(false);
    setAssetType('new');
    setSelectedAsset(null);
    setNewAssetName('');
    setNewAssetType('vehicles');
    setNewAssetIdentifier('');
    setShowAssetPicker(false);
    setHasDocument(false);
    setDocumentType('new');
    setSelectedDocument(null);
    setDocumentSearch('');
    setNewDocumentTitle('');
    setNewDocumentTags('');
    setNewDocumentNotes('');
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowDocumentPicker(false);
    onClose();
  }

  const recurrenceKeys = Object.keys(RECURRENCE_TEMPLATES) as (keyof typeof RECURRENCE_TEMPLATES)[];

  function handleFileSelection() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annulla', 'Scatta foto', 'Galleria', 'Documenti'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Scatta foto
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setSelectedFile({ 
                uri: asset.uri, 
                name: asset.fileName || 'photo.jpg', 
                type: asset.type || 'image/jpeg' 
              });
              setPreviewUrl(asset.uri);
            }
          } else if (buttonIndex === 2) {
            // Galleria
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setSelectedFile({ 
                uri: asset.uri, 
                name: asset.fileName || 'image.jpg', 
                type: asset.type || 'image/jpeg' 
              });
              setPreviewUrl(asset.uri);
            }
          } else if (buttonIndex === 3) {
            // Documenti
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setSelectedFile({ 
                uri: asset.uri, 
                name: asset.name, 
                type: asset.mimeType || 'application/pdf' 
              });
              if (asset.mimeType?.startsWith('image/')) {
                setPreviewUrl(asset.uri);
              }
            }
          }
        }
      );
    } else {
      // Android - mostra ImagePicker direttamente
      Alert.alert(
        'Seleziona file',
        'Scegli da dove importare il file',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Galleria', onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.All,
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setSelectedFile({ 
                uri: asset.uri, 
                name: asset.fileName || 'file', 
                type: asset.type || 'image/jpeg' 
              });
              if (asset.type?.startsWith('image/')) {
                setPreviewUrl(asset.uri);
              }
            }
          }},
          { text: 'Documenti', onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              setSelectedFile({ 
                uri: asset.uri, 
                name: asset.name, 
                type: asset.mimeType || 'application/pdf' 
              });
              if (asset.mimeType?.startsWith('image/')) {
                setPreviewUrl(asset.uri);
              }
            }
          }}
        ]
      );
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 24 }}>
              Aggiungi scadenza
            </Text>

            <View style={{ gap: 16, flex: 1 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Titolo scadenza
                </Text>
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
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Data scadenza
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
                  <Text style={{ fontSize: 16 }}>{dueDate.toLocaleDateString('it-IT')}</Text>
                  <Ionicons name="calendar" size={20} color="#0a84ff" />
                </Pressable>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={dueDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  themeVariant="light"
                  style={Platform.OS === 'ios' ? { backgroundColor: '#ffffff' } : undefined}
                />
              )}

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Note
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  Aggiungi note o dettagli (opzionale)
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
                    borderWidth: 0,
                    textAlignVertical: 'top'
                  }}
                />
              </View>

              {/* 1. SCADENZA RICORRENTE */}
              <View style={{
                borderWidth: 1,
                borderColor: '#d1d1d6',
                borderRadius: 12,
                padding: 16,
                backgroundColor: '#fff'
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: isRecurring ? 16 : 0
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>
                    Scadenza ricorrente
                  </Text>
                  <Switch
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    trackColor={{ false: '#e5e5ea', true: '#34c759' }}
                    thumbColor="#fff"
                  />
                </View>

                {isRecurring && (
                  <View>
                    <Text style={{ fontSize: 14, marginBottom: 12, color: '#666', fontWeight: '600' }}>
                      Frequenza ricorrenza:
                    </Text>
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
                                setSelectedRecurrence(keys[buttonIndex - 1]);
                              }
                            }
                          );
                        }
                      }}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        backgroundColor: '#fff',
                        borderWidth: 1,
                        borderColor: '#e5e5ea',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Text style={{ color: '#000', fontWeight: '400' }}>
                        {RECURRENCE_TEMPLATES[selectedRecurrence].label}
                      </Text>
                      <Ionicons name="chevron-down-outline" size={20} color="#666" />
                    </Pressable>
                  </View>
                )}
              </View>

              {/* 2. BENE ASSOCIATO */}
              <View style={{
                borderWidth: 1,
                borderColor: '#d1d1d6',
                borderRadius: 12,
                padding: 16,
                backgroundColor: '#fff'
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#333' }}>
                    Bene associato
                  </Text>
                  <Switch
                    value={hasAsset}
                    onValueChange={(value) => {
                      setHasAsset(value);
                      if (value) {
                        // Apri automaticamente il picker quando si attiva lo switch
                        setAssetType('existing');
                        setShowAssetPicker(true);
                      }
                    }}
                    trackColor={{ false: '#e5e5ea', true: '#34c759' }}
                    thumbColor="#fff"
                  />
                </View>

                {hasAsset && (
                  <View style={{ gap: 16 }}>
                    {selectedAsset ? (
                      // Mostra solo l'asset selezionato
                      <View>
                        <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                          Bene collegato:
                        </Text>
                        <View style={{
                          borderWidth: 1,
                          borderColor: '#0a84ff',
                          borderRadius: 8,
                          padding: 12,
                          backgroundColor: '#e8f4ff',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '600' }}>{selectedAsset.name}</Text>
                            {selectedAsset.identifier && (
                              <Text style={{ fontSize: 12, color: '#666' }}>
                                {selectedAsset.identifier}
                              </Text>
                            )}
                          </View>
                          <Pressable onPress={() => {
                            setSelectedAsset(null);
                            setShowAssetPicker(true);
                          }} style={{ padding: 4 }}>
                            <Ionicons name="pencil" size={16} color="#0a84ff" />
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      // Mostra i toggle solo se non c'è nulla selezionato
                      <>
                        {/* Toggle esistente/nuovo */}
                        <View>
                          <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                            Tipo bene:
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Pressable
                              onPress={() => setAssetType('new')}
                              style={{
                                flex: 1,
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: assetType === 'new' ? '#0a84ff' : '#fff',
                                borderWidth: 1,
                                borderColor: assetType === 'new' ? '#0a84ff' : '#e5e5ea'
                              }}
                            >
                              <Text style={{
                                color: assetType === 'new' ? '#fff' : '#000',
                                fontWeight: assetType === 'new' ? '600' : '400',
                                textAlign: 'center'
                              }}>
                                Nuovo
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => setAssetType('existing')}
                              style={{
                                flex: 1,
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: assetType === 'existing' ? '#0a84ff' : '#fff',
                                borderWidth: 1,
                                borderColor: assetType === 'existing' ? '#0a84ff' : '#e5e5ea'
                              }}
                            >
                              <Text style={{
                                color: assetType === 'existing' ? '#fff' : '#000',
                                fontWeight: assetType === 'existing' ? '600' : '400',
                                textAlign: 'center'
                              }}>
                                Esistente
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        {assetType === 'existing' && (
                          <View>
                            <Pressable
                              onPress={() => setShowAssetPicker(true)}
                              style={{
                                borderWidth: 1,
                                borderColor: '#e5e5ea',
                                borderRadius: 8,
                                padding: 12,
                                backgroundColor: '#fff',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Text style={{ color: '#666' }}>Seleziona bene...</Text>
                              <Ionicons name="chevron-down" size={20} color="#666" />
                            </Pressable>
                          </View>
                        )}

                        {assetType === 'new' && (
                          <View style={{ gap: 12 }}>
                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                Tipo bene:
                              </Text>
                              <View style={{ flexDirection: 'row', gap: 8 }}>
                                <Pressable
                                  onPress={() => setNewAssetType('vehicles')}
                                  style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: newAssetType === 'vehicles' ? '#0a84ff' : '#fff',
                                    borderWidth: 1,
                                    borderColor: newAssetType === 'vehicles' ? '#0a84ff' : '#e5e5ea',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Ionicons 
                                    name="car" 
                                    size={20} 
                                    color={newAssetType === 'vehicles' ? '#fff' : '#000'} 
                                  />
                                  <Text style={{
                                    color: newAssetType === 'vehicles' ? '#fff' : '#000',
                                    fontSize: 12,
                                    marginTop: 4
                                  }}>
                                    Auto
                                  </Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => setNewAssetType('properties')}
                                  style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: newAssetType === 'properties' ? '#0a84ff' : '#fff',
                                    borderWidth: 1,
                                    borderColor: newAssetType === 'properties' ? '#0a84ff' : '#e5e5ea',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Ionicons 
                                    name="home" 
                                    size={20} 
                                    color={newAssetType === 'properties' ? '#fff' : '#000'} 
                                  />
                                  <Text style={{
                                    color: newAssetType === 'properties' ? '#fff' : '#000',
                                    fontSize: 12,
                                    marginTop: 4
                                  }}>
                                    Casa
                                  </Text>
                                </Pressable>

                                <Pressable
                                  onPress={() => setNewAssetType('animals')}
                                  style={{
                                    flex: 1,
                                    padding: 10,
                                    borderRadius: 8,
                                    backgroundColor: newAssetType === 'animals' ? '#0a84ff' : '#fff',
                                    borderWidth: 1,
                                    borderColor: newAssetType === 'animals' ? '#0a84ff' : '#e5e5ea',
                                    alignItems: 'center'
                                  }}
                                >
                                  <Ionicons 
                                    name="paw" 
                                    size={20} 
                                    color={newAssetType === 'animals' ? '#fff' : '#000'} 
                                  />
                                  <Text style={{
                                    color: newAssetType === 'animals' ? '#fff' : '#000',
                                    fontSize: 12,
                                    marginTop: 4
                                  }}>
                                    Animale
                                  </Text>
                                </Pressable>
                              </View>
                            </View>

                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                Nome bene:
                              </Text>
                              <TextInput
                                value={newAssetName}
                                onChangeText={setNewAssetName}
                                style={{
                                  backgroundColor: '#f2f2f7',
                                  borderRadius: 8,
                                  padding: 12,
                                  fontSize: 16,
                                  borderWidth: 0
                                }}
                              />
                            </View>

                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                Identificativo
                              </Text>
                              <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                {newAssetType === 'vehicles' ? 'Targa (es: AB123CD)' : newAssetType === 'properties' ? 'Indirizzo' : newAssetType === 'animals' ? 'Codice o identificativo' : ''} (opzionale)
                              </Text>
                              <TextInput
                                value={newAssetIdentifier}
                                onChangeText={setNewAssetIdentifier}
                                style={{
                                  backgroundColor: '#f2f2f7',
                                  borderRadius: 8,
                                  padding: 12,
                                  fontSize: 16,
                                  borderWidth: 0
                                }}
                              />
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* 3. DOCUMENTO ASSOCIATO */}
              <View style={{
                borderWidth: 1,
                borderColor: '#d1d1d6',
                borderRadius: 12,
                padding: 16,
                backgroundColor: '#fff'
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: hasDocument ? 16 : 0
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>
                    Documento associato
                  </Text>
                  <Switch
                    value={hasDocument}
                    onValueChange={(value) => {
                      setHasDocument(value);
                      if (value) {
                        // Apri automaticamente il picker quando si attiva lo switch
                        setDocumentType('existing');
                        setShowDocumentPicker(true);
                      }
                    }}
                    trackColor={{ false: '#e5e5ea', true: '#34c759' }}
                    thumbColor="#fff"
                  />
                </View>

                {hasDocument && (
                  <View style={{ gap: 16 }}>
                    {selectedDocument ? (
                      // Mostra solo il documento selezionato
                      <View>
                        <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                          Documento collegato:
                        </Text>
                        <View style={{
                          borderWidth: 1,
                          borderColor: '#0a84ff',
                          borderRadius: 8,
                          padding: 12,
                          backgroundColor: '#e8f4ff',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '600' }}>{selectedDocument.title}</Text>
                            {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                              <Text style={{ fontSize: 12, color: '#666' }}>
                                {selectedDocument.tags.join(', ')}
                              </Text>
                            )}
                          </View>
                          <Pressable onPress={() => {
                            setSelectedDocument(null);
                            setShowDocumentPicker(true);
                          }} style={{ padding: 4 }}>
                            <Ionicons name="pencil" size={16} color="#0a84ff" />
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      // Mostra i toggle solo se non c'è nulla selezionato
                      <>
                        {/* Toggle esistente/nuovo */}
                        <View>
                          <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                            Tipo documento:
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 8 }}>
                            <Pressable
                              onPress={() => setDocumentType('new')}
                              style={{
                                flex: 1,
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: documentType === 'new' ? '#0a84ff' : '#fff',
                                borderWidth: 1,
                                borderColor: documentType === 'new' ? '#0a84ff' : '#e5e5ea'
                              }}
                            >
                              <Text style={{
                                color: documentType === 'new' ? '#fff' : '#000',
                                fontWeight: documentType === 'new' ? '600' : '400',
                                textAlign: 'center'
                              }}>
                                Nuovo
                              </Text>
                            </Pressable>

                            <Pressable
                              onPress={() => setDocumentType('existing')}
                              style={{
                                flex: 1,
                                padding: 12,
                                borderRadius: 8,
                                backgroundColor: documentType === 'existing' ? '#0a84ff' : '#fff',
                                borderWidth: 1,
                                borderColor: documentType === 'existing' ? '#0a84ff' : '#e5e5ea'
                              }}
                            >
                              <Text style={{
                                color: documentType === 'existing' ? '#fff' : '#000',
                                fontWeight: documentType === 'existing' ? '600' : '400',
                                textAlign: 'center'
                              }}>
                                Esistente
                              </Text>
                            </Pressable>
                          </View>
                        </View>

                        {documentType === 'existing' && (
                          <View>
                            <Pressable
                              onPress={() => setShowDocumentPicker(true)}
                              style={{
                                borderWidth: 1,
                                borderColor: '#e5e5ea',
                                borderRadius: 8,
                                padding: 12,
                                backgroundColor: '#fff',
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                              }}
                            >
                              <Text style={{ color: '#666' }}>Seleziona documento...</Text>
                              <Ionicons name="chevron-down" size={20} color="#666" />
                            </Pressable>
                          </View>
                        )}

                        {documentType === 'new' && (
                          <View style={{ gap: 12 }}>
                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                Titolo documento:
                              </Text>
                              <TextInput
                                value={newDocumentTitle}
                                onChangeText={setNewDocumentTitle}
                                style={{
                                  backgroundColor: '#f2f2f7',
                                  borderRadius: 8,
                                  padding: 12,
                                  fontSize: 16,
                                  borderWidth: 0
                                }}
                              />
                            </View>

                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                Tag
                              </Text>
                              <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                Tag separati da virgola (opzionale)
                              </Text>
                              <TextInput
                                value={newDocumentTags}
                                onChangeText={setNewDocumentTags}
                                style={{
                                  backgroundColor: '#f2f2f7',
                                  borderRadius: 8,
                                  padding: 12,
                                  fontSize: 16,
                                  borderWidth: 0
                                }}
                              />
                            </View>

                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                Note
                              </Text>
                              <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                Aggiungi note o dettagli (opzionale)
                              </Text>
          <TextInput
                                value={newDocumentNotes}
                                onChangeText={setNewDocumentNotes}
                                multiline
                                numberOfLines={2}
                                style={{
                                  backgroundColor: '#f2f2f7',
                                  borderRadius: 8,
                                  padding: 12,
                                  height: 60,
                                  fontSize: 16,
                                  borderWidth: 0,
                                  textAlignVertical: 'top'
                                }}
          />
        </View>

                            {/* Upload file */}
                            <View>
                              <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                                File (opzionale):
                              </Text>
                              
                              {selectedFile ? (
                                <View style={{
                                  borderWidth: 1,
                                  borderColor: '#0a84ff',
                                  borderRadius: 8,
                                  padding: 12,
                                  backgroundColor: '#e8f4ff'
                                }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ fontWeight: '600', flex: 1 }}>{selectedFile.name}</Text>
                                    <Pressable onPress={() => { setSelectedFile(null); setPreviewUrl(null); }} style={{ padding: 4 }}>
                                      <Ionicons name="close" size={20} color="#ff3b30" />
                                    </Pressable>
                                  </View>
                                  
                                  {/* Preview */}
                                  {selectedFile.type.startsWith('image/') && previewUrl && (
                                    <Image 
                                      source={{ uri: previewUrl }} 
                                      style={{ 
                                        width: '100%', 
                                        height: 150, 
                                        borderRadius: 8, 
                                        backgroundColor: '#f2f2f7' 
                                      }}
                                      resizeMode="cover"
                                    />
                                  )}
                                  
                                  {selectedFile.type === 'application/pdf' && (
                                    <View style={{
                                      height: 100,
                                      backgroundColor: '#f2f2f7',
                                      borderRadius: 8,
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      <Ionicons name="document-text" size={40} color="#ff3b30" />
                                      <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>PDF</Text>
                                    </View>
                                  )}
                                </View>
                              ) : (
                                <Pressable
                                  onPress={handleFileSelection}
                                  style={{
                                    borderWidth: 1,
                                    borderColor: '#e5e5ea',
                                    borderRadius: 8,
                                    padding: 16,
                                    backgroundColor: '#fff',
                                    alignItems: 'center',
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    gap: 8
                                  }}
                                >
                                  <Ionicons name="camera" size={20} color="#0a84ff" />
                                  <Text style={{ color: '#0a84ff', fontWeight: '600' }}>
                                    Aggiungi file
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 24 }}>
          <Pressable
                onPress={handleClose}
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
            onPress={handleSave}
                style={{ 
                  flex: 1, 
                  padding: 16, 
                  borderRadius: 12,
                  backgroundColor: '#0a84ff',
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>
                  {isRecurring ? 'Crea ricorrente' : 
                   (hasAsset || hasDocument) ? 'Crea con collegamenti' : 'Crea'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal visible={showAssetPicker} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ padding: 16 }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 16 
              }}>
                <Text style={{ fontSize: 20, fontWeight: '700' }}>
                  Seleziona bene
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>

                  <Pressable
                    onPress={() => {
                      setShowAssetPicker(false);
                      // Se non c'è un asset selezionato, disattiva lo switch
                      if (!selectedAsset) {
                        setHasAsset(false);
                      }
                    }}
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

              <TextInput
                value={assetSearch}
                onChangeText={setAssetSearch}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12, 
                  padding: 12,
                  fontSize: 16,
                  borderWidth: 0,
                  marginBottom: 16
                }}
              />
            </View>

            <FlatList
              data={filteredAssets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedAsset(item);
                    setShowAssetPicker(false);
                  }}
                  style={{ 
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e5ea',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: Colors.light.tint,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Ionicons 
                      name={
                        item.type === 'vehicles' ? 'car' : 
                        item.type === 'properties' ? 'home' : 
                        item.type === 'animals' ? 'paw' :
                        item.type === 'people' ? 'person' :
                        item.type === 'devices' ? 'phone-portrait' :
                        item.type === 'subscriptions' ? 'card' :
                        'cube'
                      } 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>
                      {item.name}
                    </Text>
                    {item.identifier && (
                      <Text style={{ fontSize: 14, color: '#666' }}>
                        {item.identifier}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#666', textAlign: 'center' }}>
                    {assetSearch ? 'Nessun bene trovato' : 'Nessun bene disponibile'}
                  </Text>
                </View>
              )}
            />
          </View>
        </Modal>

        <Modal visible={showDocumentPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ padding: 16 }}>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: 16 
              }}>
                <Text style={{ fontSize: 20, fontWeight: '700' }}>
                  Seleziona documento
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      setShowDocumentPicker(false);
                      setShowQuickCreateDocument(true);
                    }}
                    style={{ 
                      width: 36,
                      height: 36,
                      backgroundColor: '#0a84ff',
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Ionicons name="add" size={20} color="#fff" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowDocumentPicker(false);
                      // Se non c'è un documento selezionato, disattiva lo switch
                      if (!selectedDocument) {
                        setHasDocument(false);
                      }
                    }}
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

              <TextInput
                value={documentSearch}
                onChangeText={setDocumentSearch}
                style={{ 
                  backgroundColor: '#f2f2f7',
                  borderRadius: 12, 
                  padding: 12,
                  fontSize: 16,
                  borderWidth: 0,
                  marginBottom: 16
                }}
              />
            </View>

            <FlatList
              data={filteredDocuments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    setSelectedDocument(item);
                    setShowDocumentPicker(false);
                  }}
                  style={{ 
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#e5e5ea',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#f2f2f7',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Ionicons name="document-text" size={20} color="#000" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>
                      {item.title}
                    </Text>
                    {item.tags && item.tags.length > 0 && (
                      <Text style={{ fontSize: 14, color: '#666' }}>
                        {item.tags.join(', ')}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#666', textAlign: 'center' }}>
                    {documentSearch ? 'Nessun documento trovato' : 'Nessun documento disponibile'}
                  </Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Modali di creazione rapida */}


        <QuickCreateDocumentModal
          visible={showQuickCreateDocument}
          onClose={handleDocumentCreationCancelled}
          onDocumentCreated={handleDocumentCreated}
        />
      </SafeAreaView>
    </Modal>
  );
} 