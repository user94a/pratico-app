import { Colors } from '@/constants/Colors';
import { getAssets, RECURRENCE_TEMPLATES } from '@/lib/api';
import { Asset } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, Image, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuickCreateAssetModal } from './QuickCreateAssetModal';

export interface AddDocumentModalRef {
  resetLoading: () => void;
}

export const AddDocumentModal = React.forwardRef<AddDocumentModalRef, {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { 
    title: string; 
    tags?: string; 
    assetId?: string; 
    storagePath?: string;
    fileInfo?: {
      uri: string;
      name: string;
      type: string;
    };
    filesInfo?: Array<{
      uri: string;
      name: string;
      type: string;
    }>;
    newAsset?: {
      name: string;
      type: 'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other';
      identifier?: string;
    };
    associatedDeadline?: {
      title: string;
      dueAt: string;
      notes?: string;
      isRecurring?: boolean;
      recurrenceRule?: string;
    }
  }) => void;
}>(function AddDocumentModal({ visible, onClose, onSubmit }, ref) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  
  // Stati per upload file - supporto file multipli
  const [selectedFiles, setSelectedFiles] = useState<{ uri: string; name: string; type: string }[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // Stati per la gestione beni
  const [hasAsset, setHasAsset] = useState(false);
  const [assetType, setAssetType] = useState<'existing' | 'new'>('new');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState<'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other'>('vehicles');
  const [newAssetIdentifier, setNewAssetIdentifier] = useState('');
  
  // Stati per la scadenza associata
  const [createDeadline, setCreateDeadline] = useState(false);
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [deadlineNotes, setDeadlineNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<keyof typeof RECURRENCE_TEMPLATES>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Stati per le modali di creazione rapida
  const [showQuickCreateAsset, setShowQuickCreateAsset] = useState(false);

  // Stati per il loading
  const [isCreating, setIsCreating] = useState(false);

  async function loadAssets() {
    try {
      const data = await getAssets();
      setAssets(data);
    } catch (e) {
      Alert.alert('Errore', 'Impossibile caricare i beni');
    }
  }

  useFocusEffect(useCallback(() => { if (visible) loadAssets(); }, [visible]));

  // Reset del loading quando il modal si chiude
  React.useEffect(() => {
    if (!visible) {
      setIsCreating(false);
    }
  }, [visible]);

  // Esponi funzioni al parent tramite ref
  React.useImperativeHandle(ref, () => ({
    resetLoading: () => setIsCreating(false)
  }));

  const filteredAssets = assets.filter(a =>
    a.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    (a.identifier && a.identifier.toLowerCase().includes(assetSearch.toLowerCase()))
  );

  // Funzione per la creazione rapida degli asset
  function handleAssetCreated(newAsset: Asset) {
    // Aggiorna la lista degli asset
    setAssets(prev => [...prev, newAsset]);
    // Seleziona automaticamente l'asset appena creato
    setSelectedAsset(newAsset);
    setAssetType('existing');
    // Chiude la modale di creazione rapida
    setShowQuickCreateAsset(false);
  }

  function handleAssetCreationCancelled() {
    // Chiude la modale di creazione rapida senza creare
    setShowQuickCreateAsset(false);
    // Se non c'è un asset selezionato, disattiva lo switch
    if (!selectedAsset) {
      setHasAsset(false);
    }
  }

  function handleFileSelection() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annulla', 'Scatta foto', 'Scatta più foto', 'Galleria', 'Documenti'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            // Scatta una foto singola
            await takeSinglePhoto();
          } else if (buttonIndex === 2) {
            // Scatta foto multiple
            await takeMultiplePhotos();
          } else if (buttonIndex === 3) {
            // Galleria - supporto foto multiple
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: false, // Rimuove il crop forzato
              quality: 0.8,
              allowsMultipleSelection: true, // Abilita selezione multipla
            });
            if (!result.canceled && result.assets.length > 0) {
              const newFiles = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.fileName || 'image.jpg',
                type: asset.type || 'image/jpeg'
              }));
              const newUrls = result.assets.map(asset => asset.uri);
              setSelectedFiles(prev => [...prev, ...newFiles]);
              setPreviewUrls(prev => [...prev, ...newUrls]);
            }
          } else if (buttonIndex === 4) {
            // Documenti - supporto file multipli
            const result = await DocumentPicker.getDocumentAsync({
              type: ['application/pdf', 'image/*'],
              copyToCacheDirectory: true,
              multiple: true, // Abilita selezione multipla
            });
            if (!result.canceled && result.assets.length > 0) {
              const newFiles = result.assets.map(asset => ({
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType || 'application/pdf'
              }));
              const newUrls = result.assets
                .filter(asset => asset.mimeType?.startsWith('image/'))
                .map(asset => asset.uri);
              setSelectedFiles(prev => [...prev, ...newFiles]);
              setPreviewUrls(prev => [...prev, ...newUrls]);
            }
          }
        }
      );
    } else {
      // Android - mostra scelta diretta
      Alert.alert(
        'Seleziona fonte',
        'Scegli da dove aggiungere i file',
        [
          { text: 'Annulla', style: 'cancel' },
          { 
            text: 'Scatta foto', 
            onPress: () => takeSinglePhoto()
          },
          { 
            text: 'Scatta più foto', 
            onPress: () => takeMultiplePhotos()
          },
          { 
            text: 'Galleria', 
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                allowsMultipleSelection: true,
              });
              if (!result.canceled && result.assets.length > 0) {
                const newFiles = result.assets.map(asset => ({
                  uri: asset.uri,
                  name: asset.fileName || 'image.jpg',
                  type: asset.type || 'image/jpeg'
                }));
                const newUrls = result.assets.map(asset => asset.uri);
                setSelectedFiles(prev => [...prev, ...newFiles]);
                setPreviewUrls(prev => [...prev, ...newUrls]);
              }
            }
          },
          { 
            text: 'Documenti', 
            onPress: async () => {
              const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
                multiple: true,
              });
              if (!result.canceled && result.assets.length > 0) {
                const newFiles = result.assets.map(asset => ({
                  uri: asset.uri,
                  name: asset.name,
                  type: asset.mimeType || 'application/pdf'
                }));
                const newUrls = result.assets
                  .filter(asset => asset.mimeType?.startsWith('image/'))
                  .map(asset => asset.uri);
                setSelectedFiles(prev => [...prev, ...newFiles]);
                setPreviewUrls(prev => [...prev, ...newUrls]);
              }
            }
          }
        ]
      );
    }
  }

  async function takeSinglePhoto() {
    // Richiedi permessi camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', 'È necessario il permesso della fotocamera per scattare foto.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Rimuove il crop forzato
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newFile = { 
        uri: asset.uri, 
        name: asset.fileName || 'photo.jpg', 
        type: asset.type || 'image/jpeg' 
      };
      setSelectedFiles(prev => [...prev, newFile]);
      setPreviewUrls(prev => [...prev, asset.uri]);
    }
  }

  async function takeMultiplePhotos() {
    // Richiedi permessi camera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', 'È necessario il permesso della fotocamera per scattare foto.');
      return;
    }

    let shouldContinue = true;
    while (shouldContinue) {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const newFile = { 
          uri: asset.uri, 
          name: asset.fileName || `photo-${Date.now()}.jpg`, 
          type: asset.type || 'image/jpeg' 
        };
        setSelectedFiles(prev => [...prev, newFile]);
        setPreviewUrls(prev => [...prev, asset.uri]);

        // Chiedi se vuole scattare un'altra foto
        await new Promise<void>((resolve) => {
          Alert.alert(
            'Foto aggiunta!',
            'Vuoi scattare un\'altra foto?',
            [
              { 
                text: 'No, basta così', 
                style: 'cancel',
                onPress: () => {
                  shouldContinue = false;
                  resolve();
                }
              },
              { 
                text: 'Sì, un\'altra foto', 
                onPress: () => resolve()
              }
            ]
          );
        });
      } else {
        shouldContinue = false;
      }
    }
  }

  function reset() {
    setTitle('');
    setTags('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setHasAsset(false);
    setAssetType('new');
    setSelectedAsset(null);
    setAssetSearch('');
    setShowAssetPicker(false);
    setNewAssetName('');
    setNewAssetType('vehicles');
    setNewAssetIdentifier('');
    setCreateDeadline(false);
    setDeadlineTitle('');
    setDeadlineDate(new Date());
    setDeadlineNotes('');
    setIsRecurring(false);
    setSelectedRecurrence('monthly');
    setShowDatePicker(false);
    setIsCreating(false);
  }

  function handleSave() {
    if (!title.trim()) return Alert.alert('Errore', 'Il titolo è richiesto');

    if (hasAsset && assetType === 'new' && !newAssetName.trim()) {
      return Alert.alert('Errore', 'Il nome del nuovo bene è richiesto');
    }

    if (createDeadline && !deadlineTitle.trim()) {
      return Alert.alert('Errore', 'Il titolo della scadenza è richiesto');
    }

    // Mostra immediatamente il feedback di caricamento
    setIsCreating(true);

    const associatedDeadline = createDeadline ? {
      title: deadlineTitle.trim(),
      dueAt: deadlineDate.toISOString().split('T')[0],
      notes: deadlineNotes.trim() || undefined,
      isRecurring,
      recurrenceRule: isRecurring ? RECURRENCE_TEMPLATES[selectedRecurrence].rule : undefined
    } : undefined;

    let newAsset;
    if (hasAsset && assetType === 'new') {
      newAsset = {
        name: newAssetName.trim(),
        type: newAssetType,
        identifier: newAssetIdentifier.trim() || undefined
      };
    }

    // Chiama onSubmit che gestirà la creazione asincrona
    onSubmit({
      title: title.trim(),
      tags: tags.trim() || undefined,
      assetId: hasAsset && assetType === 'existing' ? selectedAsset?.id : undefined,
      newAsset,
      storagePath: undefined,
      filesInfo: selectedFiles.length > 0 ? selectedFiles : undefined,
      associatedDeadline
    });
  }

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDeadlineDate(selectedDate);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 24 }}>Aggiungi documento</Text>

            <View style={{ gap: 16, flex: 1 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Titolo documento
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
                  Tag
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  Aggiungi tag separati da virgola (opzionale)
                </Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
                  style={{ 
                    backgroundColor: '#f2f2f7',
                    borderRadius: 12, 
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 0
                  }}
                />
              </View>

              {/* Sezione upload file */}
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: '#666', fontWeight: '600' }}>
                    File (opzionale):
                  </Text>
                  {selectedFiles.length > 0 && (
                    <Text style={{ fontSize: 12, color: '#0a84ff', fontWeight: '600' }}>
                      {selectedFiles.length} file{selectedFiles.length > 1 ? '' : ''} selezionat{selectedFiles.length > 1 ? 'i' : 'o'}
                    </Text>
                  )}
                </View>
                
                {/* Griglia orizzontale per le preview */}
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  gap: 12, 
                  marginBottom: selectedFiles.length > 0 ? 12 : 0 
                }}>
                  {selectedFiles.map((file, index) => {
                    // Debug: log file info
                    console.log(`File ${index}:`, { 
                      name: file.name, 
                      type: file.type, 
                      hasPreview: !!previewUrls[index],
                      previewUrl: previewUrls[index] 
                    });
                    
                    return (
                      <View key={index} style={{
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        backgroundColor: '#f2f2f7',
                        position: 'relative',
                        overflow: 'hidden',
                        borderWidth: 2,
                        borderColor: '#0a84ff'
                      }}>
                        {/* Preview del file */}
                        {((file.type && file.type.startsWith('image/')) || 
                          file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/)) && 
                          previewUrls[index] ? (
                          <Image 
                            source={{ uri: previewUrls[index] }} 
                            style={{ 
                              width: '100%', 
                              height: '100%',
                            }}
                            resizeMode="cover"
                            onError={(error) => {
                              console.log('Image load error for file:', file.name, error);
                            }}
                            onLoad={() => {
                              console.log('Image loaded successfully:', file.name, previewUrls[index]);
                            }}
                          />
                        ) : file.type === 'application/pdf' ? (
                          <View style={{
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f2f2f7'
                          }}>
                            <Ionicons name="document-text" size={32} color="#666" />
                            <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>PDF</Text>
                          </View>
                        ) : (
                          // Fallback: mostra sempre la preview se abbiamo un URL, anche se il tipo non è riconosciuto
                          previewUrls[index] ? (
                            <Image 
                              source={{ uri: previewUrls[index] }} 
                              style={{ 
                                width: '100%', 
                                height: '100%',
                              }}
                              resizeMode="cover"
                              onError={(error) => {
                                console.log('Fallback image load error for file:', file.name, error);
                              }}
                              onLoad={() => {
                                console.log('Fallback image loaded successfully:', file.name);
                              }}
                            />
                          ) : (
                            <View style={{
                              width: '100%',
                              height: '100%',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f2f2f7'
                            }}>
                              <Ionicons name="document" size={32} color="#666" />
                              <Text style={{ fontSize: 8, color: '#666', marginTop: 2 }}>
                                {file.type || 'FILE'}
                              </Text>
                            </View>
                          )
                        )}
                      
                      {/* Pulsante elimina in alto a destra */}
                      <Pressable 
                        onPress={() => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: 'rgba(255, 59, 48, 0.9)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.2,
                          shadowRadius: 1,
                        }}
                      >
                        <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
                      
                      {/* Nome file in basso (opzionale, solo per debug) */}
                      {false && (
                        <View style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          padding: 2
                        }}>
                          <Text style={{ 
                            fontSize: 8, 
                            color: '#fff', 
                            textAlign: 'center'
                          }} numberOfLines={1}>
                            {file.name}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
                  
                  {/* Pulsante + per aggiungere file - sempre visibile */}
                  <Pressable
                    onPress={handleFileSelection}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: '#0a84ff',
                      borderStyle: 'dashed',
                      backgroundColor: 'rgba(10, 132, 255, 0.05)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Ionicons name="add" size={32} color="#0a84ff" />
                    <Text style={{ 
                      fontSize: 10, 
                      color: '#0a84ff', 
                      fontWeight: '600',
                      marginTop: 4,
                      textAlign: 'center'
                    }}>
                      Aggiungi{'\n'}file
                    </Text>
            </Pressable>
                </View>
          </View>

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
                  marginBottom: hasAsset ? 16 : 0
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>
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
                              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                {[
                                  { key: 'vehicles', icon: 'car', label: 'Veicoli' },
                                  { key: 'properties', icon: 'home', label: 'Immobili' },
                                  { key: 'animals', icon: 'paw', label: 'Animali' },
                                  { key: 'people', icon: 'person', label: 'Persone' },
                                  { key: 'devices', icon: 'phone-portrait', label: 'Dispositivi' },
                                  { key: 'subscriptions', icon: 'card', label: 'Abbonamenti' },
                                  { key: 'other', icon: 'cube', label: 'Altro' }
                                ].map((category) => (
                                  <Pressable
                                    key={category.key}
                                    onPress={() => setNewAssetType(category.key as any)}
                                    style={{
                                      flex: 1,
                                      minWidth: '30%',
                                      padding: 10,
                                      borderRadius: 8,
                                      backgroundColor: newAssetType === category.key ? '#0a84ff' : '#fff',
                                      borderWidth: 1,
                                      borderColor: newAssetType === category.key ? '#0a84ff' : '#e5e5ea',
                                      alignItems: 'center'
                                    }}
                                  >
                                    <Ionicons 
                                      name={category.icon as any} 
                                      size={20} 
                                      color={newAssetType === category.key ? '#fff' : '#000'} 
                                    />
                                    <Text style={{
                                      color: newAssetType === category.key ? '#fff' : '#000',
                                      fontSize: 11,
                                      marginTop: 4,
                                      textAlign: 'center'
                                    }}>
                                      {category.label}
                                    </Text>
                                  </Pressable>
                                ))}
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
                                {newAssetType === 'vehicles' ? 'Targa (es: AB123CD)' : newAssetType === 'properties' ? 'Indirizzo' : newAssetType === 'animals' ? 'Codice o identificativo' : newAssetType === 'people' ? 'Codice fiscale o documento' : newAssetType === 'devices' ? 'Numero di serie o IMEI' : newAssetType === 'subscriptions' ? 'Codice abbonamento' : 'Codice o identificativo'} (opzionale)
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

              {/* Sezione scadenza associata */}
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
                  marginBottom: createDeadline ? 16 : 0
                }}>
                  <Text style={{ fontSize: 16, fontWeight: '600' }}>
                    Crea scadenza associata
                  </Text>
                  <Switch
                    value={createDeadline}
                    onValueChange={setCreateDeadline}
                    trackColor={{ false: '#e5e5ea', true: '#34c759' }}
                    thumbColor="#fff"
                  />
                </View>

                {createDeadline && (
                  <View style={{ gap: 12 }}>
                    <View>
                      <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                        Titolo scadenza:
                      </Text>
                      <TextInput
                        value={deadlineTitle}
                        onChangeText={setDeadlineTitle}
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
                        Data scadenza:
                      </Text>
                      <Pressable
                        onPress={() => setShowDatePicker(true)}
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
                        <Text>{deadlineDate.toLocaleDateString('it-IT')}</Text>
                        <Ionicons name="calendar" size={20} color="#0a84ff" />
                      </Pressable>
                    </View>

                    {showDatePicker && (
                      <DateTimePicker
                        value={deadlineDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                        themeVariant="light"
                        style={Platform.OS === 'ios' ? { backgroundColor: '#ffffff' } : undefined}
                      />
                    )}

                    <View>
                      <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
                        Note scadenza
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                        Note aggiuntive (opzionale)
                      </Text>
                      <TextInput
                        value={deadlineNotes}
                        onChangeText={setDeadlineNotes}
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

                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between', 
                      alignItems: 'center'
                    }}>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '600' }}>
                          Scadenza ricorrente
                        </Text>
                        <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                          Si ripete automaticamente
                        </Text>
                      </View>
                      <Switch
                        value={isRecurring}
                        onValueChange={setIsRecurring}
                        trackColor={{ false: '#e5e5ea', true: '#34c759' }}
                        thumbColor="#fff"
                      />
                    </View>

                    {isRecurring && (
                      <View>
                        <Text style={{ fontSize: 14, marginBottom: 8, color: '#666', fontWeight: '600' }}>
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
                          <Ionicons name="chevron-down" size={20} color="#666" />
          </Pressable>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 24 }}>
              <Pressable 
                onPress={() => { 
                  setIsCreating(false);
                  reset(); 
                  onClose(); 
                }} 
                disabled={isCreating}
                style={{ 
                  flex: 1, 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: isCreating ? '#f8f8f8' : '#f2f2f7', 
                  alignItems: 'center',
                  opacity: isCreating ? 0.5 : 1
                }}
              >
                <Text style={{ fontWeight: '600', color: isCreating ? '#999' : '#000' }}>Annulla</Text>
              </Pressable>
          <Pressable
            onPress={handleSave}
                disabled={isCreating}
                style={{ 
                  flex: 1, 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: isCreating ? '#80a8ff' : '#0a84ff', 
                  alignItems: 'center',
                  opacity: isCreating ? 0.8 : 1
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {isCreating && (
                    <View style={{
                      width: 16,
                      height: 16,
                      borderWidth: 2,
                      borderColor: '#fff',
                      borderTopColor: 'transparent',
                      borderRadius: 8,
                      // Simula un spinner con una rotazione (non animato)
                    }} />
                  )}
                  <Text style={{ color: '#fff', fontWeight: '600' }}>
                    {isCreating ? 'Creazione...' : (hasAsset || createDeadline) ? 'Crea con collegamenti' : 'Crea'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <Modal visible={showAssetPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '700' }}>Seleziona bene</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable
                    onPress={() => {
                      setShowAssetPicker(false);
                      setShowQuickCreateAsset(true);
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
                  onPress={() => { setSelectedAsset(item); setShowAssetPicker(false); }}
                  style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e5ea', flexDirection: 'row', alignItems: 'center', gap: 12 }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.light.tint, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={
                      item.type === 'vehicles' ? 'car' : 
                      item.type === 'properties' ? 'home' : 
                      item.type === 'animals' ? 'paw' :
                      item.type === 'people' ? 'person' :
                      item.type === 'devices' ? 'phone-portrait' :
                      item.type === 'subscriptions' ? 'card' :
                      'cube'
                    } size={20} color={'#fff'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.name}</Text>
                    {item.identifier && <Text style={{ fontSize: 14, color: '#666' }}>{item.identifier}</Text>}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: '#666', textAlign: 'center' }}>{assetSearch ? 'Nessun bene trovato' : 'Nessun bene disponibile'}</Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Modale di creazione rapida asset */}
        <QuickCreateAssetModal
          visible={showQuickCreateAsset}
          onClose={handleAssetCreationCancelled}
          onAssetCreated={handleAssetCreated}
        />

        {/* Modale di loading */}
        <Modal 
          visible={isCreating} 
          transparent={true}
          animationType="fade"
        >
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              minWidth: 200,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8
            }}>
              <View style={{
                width: 40,
                height: 40,
                borderWidth: 3,
                borderColor: '#e5e5ea',
                borderTopColor: '#0a84ff',
                borderRadius: 20,
                marginBottom: 16,
                // In una vera implementazione, questo avrebbe un'animazione di rotazione
              }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: '#000',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Stiamo creando il documento...
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#666',
                textAlign: 'center',
                lineHeight: 20
              }}>
                {selectedFiles.length > 0 
                  ? `Caricamento di ${selectedFiles.length} file in corso...`
                  : 'Operazione in corso...'
                }
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}); 