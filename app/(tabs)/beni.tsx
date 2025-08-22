
import { DeadlineDetailModal } from '@/components/modals/DeadlineDetailModal';
import { DocumentDetailModal } from '@/components/modals/DocumentDetailModal';

import { NewAddAssetModal } from '@/components/modals/NewAddAssetModal';
import { Colors } from '@/constants/Colors';
import { deleteAsset, deleteDeadline, getAllDeadlines, getAssets, updateDeadlineStatus } from '@/lib/api';
import { getAssetIcon } from '@/lib/assetIcons';
import { Asset, Deadline, Document } from '@/lib/types';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function BeniScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number | null>(null);
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

  async function load(forceRefresh = false) {
    try {
      // Se non è un refresh forzato e abbiamo dati recenti (meno di 30 secondi), non ricaricare
      if (!forceRefresh && lastLoadTime && (Date.now() - lastLoadTime) < 30000 && assets.length > 0) {
        return;
      }
      
      setLoading(true);
      const [assetsData, deadlinesData] = await Promise.all([
        getAssets(),
        getAllDeadlines()
      ]);
      setAssets(assetsData);
      setDeadlines(deadlinesData);
      setLastLoadTime(Date.now());
    } catch (error) {
      Alert.alert('Errore', 'Impossibile caricare i dati');
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
    if (assets.length === 0) {
      load();
    }
  }, [assets.length]));

  async function handleCreateAsset(result: { asset: any; deadlines_created: number }) {
    try {
      await load(true); // Forza refresh dopo creazione
      setShowAddModal(false);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    }
  }

  async function handleDeleteAsset(assetId: string) {
    try {
      await deleteAsset(assetId);
      await load(true); // Forza refresh dopo eliminazione
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
          borderRadius: 16
        }}>
          {assets.map((asset, index) => {
            const deadlineStatus = getAssetDeadlineStatus(asset.id, deadlines);
            const isLast = index === assets.length - 1;
            
            return (
              <View key={asset.id}>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/asset-detail',
                      params: { id: asset.id }
                    });
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    minHeight: 44
                  }}
                >
                  <View style={{ position: 'relative', marginRight: 12 }}>
                    <View style={{
                      width: 29,
                      height: 29,
                      borderRadius: 6,
                      backgroundColor: Colors.light.tint,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MaterialCommunityIcons 
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
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: deadlineStatus.backgroundColor,
                        borderWidth: 2,
                        borderColor: Colors.light.cardBackground
                      }} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontSize: 17, 
                      fontWeight: '400',
                      color: Colors.light.text,
                      marginBottom: asset.identifier ? 2 : 0
                    }}>
                      {asset.name}
                    </Text>
                    {asset.identifier && (
                      <Text style={{ 
                        fontSize: 15, 
                        color: Colors.light.textSecondary 
                      }}>
                        {asset.identifier}
                      </Text>
                    )}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
                </Pressable>
                {!isLast && (
                  <View style={{
                    height: 0.33,
                    backgroundColor: Colors.light.border,
                    marginLeft: 57
                  }} />
                )}
              </View>
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
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
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
              value={search}
              onChangeText={setSearch}
              style={{ 
                flex: 1, 
                fontSize: 17,
                color: Colors.light.text,
                paddingVertical: 4
              }}
              placeholder="Cerca"
              placeholderTextColor="#8e8e93"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')}>
                <MaterialCommunityIcons name="close-circle" size={17} color="#8e8e93" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Assets List */}
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
          {Object.keys(groupedAssets).length === 0 ? (
            <View style={{ 
              flex: 1, 
              alignItems: 'center', 
              justifyContent: 'center',
              paddingVertical: 60
            }}>
              <MaterialCommunityIcons name="package-variant-closed" size={60} color={Colors.light.textSecondary} />
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
          await load(true); // Forza refresh dopo creazione
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
                await load(true); // Forza refresh dopo modifica
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
                await load(true); // Forza refresh dopo eliminazione
              } catch (e: any) {
                Alert.alert('Errore', e.message);
              }
            }
            setShowDeadlineDetail(false);
            setSelectedDeadline(null);
          }}
          onEdit={async () => {
            await load(true); // Forza refresh dopo modifica
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