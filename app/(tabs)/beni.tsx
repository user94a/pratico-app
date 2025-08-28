
import { AddAssetModal } from '@/components/modals/AddAssetModal';
import { Colors } from '@/constants/Colors';
import { getAssets } from '@/lib/api';
import { Asset } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, Text, View, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function BeniScreen() {
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadAssets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAssets();
      setAssets(data);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile caricare i beni. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => loadAssets() },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAssets();
    setRefreshing(false);
  }, [loadAssets]);

  useFocusEffect(
    useCallback(() => {
      loadAssets();
    }, [loadAssets])
  );

  const handleAssetCreated = (newAsset: Asset) => {
    setAssets(prev => [newAsset, ...prev]);
  };

  const handleAssetPress = (asset: Asset) => {
    router.push(`/asset-detail?id=${asset.id}`);
  };

  const filteredAssets = assets.filter(asset => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = asset.name.toLowerCase().includes(searchLower);
    const identifierMatch = asset.identifier && asset.identifier.toLowerCase().includes(searchLower);
    const categoryMatch = asset.asset_category?.name && asset.asset_category.name.toLowerCase().includes(searchLower);
    const typeMatch = asset.asset_type?.name && asset.asset_type.name.toLowerCase().includes(searchLower);
    return nameMatch || identifierMatch || categoryMatch || typeMatch;
  });

  const renderAsset = ({ item }: { item: Asset }) => (
    <Pressable
      onPress={() => handleAssetPress(item)}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: Colors.light.tint,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12
        }}>
          <Ionicons 
            name={(item.asset_type?.icon || item.asset_category?.icon || 'cube') as any} 
            size={24} 
            color="#fff" 
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 4 }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 2 }}>
            {item.asset_type?.description || item.asset_type?.name} • {item.asset_category?.description || item.asset_category?.name}
          </Text>
          {item.identifier && (
            <Text style={{ fontSize: 12, color: '#999' }}>
              {item.identifier}
            </Text>
          )}
        </View>
        
        <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
      </View>
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f7' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Caricamento beni...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f2f2f7' }}>
      <View style={{ flex: 1, padding: 16 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: 24 
        }}>
          <Text style={{ fontSize: 28, fontWeight: '800' }}>
            I miei beni
          </Text>
          <Pressable
            onPress={() => setShowAddModal(true)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: Colors.light.tint,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 4
            }}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Barra di ricerca */}
        <View style={{ paddingHorizontal: 0, paddingBottom: 8 }}>
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
                color: '#000000',
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

        {assets.length === 0 ? (
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingHorizontal: 32
          }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#e5e5ea',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              <Ionicons name="cube-outline" size={32} color="#999" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
              Nessun bene ancora
            </Text>
            <Text style={{ fontSize: 16, color: '#666', textAlign: 'center', lineHeight: 24 }}>
              Inizia ad aggiungere i tuoi beni per tenerli tracciati e gestire le relative scadenze
            </Text>
            <Pressable
              onPress={() => setShowAddModal(true)}
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: Colors.light.tint,
                borderRadius: 8
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                Aggiungi il primo bene
              </Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredAssets}
            renderItem={renderAsset}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      <AddAssetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAssetCreated}
      />
    </SafeAreaView>
  );
} 