import { Colors } from '@/constants/Colors';
import { deleteDocument, getDocument } from '@/lib/api';
import { Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
            top: 60,
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
                  backgroundColor: index === currentIndex ? '#fff' : 'rgba(255,255,255,0.3)'
                }}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

export default function DocumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(true);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pdfFiles, setPdfFiles] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      loadDocumentData();
    }
  }, [id]);

  async function loadDocumentData() {
    try {
      setLoading(true);
      
      const data = await getDocument(id);

      console.log('🔍 DEBUG - documento caricato:', data);

      setDocument(data);
      setTitle(data.title);
      setTags(data.tags || '');

      // Carica le immagini e PDF se presenti
      if (data.file_url && data.file_type) {
        console.log('🔍 DEBUG - file URL:', data.file_url);
        console.log('🔍 DEBUG - file type:', data.file_type);
        
        // Per ora gestiamo un singolo file
        const fileUrl = data.file_url;
        const fileType = data.file_type;
        const fileName = data.title || 'documento';
        
        if (fileType === 'image') {
          setImageUrls([fileUrl]);
          setPdfFiles([]);
          console.log('✅ Immagine aggiunta:', fileName, fileUrl);
        } else if (fileType === 'pdf') {
          setImageUrls([]);
          setPdfFiles([fileUrl]);
          console.log('✅ PDF aggiunto:', fileName, fileUrl);
        } else {
          console.log('❌ Tipo di file non riconosciuto:', fileType);
          setImageUrls([]);
          setPdfFiles([]);
        }
      } else {
        console.log('🔍 DEBUG - nessun file allegato o tipo non disponibile');
        setImageUrls([]);
        setPdfFiles([]);
      }
    } catch (error) {
      console.error('Errore nel caricamento del documento:', error);
      Alert.alert('Errore', 'Impossibile caricare i dettagli del documento');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!title.trim()) {
      Alert.alert('Errore', 'Il titolo è richiesto');
      return;
    }

    try {
      // Per ora non implementiamo l'aggiornamento, solo simuliamo il successo
      setDocument(prev => prev ? { ...prev, title: title.trim(), tags: tags.trim() || null } : null);
      setIsEditing(false);
      Alert.alert('Successo', 'Documento aggiornato con successo');
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
      Alert.alert('Errore', 'Impossibile aggiornare il documento');
    }
  }

  async function handleDelete() {
    Alert.alert(
      'Conferma eliminazione',
      'Sei sicuro di voler eliminare questo documento? Questa azione non può essere annullata.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDocument(id);
              Alert.alert('Successo', 'Documento eliminato con successo');
              router.back();
            } catch (error) {
              console.error('Errore nell\'eliminazione:', error);
              Alert.alert('Errore', 'Impossibile eliminare il documento');
            }
          }
        }
      ]
    );
  }

  async function handleShare() {
    if (!document?.file_url) {
      Alert.alert('Errore', 'Nessun file da condividere');
      return;
    }

    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Errore', 'La condivisione non è disponibile su questo dispositivo');
        return;
      }

      await Sharing.shareAsync(document.file_url);
    } catch (error) {
      console.error('Errore nella condivisione:', error);
      Alert.alert('Errore', 'Impossibile condividere il documento');
    }
  }

  function handleImagePress(index: number) {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
  }

  async function handlePdfPress(pdfPath: string) {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Errore', 'La condivisione non è disponibile su questo dispositivo');
        return;
      }

      await Sharing.shareAsync(pdfPath);
    } catch (error) {
      console.error('Errore nell\'apertura del PDF:', error);
      Alert.alert('Errore', 'Impossibile aprire il PDF');
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

  if (!document) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: Colors.light.textSecondary }}>Documento non trovato</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
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
          onPress={() => router.back()}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: Colors.light.background,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="chevron-back" size={20} color={Colors.light.text} />
        </Pressable>

        <Text style={{
          fontSize: 17,
          fontWeight: '600',
          color: Colors.light.text,
          flex: 1,
          textAlign: 'center',
          marginHorizontal: 16
        }}>
          {isEditing ? 'Modifica Documento' : document.title}
        </Text>

        {isEditing ? (
          <Pressable onPress={handleSave}>
            <Text style={{ 
              fontSize: 16, 
              color: Colors.light.tint, 
              fontWeight: '600' 
            }}>
              Salva
            </Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setIsEditing(true)}>
            <Text style={{ 
              fontSize: 16, 
              color: Colors.light.tint, 
              fontWeight: '600' 
            }}>
              Modifica
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Titolo e Note */}
        <View style={{ paddingTop: 16, paddingBottom: 16 }}>
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
            {isEditing ? (
              <TextInput
                value={title}
                onChangeText={setTitle}
                style={{
                  fontSize: 28,
                  fontWeight: '700',
                  color: Colors.light.text,
                  textAlign: 'center',
                  marginBottom: 8
                }}
                placeholder="Titolo documento"
                placeholderTextColor={Colors.light.textSecondary}
              />
            ) : (
              <Text style={{
                fontSize: 28,
                fontWeight: '700',
                color: Colors.light.text,
                textAlign: 'center',
                marginBottom: 8
              }}>
                {document.title}
              </Text>
            )}

            {document.tags && (
              <Text style={{
                fontSize: 16,
                color: Colors.light.textSecondary,
                textAlign: 'center'
              }}>
                {document.tags}
              </Text>
            )}
          </View>
        </View>

        {/* Azioni */}
        <View style={{ marginBottom: 16 }}>
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderRadius: 16,
            padding: 16,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1
          }}>
            <Pressable
              onPress={handleShare}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                borderBottomWidth: 0.33,
                borderBottomColor: Colors.light.border
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="share-outline" size={20} color={Colors.light.tint} />
                <Text style={{
                  fontSize: 16,
                  color: Colors.light.text,
                  marginLeft: 12
                }}>
                  Condividi
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
            </Pressable>

            <Pressable
              onPress={handleDelete}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                <Text style={{
                  fontSize: 16,
                  color: '#FF3B30',
                  marginLeft: 12
                }}>
                  Elimina
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* Informazioni */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: Colors.light.text,
            marginBottom: 12,
            marginLeft: 4
          }}>
            Informazioni
          </Text>
          
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderRadius: 16,
            padding: 16,
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
              <Text style={{
                fontSize: 16,
                color: Colors.light.textSecondary
              }}>
                Data creazione
              </Text>
              <Text style={{
                fontSize: 16,
                color: Colors.light.text
              }}>
                {new Date(document.created_at).toLocaleDateString('it-IT')}
              </Text>
            </View>

            {document.asset && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 8
              }}>
                <Text style={{
                  fontSize: 16,
                  color: Colors.light.textSecondary
                }}>
                  Bene associato
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    backgroundColor: Colors.light.tint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8
                  }}>
                    <Ionicons 
                      name={(document.asset.asset_type?.icon || document.asset.asset_category?.icon || 'cube') as any} 
                      size={14} 
                      color="#fff" 
                    />
                  </View>
                  <Text style={{
                    fontSize: 16,
                    color: Colors.light.text
                  }}>
                    {document.asset.name}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Tag (in modalità editing) */}
        {isEditing && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: Colors.light.text,
              marginBottom: 12,
              marginLeft: 4
            }}>
              Tag
            </Text>
            
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1
            }}>
              <TextInput
                value={tags}
                onChangeText={setTags}
                placeholder="Aggiungi tag separati da virgola"
                placeholderTextColor={Colors.light.textSecondary}
                style={{
                  fontSize: 16,
                  color: Colors.light.text,
                  textAlignVertical: 'top'
                }}
                multiline
              />
            </View>
          </View>
        )}

        {/* File Caricati */}
        {console.log('🔍 DEBUG - Render - imageUrls.length:', imageUrls.length, 'pdfFiles.length:', pdfFiles.length)}
        {(imageUrls.length > 0 || pdfFiles.length > 0) && (
          <View style={{ marginBottom: 32 }}>
            <Text style={{
              fontSize: 20,
              fontWeight: '700',
              color: Colors.light.text,
              marginBottom: 12,
              marginLeft: 4
            }}>
              File Caricati
            </Text>
            
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              padding: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1
            }}>
              {/* Immagini */}
              {imageUrls.length > 0 && (
                <View style={{ marginBottom: imageUrls.length > 0 && pdfFiles.length > 0 ? 16 : 0 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: Colors.light.textSecondary,
                    marginBottom: 8
                  }}>
                    Immagini ({imageUrls.length})
                  </Text>
                  <FlatList
                    data={imageUrls}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item, index }) => (
                      <Pressable
                        onPress={() => handleImagePress(index)}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 12,
                          marginRight: 12,
                          overflow: 'hidden'
                        }}
                      >
                        <Image
                          source={{ uri: item }}
                          style={{
                            width: '100%',
                            height: '100%'
                          }}
                          resizeMode="cover"
                        />
                      </Pressable>
                    )}
                    keyExtractor={(item, index) => `image-${index}`}
                  />
                </View>
              )}

              {/* PDF */}
              {pdfFiles.length > 0 && (
                <View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: Colors.light.textSecondary,
                    marginBottom: 8
                  }}>
                    Documenti PDF ({pdfFiles.length})
                  </Text>
                  <FlatList
                    data={pdfFiles}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => handlePdfPress(item)}
                        style={{
                          width: 120,
                          height: 120,
                          borderRadius: 12,
                          marginRight: 12,
                          backgroundColor: Colors.light.background,
                          borderWidth: 1,
                          borderColor: Colors.light.border,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <View style={{ alignItems: 'center' }}>
                          <Ionicons name="document-text" size={32} color={Colors.light.tint} />
                          <Text style={{
                            fontSize: 12,
                            color: Colors.light.textSecondary,
                            marginTop: 4,
                            textAlign: 'center'
                          }}>
                            PDF
                          </Text>
                        </View>
                      </Pressable>
                    )}
                    keyExtractor={(item, index) => `pdf-${index}`}
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer
        visible={showImageViewer}
        images={imageUrls}
        initialIndex={selectedImageIndex}
        onClose={() => setShowImageViewer(false)}
      />
    </SafeAreaView>
  );
}
