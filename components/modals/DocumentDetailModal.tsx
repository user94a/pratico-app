import { deleteDocument } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Componente per visualizzare una singola immagine in fullscreen
function ImageViewer({ visible, images, initialIndex, onClose }: {
  visible: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const screenWidth = Dimensions.get('window').width;

  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        {/* Pulsante X posizionato in modo assoluto e sempre cliccabile */}
        <Pressable 
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 60, // Posizione fissa sotto la safe area
            right: 20,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.6)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.3)'
          }}
        >
          <Ionicons name="close" size={20} color="#fff" />
        </Pressable>

        {/* Contatore posizionato in modo assoluto */}
        <View style={{
          position: 'absolute',
          top: 60,
          left: 20,
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.6)',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.3)'
        }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
            {currentIndex + 1} di {images.length}
          </Text>
        </View>

        {/* Galleria a schermo intero */}
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(data, index) => ({
            length: screenWidth,
            offset: screenWidth * index,
            index,
          })}
          onMomentumScrollEnd={(event) => {
            const newIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
            setCurrentIndex(newIndex);
          }}
          renderItem={({ item }) => (
            <View style={{ width: screenWidth, height: '100%', justifyContent: 'center' }}>
              <Image
                source={{ uri: item }}
                style={{ width: '100%', height: '70%' }}
                resizeMode="contain"
              />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        {/* Indicatori */}
        {images.length > 1 && (
          <View style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }}>
            {images.map((_, index) => (
              <View
                key={index}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)'
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

export function DocumentDetailModal({ visible, onClose, document, onAssetPress, onDeadlinePress, onDelete }: {
  visible: boolean;
  onClose: () => void;
  document: Document | null;
  onAssetPress?: (asset: any) => void;
  onDeadlinePress?: (deadline: any) => void;
  onDelete?: () => void;
}) {
  const [asset, setAsset] = useState<any>(null);
  const [deadline, setDeadline] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // Stati per file multipli
  const [allFiles, setAllFiles] = useState<Array<{ url: string; path: string; isImage: boolean }>>([]);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);
  
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [selectedEditAsset, setSelectedEditAsset] = useState<any>(null);
  const [saveLoading, setSaveLoading] = useState(false);
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

  useEffect(() => {
    async function load() {
      if (!document) return;
      
      setAsset(null);
      setDeadline(null);
      setPreviewUrl(null);
      setAllFiles([]);
      setIsEditing(false);
      setShowActionsMenu(false);
      setShowImageViewer(false);

      // Inizializza valori di editing
      setEditTitle(document.title);
      setEditTags(document.tags?.join(', ') || '');
      setEditDescription((document as any).description || '');

      try {
        // Carica bene associato
        if (document.asset_id) {
          const { data: assetData } = await supabase
            .from('assets')
            .select('*')
            .eq('id', document.asset_id)
            .single();
          setAsset(assetData);
          setSelectedEditAsset(assetData);
        } else {
          setSelectedEditAsset(null);
        }

        // Carica scadenza associata
        if ((document as any).deadline_id) {
          const { data: deadlineData } = await supabase
            .from('deadlines')
            .select('*')
            .eq('id', (document as any).deadline_id)
            .single();
          setDeadline(deadlineData);
        }

        // Gestisce file multipli o singolo file
        if (document.storage_path) {
          let filePaths: string[] = [];
          
          try {
            // Prova a parsare come JSON (file multipli)
            const parsed = JSON.parse(document.storage_path);
            if (Array.isArray(parsed)) {
              filePaths = parsed;
            } else {
              filePaths = [document.storage_path];
            }
          } catch {
            // Se il parse fallisce, è un singolo file
            filePaths = [document.storage_path];
          }

          // Genera URL per tutti i file
          const files = filePaths.map(path => {
            const { data } = supabase.storage
              .from('documents')
              .getPublicUrl(path);
            
            return {
              url: data.publicUrl,
              path: path,
              isImage: isImageFile(path)
            };
          });

          setAllFiles(files);
          
          // Mantieni il comportamento legacy per previewUrl (primo file)
          if (files.length > 0) {
            setPreviewUrl(files[0].url);
          }
        }
      } catch (error) {
        console.error('Errore caricamento dettagli:', error);
      }
    }
    
    if (visible) {
      load();
    }
  }, [document, visible]);

  function isImageFile(path?: string | null) {
    if (!path) return false;
    const extension = path.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  }

  async function handleDownload() {
    if (!document?.storage_path || !previewUrl) return;
    
    try {
      setDownloadLoading(true);
      const fileName = document.storage_path.split('/').pop() || 'document';
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(previewUrl, fileUri);
      
      if (downloadResult.status === 200) {
        Alert.alert('Successo', 'File scaricato con successo');
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile scaricare il file');
    } finally {
      setDownloadLoading(false);
    }
  }

  async function handleFileDownload(fileUrl: string, filePath: string) {
    try {
      const fileName = filePath.split('/').pop() || 'document';
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);
      
      if (downloadResult.status === 200) {
        Alert.alert('Successo', 'File scaricato con successo');
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile scaricare il file');
    }
  }

  async function handleShare() {
    if (!document?.storage_path || !previewUrl) return;
    
    try {
      setShareLoading(true);
      const fileName = document.storage_path.split('/').pop() || 'document';
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(previewUrl, fileUri);
      
      if (downloadResult.status === 200) {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Errore', 'Condivisione non disponibile');
        }
      }
    } catch (error) {
      Alert.alert('Errore', 'Impossibile condividere il file');
    } finally {
      setShareLoading(false);
    }
  }

  async function handleSaveEdit() {
    if (!document || !editTitle.trim()) {
      Alert.alert('Errore', 'Il titolo è richiesto');
      return;
    }

    try {
      setSaveLoading(true);
      
      const tags = editTags.trim() ? editTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
      
      const { error } = await supabase
        .from('documents')
        .update({
          title: editTitle.trim(),
          tags: tags.length > 0 ? tags : null,
          description: editDescription.trim() || null,
          asset_id: selectedEditAsset?.id || null
        })
        .eq('id', document.id);

      if (error) throw error;

      Alert.alert('Successo', 'Documento aggiornato');
      setIsEditing(false);
      // Ricarica i dati
      onClose();
    } catch (error) {
      Alert.alert('Errore', 'Impossibile salvare le modifiche');
    } finally {
      setSaveLoading(false);
    }
  }

  function handleDelete() {
    if (!document) return;
    Alert.alert('Conferma', `Eliminare "${document.title}"?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: async () => { 
        await deleteDocument(document.id); 
        onClose(); 
        onDelete?.(); // Notifica il parent
      }}
    ]);
  }

  function closeModal() {
    setShowActionsMenu(false);
    setIsEditing(false);
    onClose();
  }

  if (!document) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              {isEditing ? (
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={{
                    fontSize: 24,
                    fontWeight: '800',
                    flex: 1,
                    marginRight: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#d1d1d6',
                    paddingBottom: 4
                  }}
                />
              ) : (
                <Text style={{ fontSize: 24, fontWeight: '800', flex: 1 }}>{document.title}</Text>
              )}
              
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {isEditing ? (
                  <>
                    <Pressable
                      onPress={() => setIsEditing(false)}
                      style={{ padding: 8, backgroundColor: '#f2f2f7', borderRadius: 8 }}
                    >
                      <Ionicons name="close" size={16} color="#ff3b30" />
                    </Pressable>
                    <Pressable
                      onPress={handleSaveEdit}
                      disabled={saveLoading}
                      style={{
                        padding: 8,
                        backgroundColor: '#0a84ff',
                        borderRadius: 8,
                        opacity: saveLoading ? 0.5 : 1
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={16} color="#fff" />
                    </Pressable>
                  </>
                ) : (
                  <>
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
                          <Pressable
                            onPress={() => {
                              setShowActionsMenu(false);
                              setIsEditing(true);
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
                  </>
                )}
              </View>
            </View>

            {/* Galleria file multipli */}
            {allFiles.length > 0 && !isEditing && (
              <View style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text style={{ fontWeight: '600' }}>
                    File allegati ({allFiles.length})
                  </Text>
                  {allFiles.filter(f => f.isImage).length > 0 && (
                    <Text style={{ fontSize: 12, color: '#666' }}>
                      Tocca per ingrandire
                    </Text>
                  )}
                </View>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 12 }}
                >
                  {allFiles.map((file, index) => (
                    <Pressable
                      key={index}
                      onPress={() => {
                        if (file.isImage) {
                          const imageUrls = allFiles.filter(f => f.isImage).map(f => f.url);
                          const imageIndex = allFiles.filter(f => f.isImage).findIndex(f => f.url === file.url);
                          setImageViewerIndex(imageIndex);
                          setShowImageViewer(true);
                        } else {
                          // Per documenti non immagini, avvia download
                          handleFileDownload(file.url, file.path);
                        }
                      }}
                      style={{
                        width: 120,
                        height: 120,
                        borderRadius: 12,
                        backgroundColor: '#f2f2f7',
                        overflow: 'hidden',
                        borderWidth: 1,
                        borderColor: '#e5e5ea'
                      }}
                    >
                      {file.isImage ? (
                        <Image
                          source={{ uri: file.url }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Ionicons name="document-text" size={32} color="#666" />
                          <Text style={{ 
                            fontSize: 10, 
                            color: '#666', 
                            textAlign: 'center',
                            marginTop: 4,
                            paddingHorizontal: 4
                          }} numberOfLines={2}>
                            {file.path.split('/').pop()?.split('-').slice(2).join('-') || 'Documento'}
                          </Text>
                        </View>
                      )}
                      
                      {/* Badge per indicare il tipo */}
                      <View style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: file.isImage ? 'rgba(52, 199, 89, 0.9)' : 'rgba(10, 132, 255, 0.9)',
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2
                      }}>
                        <Text style={{ 
                          color: '#fff', 
                          fontSize: 10, 
                          fontWeight: '600' 
                        }}>
                          {file.isImage ? 'IMG' : 'DOC'}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={{ gap: 16, flex: 1 }}>
              {!isEditing && (
                <View>
                  <Text style={{ fontWeight: '600', marginBottom: 4 }}>Creato</Text>
                  <Text style={{ color: '#666' }}>
                    {new Date(document.created_at).toLocaleDateString('it-IT', {
                      weekday: 'long',
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              )}

              {/* Modifica descrizione */}
              {isEditing && (
                <View>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>Descrizione</Text>
                  <TextInput
                    value={editDescription}
                    onChangeText={setEditDescription}
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: '#f2f2f7',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 0,
                      height: 100,
                      textAlignVertical: 'top'
                    }}
                  />
                </View>
              )}

              {/* Bene associato in modalità editing */}
              {isEditing && (
                <View>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>
                    Bene associato (opzionale)
                  </Text>
                  {selectedEditAsset ? (
                    <View style={{
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: '#0a84ff',
                      backgroundColor: '#e8f4ff',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        backgroundColor: '#0a84ff',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Ionicons 
                          name={getAssetIcon(selectedEditAsset) as any} 
                          size={18} 
                          color="#fff" 
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '600' }}>{selectedEditAsset.name}</Text>
                        {selectedEditAsset.identifier && (
                          <Text style={{ fontSize: 12, color: '#666' }}>{selectedEditAsset.identifier}</Text>
                        )}
                      </View>
                      <Pressable
                        onPress={() => setSelectedEditAsset(null)}
                        style={{ padding: 4 }}
                      >
                        <Ionicons name="close" size={16} color="#ff3b30" />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={{
                        padding: 12,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: '#d1d1d6',
                        backgroundColor: '#fff',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ color: '#666' }}>Seleziona un bene...</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {/* Sezione Asset Associato */}
              {asset && !isEditing && (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Bene Associato</Text>
                  <Pressable
                    onPress={() => onAssetPress?.(asset)}
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
                          name={getAssetIcon(asset) as any} 
                          size={16} 
                          color="#fff" 
                        />
                      </View>
                      <View>
                        <Text style={{ fontSize: 14, fontWeight: '600' }}>{asset.name}</Text>
                        {asset.identifier && (
                          <Text style={{ fontSize: 12, color: '#666' }}>{asset.identifier}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </Pressable>
                </>
              )}

              {/* Sezione Scadenza Associata */}
              {deadline && !isEditing && (
                <>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Scadenza Associata</Text>
                  <Pressable
                    onPress={() => onDeadlinePress?.(deadline)}
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
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600' }}>{deadline.title}</Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        Scade il {new Date(deadline.due_at).toLocaleDateString('it-IT')}
                        {deadline.recurrence_rrule && ' • Ricorrente'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </Pressable>
                </>
              )}

              {/* Tag */}
              {((document.tags && document.tags.length > 0) || isEditing) && (
                <View>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>Tag</Text>
                  {isEditing ? (
                    <TextInput
                      value={editTags}
                      onChangeText={setEditTags}
                      style={{
                        borderWidth: 1,
                        borderColor: '#d1d1d6',
                        borderRadius: 12,
                        padding: 12,
                        backgroundColor: '#fff'
                      }}
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {document.tags?.map((tag, index) => (
                        <View key={index} style={{
                          backgroundColor: '#f2f2f7',
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16
                        }}>
                          <Text style={{ fontSize: 12, color: '#666' }}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Descrizione in visualizzazione */}
              {(document as any).description && !isEditing && (
                <View>
                  <Text style={{ fontWeight: '600', marginBottom: 8 }}>Descrizione</Text>
                  <Text style={{ color: '#666', lineHeight: 20 }}>{(document as any).description}</Text>
                </View>
              )}
            </View>

            {/* Bottoni in basso */}
            {!isEditing && previewUrl && (
              <View style={{ flexDirection: 'row', gap: 12, paddingTop: 24 }}>
                <Pressable
                  onPress={handleDownload}
                  disabled={downloadLoading}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: '#e3f2fd',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: downloadLoading ? 0.5 : 1
                  }}
                >
                  <Ionicons name="download" size={20} color="#1976d2" />
                  <Text style={{ color: '#1976d2', fontWeight: '600', marginLeft: 8 }}>
                    {downloadLoading ? 'Scarico...' : 'Scarica'}
                  </Text>
                </Pressable>
                
                <Pressable
                  onPress={handleShare}
                  disabled={shareLoading}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: '#e8f5e8',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: shareLoading ? 0.5 : 1
                  }}
                >
                  <Ionicons name="share" size={20} color="#2e7d32" />
                  <Text style={{ color: '#2e7d32', fontWeight: '600', marginLeft: 8 }}>
                    {shareLoading ? 'Condivido...' : 'Condividi'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Image Viewer per le immagini */}
      <ImageViewer
        visible={showImageViewer}
        images={allFiles.filter(f => f.isImage).map(f => f.url)}
        initialIndex={imageViewerIndex}
        onClose={() => setShowImageViewer(false)}
      />
    </Modal>
  );
} 