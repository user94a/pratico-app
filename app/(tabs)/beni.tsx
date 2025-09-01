
import { AddAssetModal } from '@/components/modals/AddAssetModal';
import { Colors } from '@/constants/Colors';
import { getAssets } from '@/lib/api';
import { Asset } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, Text, View, TextInput } from 'react-native';
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        justifyContent: 'space-between'
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
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
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: Colors.light.text,
            marginBottom: 6
          }}>
            {item.name}
          </Text>
          <Text style={{
            fontSize: 14,
            color: Colors.light.textSecondary,
            marginBottom: 2
          }}>
            {item.asset_type?.description || item.asset_type?.name} • {item.asset_category?.description || item.asset_category?.name}
          </Text>
          {item.identifier && (
            <Text style={{
              fontSize: 12,
              color: Colors.light.textSecondary
            }}>
              {item.identifier}
            </Text>
          )}
        </View>
      </View>
      
      <Ionicons name="chevron-forward" size={16} color="#c7c7cc" />
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
      <View style={{ flex: 1 }}>
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
            I miei beni
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
          {assets.length === 0 ? (
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
              {searchQuery ? 'Nessun bene trovato' : 'Nessun bene caricato'}
            </Text>
            {!searchQuery && (
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
            {filteredAssets.map((asset, index) => {
              const isLast = index === filteredAssets.length - 1;
              return (
                <View key={asset.id}>
                  {renderAsset({ item: asset })}
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

      <AddAssetModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAssetCreated}
      />
    </SafeAreaView>
  );
} 