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
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetSearch, setAssetSearch] = useState('');
  const [showAssetPicker, setShowAssetPicker] = useState(false);
  
  // Stati per la scadenza associata
  const [createDeadline, setCreateDeadline] = useState(false);
  const [deadlineTitle, setDeadlineTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(new Date());
  const [deadlineNotes, setDeadlineNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedRecurrence, setSelectedRecurrence] = useState<keyof typeof RECURRENCE_TEMPLATES>('monthly');
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  // Filtra beni in base alla ricerca
  const filteredAssets = assets.filter(asset => 
    asset.name.toLowerCase().includes(assetSearch.toLowerCase()) ||
    (asset.identifier && asset.identifier.toLowerCase().includes(assetSearch.toLowerCase()))
  );

  // Funzioni per gestione file
  function handleFileSelection() {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Annulla', 'Scatta foto', 'Galleria', 'Documenti'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            await takeSinglePhoto();
          } else if (buttonIndex === 2) {
            await selectFromGallery();
          } else if (buttonIndex === 3) {
            await selectDocuments();
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
          { text: 'Scatta foto', onPress: () => takeSinglePhoto() },
          { text: 'Galleria', onPress: () => selectFromGallery() },
          { text: 'Documenti', onPress: () => selectDocuments() }
        ]
      );
    }
  }

  async function takeSinglePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permesso richiesto', 'È necessario il permesso della fotocamera per scattare foto.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
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

  async function selectFromGallery() {
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

  async function selectDocuments() {
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

  // Funzioni per gestione associazioni
  function handleAssetSelection(asset: Asset) {
    if (!selectedAssets.find(a => a.id === asset.id)) {
      setSelectedAssets(prev => [...prev, asset]);
    }
    setShowAssetPicker(false);
  }

  function removeAsset(assetId: string) {
    setSelectedAssets(prev => prev.filter(asset => asset.id !== assetId));
  }

  function reset() {
    setTitle('');
    setTags('');
    setSelectedFiles([]);
    setPreviewUrls([]);
    setSelectedAssets([]);
    setAssetSearch('');
    setShowAssetPicker(false);
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

    if (createDeadline && !deadlineTitle.trim()) {
      return Alert.alert('Errore', 'Il titolo della scadenza è richiesto');
    }

    // Mostra immediatamente il feedback di caricamento
    setIsCreating(true);

    const associatedDeadline = createDeadline ? {
      title: deadlineTitle.trim(),
      dueAt: deadlineDate.toISOString(),
      notes: deadlineNotes.trim() || undefined,
      isRecurring,
      recurrenceRule: isRecurring ? RECURRENCE_TEMPLATES[selectedRecurrence].rule : undefined
    } : undefined;

    const result = {
      title: title.trim(),
      tags: tags.trim() || undefined,
      assetIds: selectedAssets.map(asset => asset.id),
      storagePath: undefined, // Gestito dal backend
      fileInfo: selectedFiles.length === 1 ? selectedFiles[0] : undefined,
      filesInfo: selectedFiles.length > 1 ? selectedFiles : undefined,
      associatedDeadline
    };

    onSubmit(result);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleDateChange(event: any, selectedDate?: Date) {
    setShowDatePicker(false);
    if (selectedDate) {
      setDeadlineDate(selectedDate);
    }
  }

  const recurrenceKeys = Object.keys(RECURRENCE_TEMPLATES) as (keyof typeof RECURRENCE_TEMPLATES)[];

  return (
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
          <Pressable onPress={handleClose}>
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
            Aggiungi Documento
          </Text>

          <Pressable
            onPress={handleSave}
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

            {/* Tag */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Tag
              </Text>
              <TextInput
                value={tags}
                onChangeText={setTags}
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

            {/* File Upload */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                File
              </Text>
              <Pressable
                onPress={handleFileSelection}
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
                  {selectedFiles.length > 0 ? `${selectedFiles.length} file selezionati` : 'Aggiungi file'}
                </Text>
                <Ionicons name="add" size={20} color={Colors.light.tint} />
              </Pressable>

              {/* Preview dei file selezionati */}
              {selectedFiles.length > 0 && (
                <View style={{ 
                  flexDirection: 'row', 
                  flexWrap: 'wrap', 
                  gap: 8, 
                  marginTop: 12 
                }}>
                  {selectedFiles.map((file, index) => (
                    <View key={index} style={{
                      width: 80,
                      height: 80,
                      borderRadius: 8,
                      backgroundColor: Colors.light.background,
                      position: 'relative',
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: Colors.light.border
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
                        />
                      ) : file.type === 'application/pdf' ? (
                        <View style={{
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: Colors.light.background
                        }}>
                          <Ionicons name="document-text" size={24} color={Colors.light.textSecondary} />
                        </View>
                      ) : (
                        <View style={{
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: Colors.light.background
                        }}>
                          <Ionicons name="document" size={24} color={Colors.light.textSecondary} />
                        </View>
                      )}
                      
                      {/* Pulsante elimina */}
                      <Pressable 
                        onPress={() => {
                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                          setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                        }}
                        style={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: 'rgba(255, 59, 48, 0.9)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="close" size={12} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}
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
                        <Ionicons 
                          name={
                            asset.type === 'vehicle' ? 'car' : 
                            asset.type === 'property' || asset.type === 'home' ? 'home' : 
                            asset.type === 'animal' ? 'paw' :
                            asset.type === 'person' ? 'person' :
                            asset.type === 'device' ? 'phone-portrait' :
                            asset.type === 'subscription' ? 'card' :
                            'cube'
                          } 
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
                        <Ionicons name="close" size={16} color={Colors.light.textSecondary} />
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
                <Ionicons name="add" size={20} color={Colors.light.tint} />
              </Pressable>
            </View>

            {/* Scadenza Associata */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: Colors.light.text,
                marginBottom: 12,
                marginLeft: 4
              }}>
                Scadenza Associata
              </Text>
              
              {/* Scadenza selezionata */}
              {createDeadline && (
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
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 8,
                    borderBottomWidth: 0.33,
                    borderBottomColor: Colors.light.border
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Ionicons name="calendar" size={20} color={Colors.light.tint} />
                      <Text style={{
                        fontSize: 16,
                        color: Colors.light.text,
                        marginLeft: 12,
                        flex: 1
                      }}>
                        {deadlineTitle || 'Nuova scadenza'}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setCreateDeadline(false)}
                      style={{
                        padding: 4
                      }}
                    >
                      <Ionicons name="close" size={16} color={Colors.light.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              )}

              {/* Pulsante per aggiungere scadenza */}
              <Pressable
                onPress={() => setCreateDeadline(true)}
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
                  {createDeadline ? 'Modifica scadenza' : 'Crea scadenza associata'}
                </Text>
                <Ionicons name="add" size={20} color={Colors.light.tint} />
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Modal per creazione scadenza associata */}
        <Modal visible={createDeadline} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
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
              <Pressable onPress={() => setCreateDeadline(false)}>
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
                Crea Scadenza
              </Text>

              <Pressable onPress={() => setCreateDeadline(false)}>
                <Text style={{ 
                  fontSize: 16, 
                  color: Colors.light.tint, 
                  fontWeight: '600' 
                }}>
                  Fatto
                </Text>
              </Pressable>
            </View>

            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              showsVerticalScrollIndicator={false}
            >
              <View style={{ gap: 12 }}>
                {/* Titolo Scadenza */}
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
                    value={deadlineTitle}
                    onChangeText={setDeadlineTitle}
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
                      {deadlineDate.toLocaleDateString('it-IT')}
                    </Text>
                    <Ionicons name="calendar" size={20} color={Colors.light.tint} />
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
                    value={deadlineNotes}
                    onChangeText={setDeadlineNotes}
                    multiline
                    numberOfLines={3}
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
                      elevation: 1,
                      textAlignVertical: 'top'
                    }}
                  />
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
                    <Switch
                      value={isRecurring}
                      onValueChange={setIsRecurring}
                      trackColor={{ false: Colors.light.border, true: Colors.light.tint }}
                      thumbColor="#fff"
                    />
                  </View>

                  {isRecurring && (
                    <View style={{ gap: 8 }}>
                      {recurrenceKeys.map((key) => (
                        <Pressable
                          key={key}
                          onPress={() => setSelectedRecurrence(key)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 6,
                            backgroundColor: selectedRecurrence === key ? Colors.light.tint + '15' : 'transparent'
                          }}
                        >
                          <View style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            borderWidth: 2,
                            borderColor: selectedRecurrence === key ? Colors.light.tint : Colors.light.border,
                            backgroundColor: selectedRecurrence === key ? Colors.light.tint : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8
                          }}>
                            {selectedRecurrence === key && (
                              <Ionicons name="checkmark" size={10} color="#fff" />
                            )}
                          </View>
                          <Text style={{
                            fontSize: 14,
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
          </SafeAreaView>
        </Modal>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={deadlineDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}

        {/* Modal per selezione beni */}
        <Modal visible={showAssetPicker} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
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
                Seleziona Bene
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

            <View style={{ padding: 16 }}>
              <TextInput
                value={assetSearch}
                onChangeText={setAssetSearch}
                placeholder="Cerca beni..."
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

            <FlatList
              data={filteredAssets}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleAssetSelection(item)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 0.33,
                    borderBottomColor: Colors.light.border
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: Colors.light.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Ionicons name={
                      item.type === 'vehicle' ? 'car' : 
                      item.type === 'property' || item.type === 'home' ? 'home' : 
                      item.type === 'animal' ? 'paw' :
                      item.type === 'person' ? 'person' :
                      item.type === 'device' ? 'phone-portrait' :
                      item.type === 'subscription' ? 'card' :
                      'cube'
                    } size={20} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.light.text }}>
                      {item.name}
                    </Text>
                    {item.identifier && (
                      <Text style={{ fontSize: 14, color: Colors.light.textSecondary }}>
                        {item.identifier}
                      </Text>
                    )}
                  </View>
                </Pressable>
              )}
              ListEmptyComponent={() => (
                <View style={{ padding: 32, alignItems: 'center' }}>
                  <Text style={{ color: Colors.light.textSecondary, textAlign: 'center' }}>
                    {assetSearch ? 'Nessun bene trovato' : 'Nessun bene disponibile'}
                  </Text>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>

        {/* Modal di loading */}
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
              backgroundColor: Colors.light.cardBackground,
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
                borderColor: Colors.light.border,
                borderTopColor: Colors.light.tint,
                borderRadius: 20,
                marginBottom: 16
              }} />
              <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: Colors.light.text,
                marginBottom: 8,
                textAlign: 'center'
              }}>
                Stiamo creando il documento...
              </Text>
              <Text style={{
                fontSize: 14,
                color: Colors.light.textSecondary,
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