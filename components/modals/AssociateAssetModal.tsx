import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import { Asset } from '@/lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AssociateAssetModalProps {
  visible: boolean;
  deadlineId: string;
  onClose: () => void;
  onAssociate: (assetId: string) => void;
}

export function AssociateAssetModal({ visible, deadlineId, onClose, onAssociate }: AssociateAssetModalProps) {
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [associating, setAssociating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadAvailableAssets();
    }
  }, [visible]);

  const loadAvailableAssets = async () => {
    try {
      setLoading(true);
      const { data, error } = await api
        .from('assets')
        .select('*')
        .order('name');

      if (error) throw error;
      setAvailableAssets(data || []);
      setFilteredAssets(data || []);
    } catch (error) {
      console.error('Error loading assets:', error);
      Alert.alert('Errore', 'Impossibile caricare i beni');
    } finally {
      setLoading(false);
    }
  };

  // Filtra i beni in base alla ricerca
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAssets(availableAssets);
    } else {
      const filtered = availableAssets.filter(asset =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAssets(filtered);
    }
  }, [searchQuery, availableAssets]);

  const handleAssociateAsset = async (asset: Asset) => {
    try {
      setAssociating(true);
      const { error } = await api
        .from('deadline_assets')
        .insert({
          deadline_id: deadlineId,
          asset_id: asset.id
        });

      if (error) throw error;

      onAssociate(asset.id);
      onClose();
      Alert.alert('Successo', `Bene "${asset.name}" associato con successo`);
    } catch (error) {
      console.error('Error associating asset:', error);
      Alert.alert('Errore', 'Impossibile associare il bene');
    } finally {
      setAssociating(false);
    }
  };

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
          <Pressable
            onPress={onClose}
            style={{ opacity: associating ? 0.5 : 1 }}
            disabled={associating}
          >
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
            Associa Bene
          </Text>

          <View style={{ width: 60 }} />
        </View>

        {/* Campo di ricerca */}
        <View style={{ padding: 16, paddingBottom: 8 }}>
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: Colors.light.border,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12
          }}>
            <MaterialCommunityIcons name="magnify" size={20} color={Colors.light.textSecondary} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{
                flex: 1,
                paddingVertical: 12,
                paddingHorizontal: 8,
                fontSize: 16,
                color: Colors.light.text
              }}
              placeholder="Cerca beni..."
              placeholderTextColor={Colors.light.textSecondary}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close" size={20} color={Colors.light.textSecondary} />
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{
                fontSize: 16,
                color: Colors.light.textSecondary
              }}>
                Caricamento beni...
              </Text>
            </View>
          ) : filteredAssets.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{
                fontSize: 16,
                color: Colors.light.textSecondary
              }}>
                {searchQuery.trim() === '' ? 'Nessun bene disponibile' : 'Nessun bene trovato'}
              </Text>
            </View>
          ) : (
            filteredAssets.map((asset) => (
              <Pressable
                key={asset.id}
                onPress={() => handleAssociateAsset(asset)}
                disabled={associating}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: Colors.light.border,
                  opacity: associating ? 0.5 : 1
                }}
              >
                <View style={{
                  width: 29,
                  height: 29,
                  borderRadius: 6,
                  backgroundColor: Colors.light.tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <MaterialCommunityIcons 
                    name={asset.type === 'vehicle' ? 'car' : asset.type === 'home' ? 'home' : 'cube'} 
                    size={18} 
                    color="#fff" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: Colors.light.text
                  }}>
                    {asset.name}
                  </Text>
                  <Text style={{
                    fontSize: 14,
                    color: Colors.light.textSecondary,
                    marginTop: 2
                  }}>
                    {asset.type === 'vehicle' ? 'Veicolo' : asset.type === 'home' ? 'Casa' : 'Altro'}
                  </Text>
                </View>
                <MaterialCommunityIcons 
                  name="plus" 
                  size={20} 
                  color={Colors.light.tint} 
                />
              </Pressable>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
