
import { DeadlineDetailModal } from '@/components/modals/DeadlineDetailModal';
import { DocumentDetailModal } from '@/components/modals/DocumentDetailModal';

import { NewAddAssetModal } from '@/components/modals/NewAddAssetModal';
import { Colors } from '@/constants/Colors';
import { deleteAsset, deleteDeadline, getAllDeadlines, getAssets, updateDeadlineStatus } from '@/lib/api';
import { getAssetIcon } from '@/lib/assetIcons';
import { Asset, Deadline, Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function BeniScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showDeadlineDetail, setShowDeadlineDetail] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);

  const [search, setSearch] = useState('');



  function getAssetDeadlineStatus(assetId: string, deadlines: Deadline[]) {
    const assetDeadlines = deadlines.filter(d => 
      d.asset_id === assetId && d.status === 'pending'
    );
    
    if (assetDeadlines.length === 0) return null;
    
    const now = new Date();
    const overdue = assetDeadlines.some(d => new Date(d.due_at) < now);
    const upcoming = assetDeadlines.some(d => {
      const diffTime = new Date(d.due_at).getTime() - now.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 7;
    });
    
    if (overdue) return { backgroundColor: Colors.light.error };
    if (upcoming) return { backgroundColor: Colors.light.warning };
    return null;
  }

  async function load() {
    try {
      setLoading(true);
      const [assetsData, deadlinesData] = await Promise.all([
        getAssets(),
        getAllDeadlines()
      ]);
      setAssets(assetsData);
      setDeadlines(deadlinesData);
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare i dati');
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function handleCreateAsset(result: { asset: any; deadlines_created: number }) {
    try {
      await load();
      setShowAddModal(false);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    try {
      await deleteAsset(assetId);
      await load();
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    }
  }

  // Funzione per normalizzare i tipi di asset
  const normalizeAssetType = (type: string): string => {
    const typeMapping: Record<string, string> = {
      // Singolari (migrazione 013)
      'vehicle': 'vehicle',
      'home': 'home', 
      'device': 'device',
      'appliance': 'appliance',
      'animal': 'animal',
      'person': 'person',
      'subscription': 'subscription',
      'property': 'property',
      'investment': 'investment',
      'other': 'other',
      
      // Plurali (migrazione 010) - normalizza ai singolari
      'vehicles': 'vehicle',
      'properties': 'property',
      'animals': 'animal',
      'people': 'person',
      'devices': 'device',
      'subscriptions': 'subscription',
      
      // Legacy (migrazioni precedenti)
      'car': 'vehicle',
      'house': 'home'
    };
    
    return typeMapping[type] || 'other';
  };

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(search.toLowerCase()) ||
    (asset.identifier && asset.identifier.toLowerCase().includes(search.toLowerCase()))
  );

  // Raggruppa i beni per categoria normalizzata
  const groupedAssets = filteredAssets.reduce((groups, asset) => {
    const normalizedCategory = normalizeAssetType(asset.type);
    if (!groups[normalizedCategory]) {
      groups[normalizedCategory] = [];
    }
    groups[normalizedCategory].push(asset);
    return groups;
  }, {} as Record<string, Asset[]>);

  // Mapping per le etichette delle categorie normalizzate
  const categoryLabels: Record<string, string> = {
    'vehicle': 'Veicoli',
    'home': 'Casa',
    'device': 'Dispositivi',
    'appliance': 'Elettrodomestici', 
    'animal': 'Animali',
    'person': 'Persone',
    'subscription': 'Abbonamenti',
    'property': 'Proprietà',
    'investment': 'Investimenti',
    'other': 'Altro'
  };

  // Componente per le sezioni dei beni
  function AssetSection({ title, assets }: { title: string; assets: Asset[] }) {
    if (assets.length === 0) return null;
    
    return (
      <View style={{ marginBottom: 24 }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: Colors.light.text,
          marginBottom: 12,
          marginLeft: 4
        }}>
          {title}
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
          {assets.map((asset, index) => {
            const deadlineStatus = getAssetDeadlineStatus(asset.id, deadlines);
            const isLast = index === assets.length - 1;
            
            return (
              <Pressable
                key={asset.id}
                onPress={() => {
                  router.push({
                    pathname: '/asset-detail',
                    params: { id: asset.id }
                  });
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: isLast ? 0 : 0.5,
                  borderBottomColor: Colors.light.border
                }}
              >
                <View style={{ position: 'relative', marginRight: 12 }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: Colors.light.tint,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Ionicons 
                      name={getAssetIcon(asset) as any} 
                      size={18} 
                      color="#fff" 
                    />
                  </View>
                  {deadlineStatus && (
                    <View style={{
                      position: 'absolute',
                      top: -2,
                      right: -2,
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: deadlineStatus.backgroundColor,
                      borderWidth: 2,
                      borderColor: Colors.light.cardBackground
                    }} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: '600',
                    color: Colors.light.text,
                    marginBottom: 2
                  }}>
                    {asset.name}
                  </Text>
                  {asset.identifier && (
                    <Text style={{ 
                      fontSize: 14, 
                      color: Colors.light.textSecondary 
                    }}>
                      {asset.identifier}
                    </Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.light.textSecondary} />
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

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
            Beni
          </Text>
          <Pressable
            onPress={() => setShowAddModal(true)}
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
              value={search}
              onChangeText={setSearch}
              style={{ 
                flex: 1, 
                fontSize: 16,
                color: Colors.light.text
              }}
              placeholder="Cerca beni..."
              placeholderTextColor={Colors.light.textSecondary}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Assets List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {Object.keys(groupedAssets).length === 0 ? (
            <View style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 60
            }}>
              <Ionicons name="cube-outline" size={60} color={Colors.light.textSecondary} />
              <Text style={{ 
                fontSize: 18, 
                fontWeight: '600',
                color: Colors.light.textSecondary,
                marginTop: 16,
                textAlign: 'center'
              }}>
                {search ? 'Nessun bene trovato' : 'Nessun bene aggiunto'}
              </Text>
              {!search && (
                <Text style={{ 
                  fontSize: 14,
                  color: Colors.light.textSecondary,
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  Tocca + per aggiungere il tuo primo bene
                </Text>
              )}
            </View>
          ) : (
            Object.entries(groupedAssets).map(([category, assets]) => (
              <AssetSection 
                key={category} 
                title={categoryLabels[category as keyof typeof categoryLabels] || category} 
                assets={assets} 
              />
            ))
          )}
        </ScrollView>
      </View>

      <NewAddAssetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (asset) => {
          await load();
        }}
      />



      {selectedDeadline && (
        <DeadlineDetailModal
          visible={showDeadlineDetail}
          deadline={selectedDeadline}
          onClose={() => {
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onToggleStatus={async () => {
            if (selectedDeadline) {
              try {
                const newStatus = selectedDeadline.status === 'done' ? 'pending' : 'done';
                await updateDeadlineStatus(selectedDeadline.id, newStatus);
                await load();
              } catch (e: any) {
                Alert.alert('Errore', e.message);
              }
            }
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onDelete={async () => {
            if (selectedDeadline) {
              try {
                await deleteDeadline(selectedDeadline.id);
                await load();
              } catch (e: any) {
                Alert.alert('Errore', e.message);
              }
            }
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onEdit={async () => {
            await load();
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onAssetPress={(asset) => {
            // Chiudi il modal della scadenza e naviga al dettaglio bene
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
            setTimeout(() => {
              router.push({
                pathname: '/asset-detail',
                params: { id: asset.id }
              });
            }, 100);
          }}
        />
      )}

      {selectedDocument && (
        <DocumentDetailModal
          visible={showDocumentDetail}
          document={selectedDocument}
          onClose={() => {
            setShowDocumentDetail(false);
            setSelectedDocument(null);
          }}
          onUpdate={async () => {
            // Non serve ricaricare nulla qui, il documento non è nella lista principale
          }}
          onAssetPress={(asset) => {
            // Chiudi il modal del documento e naviga al dettaglio bene
            setShowDocumentDetail(false);
            setSelectedDocument(null);
            setTimeout(() => {
              router.push({
                pathname: '/asset-detail',
                params: { id: asset.id }
              });
            }, 100);
          }}
          onDeadlinePress={(deadline) => {
            // Chiudi prima il modal del documento, poi apri quello della scadenza
            setShowDocumentDetail(false);
            setSelectedDocument(null);
            setTimeout(() => {
              setSelectedDeadline(deadline);
              setShowDeadlineDetail(true);
            }, 100);
          }}
        />
      )}


    </SafeAreaView>
  );
} 