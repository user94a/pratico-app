import { AddDocumentModal, AddDocumentModalRef } from '@/components/modals/AddDocumentModal';
import { AssetDetailModal } from '@/components/modals/AssetDetailModal';
import { DeadlineDetailModal } from '@/components/modals/DeadlineDetailModal';
import { DocumentDetailModal } from '@/components/modals/DocumentDetailModal';
import { Colors } from '@/constants/Colors';
import { createDocumentWithAssociations, getDocuments } from '@/lib/api';
import { Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function Documenti() {
  const [items, setItems] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocument, setShowDocument] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<any>(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [showDeadlineDetail, setShowDeadlineDetail] = useState(false);
  
  const addDocumentModalRef = useRef<AddDocumentModalRef>(null);

  async function load() {
    try {
      setLoading(true);
      const data = await getDocuments();
      setItems(data);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const filteredItems = items.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(searchLower);
    const tagMatch = item.tags && item.tags.some(tag => 
      tag.toLowerCase().includes(searchLower)
    );
    const assetMatch = item.asset?.name && item.asset.name.toLowerCase().includes(searchLower);
    return titleMatch || tagMatch || assetMatch;
  });

  // Funzione per determinare la categoria del documento
  function getDocumentCategory(document: Document): string {
    // Se ha tag, usa il primo tag come categoria
    if (document.tags && document.tags.length > 0) {
      return document.tags[0].toLowerCase();
    }
    
    // Altrimenti usa una categoria generica basata sul tipo di file
    if (document.storage_path) {
      const extension = document.storage_path.toLowerCase().split('.').pop();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        return 'immagini';
      }
      if (['pdf'].includes(extension || '')) {
        return 'pdf';
      }
      if (['doc', 'docx'].includes(extension || '')) {
        return 'documenti';
      }
    }
    
    return 'altro';
  }

  // Raggruppa i documenti per categoria
  const groupedDocuments = filteredItems.reduce((groups, document) => {
    const category = getDocumentCategory(document);
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(document);
    return groups;
  }, {} as Record<string, typeof filteredItems>);

  // Ordina le categorie per numero di documenti (decrescente) e poi alfabeticamente
  const sortedCategories = Object.keys(groupedDocuments).sort((a, b) => {
    const countDiff = groupedDocuments[b].length - groupedDocuments[a].length;
    if (countDiff !== 0) return countDiff;
    return a.localeCompare(b);
  });

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

  // Componente per le sezioni dei documenti
  function DocumentSection({ title, documents }: { title: string; documents: typeof filteredItems }) {
    if (documents.length === 0) return null;
    
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: Colors.light.text,
          marginBottom: 12,
          marginLeft: 4
        }}>
          {title.charAt(0).toUpperCase() + title.slice(1)}
        </Text>
        <View style={{
          backgroundColor: Colors.light.cardBackground,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
        }}>
          {documents.map((document, index) => {
            const isLast = index === documents.length - 1;
  return (
              <View key={document.id}>
                {renderDocument({ item: document })}
                {!isLast && (
                  <View style={{
                    height: 0.5,
                    backgroundColor: Colors.light.border,
                    marginLeft: 0,
                    marginRight: 0
                  }} />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  const renderDocument = ({ item }: { item: Document }) => (
    <Pressable
      onPress={() => setSelectedDocument(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
      }}
    >
        <View style={{ flex: 1 }}>
        {/* Titolo documento */}
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: Colors.light.text,
          marginBottom: 6
        }}>
          {item.title}
        </Text>

        {/* Asset associato con icona del tipo */}
        {item.asset?.name && (
          <View style={{
            backgroundColor: Colors.light.tint + '15',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 12,
            alignSelf: 'flex-start',
            marginBottom: item.tags && item.tags.length > 0 ? 6 : 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6
          }}>
            <Ionicons 
              name={getAssetIcon(item.asset) as any} 
              size={12} 
              color={Colors.light.tint} 
            />
            <Text style={{
              fontSize: 13,
              fontWeight: '500',
              color: Colors.light.tint
            }}>
              {item.asset.name}
            </Text>
          </View>
        )}
        
        {/* Tags migliorati */}
        {item.tags && item.tags.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={{ 
                  backgroundColor: Colors.light.background,
                  borderWidth: 1, 
                  borderColor: Colors.light.border,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12, 
                  marginRight: 6,
                  marginBottom: 2,
                }}
              >
                <Text style={{
                  fontSize: 12,
                  color: Colors.light.textSecondary,
                  fontWeight: '500'
                }}>
                  #{tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <View style={{
                backgroundColor: Colors.light.background,
                borderWidth: 1,
                borderColor: Colors.light.border,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                marginRight: 6,
                marginBottom: 2,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: Colors.light.textSecondary,
                  fontWeight: '500'
                }}>
                  +{item.tags.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
            </View>

      <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: Colors.light.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8
        }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800',
            color: Colors.light.text
          }}>
            Documenti
          </Text>
            <Pressable 
              onPress={() => setShowDocument(true)} 
            style={{
              backgroundColor: Colors.light.tint,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Search */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            borderColor: Colors.light.border,
            borderWidth: 0.5
          }}>
            <Ionicons name="search" size={20} color={Colors.light.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ 
                flex: 1, 
                fontSize: 16,
                color: Colors.light.text
              }}
              placeholder="Cerca documenti, tag..."
              placeholderTextColor={Colors.light.textSecondary}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
            </Pressable>
            )}
          </View>
          </View>

        {/* Documents List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(groupedDocuments).length === 0 ? (
            <View style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 60
            }}>
              <Ionicons name="document-text-outline" size={60} color={Colors.light.textSecondary} />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: Colors.light.textSecondary,
                marginTop: 16,
                textAlign: 'center'
              }}>
                {searchQuery ? 'Nessun documento trovato' : 'Nessun documento caricato'}
              </Text>
              {!searchQuery && (
                <Text style={{ 
                  fontSize: 14,
                  color: Colors.light.textSecondary,
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  Tocca + per aggiungere il tuo primo documento
                </Text>
              )}
            </View>
          ) : (
            sortedCategories.map((category) => {
              const documents = groupedDocuments[category];
              if (!documents || documents.length === 0) return null;
              
              return (
                <DocumentSection 
                  key={category} 
                  title={category} 
                  documents={documents} 
          />
              );
            })
          )}
        </ScrollView>
      </View>

          <AddDocumentModal 
        ref={addDocumentModalRef}
            visible={showDocument} 
        onClose={() => setShowDocument(false)}
        onSubmit={async (result) => {
              try { 
            console.log('Creating document with data:', result);
            await createDocumentWithAssociations(result as any);
            await load();
            Alert.alert('Successo', 'Documento creato con successo');
                setShowDocument(false); 
          } catch (error: any) {
            console.error('Error creating document:', error);
            // Reset del loading in caso di errore
            addDocumentModalRef.current?.resetLoading();
            Alert.alert('Errore', error.message || 'Errore durante la creazione del documento');
            // Non chiudiamo il modal in caso di errore, permettiamo all'utente di riprovare
              } 
            }} 
          />

      {selectedDocument && (
          <DocumentDetailModal
            visible={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            document={selectedDocument}
          onDelete={async () => {
            // Ricarica la lista dei documenti dopo l'eliminazione
            await load();
            setSelectedDocument(null);
          }}
          onAssetPress={(asset) => {
            // Chiudi prima il modal del documento, poi apri quello del bene
            setSelectedDocument(null);
            setTimeout(() => {
              setSelectedAsset(asset);
              setShowAssetDetail(true);
            }, 100);
          }}
          onDeadlinePress={(deadline) => {
            // Chiudi prima il modal del documento, poi apri quello della scadenza
            setSelectedDocument(null);
            setTimeout(() => {
              setSelectedDeadline(deadline);
              setShowDeadlineDetail(true);
            }, 100);
          }}
        />
      )}

      {selectedAsset && (
        <AssetDetailModal
          visible={showAssetDetail}
          onClose={() => {
            setShowAssetDetail(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          onEdit={async () => {
            await load();
          }}
          onDelete={() => {
            setShowAssetDetail(false);
            setSelectedAsset(null);
          }}
          onDeadlinePress={(deadline) => {
            // Chiudi prima il modal del bene, poi apri quello della scadenza
            setShowAssetDetail(false);
            setTimeout(() => {
              setSelectedDeadline(deadline);
              setShowDeadlineDetail(true);
            }, 100);
          }}
        />
      )}

      {selectedDeadline && (
        <DeadlineDetailModal
          visible={showDeadlineDetail}
          onClose={() => {
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          deadline={selectedDeadline}
          onToggleStatus={async () => {
            await load();
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onDelete={async () => {
            await load();
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onEdit={async () => {
            await load();
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
        />
      )}
      </SafeAreaView>
  );
} 