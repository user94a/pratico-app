import { AddAssetModal } from '@/components/modals/AddAssetModal';
import { AssetDetailModal } from '@/components/modals/AssetDetailModal';
import { DeadlineDetailModal } from '@/components/modals/DeadlineDetailModal';
import { DocumentDetailModal } from '@/components/modals/DocumentDetailModal';
import { EditAssetModal } from '@/components/modals/EditAssetModal';
import { Colors } from '@/constants/Colors';
import { deleteAsset, deleteDeadline, getAllDeadlines, getAssets, updateDeadlineStatus } from '@/lib/api';
import { Asset, Deadline, Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, TextInput, View } from 'react-native';

export default function BeniScreen() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState<Deadline | null>(null);
  const [showDeadlineDetail, setShowDeadlineDetail] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDocumentDetail, setShowDocumentDetail] = useState(false);
  const [showEditAsset, setShowEditAsset] = useState(false);
  const [search, setSearch] = useState('');

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
  function getAssetIcon(asset: Asset): string {
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
      setShowAssetDetail(false);
      setSelectedAsset(null);
    } catch (e: any) {
      Alert.alert('Errore', e.message);
    }
  }

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(search.toLowerCase()) ||
    (asset.identifier && asset.identifier.toLowerCase().includes(search.toLowerCase()))
  );

  // Raggruppa i beni per categoria
  const groupedAssets = filteredAssets.reduce((groups, asset) => {
    const category = asset.type;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(asset);
    return groups;
  }, {} as Record<string, Asset[]>);

  // Mapping per le etichette delle categorie (con retrocompatibilità)
  const categoryLabels = {
    // Nuove categorie
    vehicles: 'Veicoli',
    properties: 'Immobili',
    animals: 'Animali',
    people: 'Persone',
    devices: 'Dispositivi',
    subscriptions: 'Abbonamenti',
    other: 'Altro',
    // Retrocompatibilità con vecchie categorie
    car: 'Veicoli',
    house: 'Immobili'
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
                  setSelectedAsset(asset);
                  setShowAssetDetail(true);
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

      <AddAssetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateAsset}
      />

      {selectedAsset && (
        <AssetDetailModal
          visible={showAssetDetail}
          asset={selectedAsset}
          onClose={() => {
            setShowAssetDetail(false);
            setSelectedAsset(null);
          }}
          onDelete={() => handleDeleteAsset(selectedAsset.id)}
          onEdit={async () => {
            setShowAssetDetail(false);
            setTimeout(() => {
              setShowEditAsset(true);
            }, 100);
          }}
          onDeadlinePress={(deadline) => {
            // Chiudi prima il modal del bene, poi apri quello della scadenza
            setShowAssetDetail(false);
            setTimeout(() => {
              setSelectedDeadline(deadline);
              setShowDeadlineDetail(true);
            }, 100);
          }}
          onDocumentPress={(document) => {
            // Chiudi prima il modal del bene, poi apri quello del documento
            setShowAssetDetail(false);
            setTimeout(() => {
              setSelectedDocument(document);
              setShowDocumentDetail(true);
            }, 100);
          }}
        />
      )}

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
            // Trova l'asset completo dai dati locali
            const fullAsset = assets.find(a => a.id === asset.id);
            if (fullAsset) {
              // Chiudi prima il modal della scadenza, poi apri quello del bene
              setShowDeadlineDetail(false);
              setSelectedDeadline(null);
              setTimeout(() => {
                setSelectedAsset(fullAsset);
                setShowAssetDetail(true);
              }, 100);
            }
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
          onAssetPress={(asset) => {
            const fullAsset = assets.find(a => a.id === asset.id);
            if (fullAsset) {
              // Chiudi prima il modal del documento, poi apri quello del bene
              setShowDocumentDetail(false);
              setSelectedDocument(null);
              setTimeout(() => {
                setSelectedAsset(fullAsset);
                setShowAssetDetail(true);
              }, 100);
            }
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

      <EditAssetModal
        visible={showEditAsset}
        asset={selectedAsset}
        onClose={() => {
          setShowEditAsset(false);
        }}
        onUpdate={async () => {
          await load();
          setShowEditAsset(false);
          setSelectedAsset(null);
        }}
      />
    </SafeAreaView>
  );
} 