import { AddDocumentModal, AddDocumentModalRef } from '@/components/modals/AddDocumentModal';
import { AssetDetailModal } from '@/components/modals/AssetDetailModal';
import { DeadlineDetailModal } from '@/components/modals/DeadlineDetailModal';
import { Colors } from '@/constants/Colors';
import { createDocumentWithAssociations, getDocuments } from '@/lib/api';
import { getAssetIcon } from '@/lib/assetIcons';
import { Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function Documenti() {
  const router = useRouter();
  const [items, setItems] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDocument, setShowDocument] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDeadline, setSelectedDeadline] = useState<any>(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [showDeadlineDetail, setShowDeadlineDetail] = useState(false);
  
  const addDocumentModalRef = useRef<AddDocumentModalRef>(null);

  async function load(forceRefresh = false) {
    try {
      // Se non è un refresh forzato e abbiamo dati recenti (meno di 30 secondi), non ricaricare
      if (!forceRefresh && lastLoadTime && (Date.now() - lastLoadTime) < 30000 && items.length > 0) {
        return;
      }
      
      setLoading(true);
      const data = await getDocuments();
      setItems(data);
      setLastLoadTime(Date.now());
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    } finally {
      setLoading(false);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  // Carica solo al primo focus, non ad ogni cambio tab
  useFocusEffect(useCallback(() => { 
    if (items.length === 0) {
      load();
    }
  }, [items.length]));

  const filteredItems = items.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = item.title.toLowerCase().includes(searchLower);
    const tagMatch = item.tags && item.tags.some(tag => 
      tag.toLowerCase().includes(searchLower)
    );
    const assetMatch = item.asset?.name && item.asset.name.toLowerCase().includes(searchLower);
    return titleMatch || tagMatch || assetMatch;
  });

  // Ordina i documenti per data di creazione (più recenti prima)
  const sortedDocuments = filteredItems.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );





  const renderDocument = ({ item }: { item: Document }) => (
    <Pressable
      onPress={() => router.push(`/document-detail?id=${item.id}`)}
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
            backgroundColor: '#e5e5ea',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}>
            <Ionicons name="search" size={17} color="#8e8e93" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ 
                flex: 1, 
                fontSize: 17,
                color: Colors.light.text,
                paddingVertical: 4
              }}
              placeholder="Cerca"
              placeholderTextColor="#8e8e93"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={17} color="#8e8e93" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Documents List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.tint}
            />
          }
        >
          {sortedDocuments.length === 0 ? (
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
            <View style={{
              backgroundColor: Colors.light.cardBackground,
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 1,
              elevation: 1,
              marginBottom: 24
            }}>
              {sortedDocuments.map((document, index) => {
                const isLast = index === sortedDocuments.length - 1;
                return (
                  <View key={document.id}>
                    {renderDocument({ item: document })}
                    {!isLast && (
                      <View style={{
                        height: 0.33,
                        backgroundColor: Colors.light.border,
                        marginLeft: 0,
                        marginRight: 0
                      }} />
                    )}
                  </View>
                );
              })}
            </View>
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
            await load(true); // Forza refresh dopo creazione
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



      {selectedAsset && (
        <AssetDetailModal
          visible={showAssetDetail}
          onClose={() => {
            setShowAssetDetail(false);
            setSelectedAsset(null);
          }}
          asset={selectedAsset}
          onEdit={async () => {
            await load(true); // Forza refresh dopo modifica
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
            await load(true); // Forza refresh dopo modifica
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onDelete={async () => {
            await load(true); // Forza refresh dopo eliminazione
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onEdit={async () => {
            await load(true); // Forza refresh dopo modifica
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
        />
      )}
      </SafeAreaView>
  );
} 