import { Colors } from '@/constants/Colors';
import { getAssetCategories, getAssetTypesByCategory } from '@/lib/api';
import { AssetCategory, AssetType } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AssetCategoryTypeModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: AssetCategory, type: AssetType) => void;
}

export function AssetCategoryTypeModal({ visible, onClose, onSelect }: AssetCategoryTypeModalProps) {
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);

  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  useEffect(() => {
    if (selectedCategory) {
      loadTypes(selectedCategory.id);
    }
  }, [selectedCategory]);

  async function loadCategories() {
    try {
      console.log('Loading categories...');
      setLoading(true);
      const data = await getAssetCategories();
      console.log('Categories loaded:', data);
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile caricare le categorie. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => loadCategories() },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadTypes(categoryId: string) {
    try {
      setLoadingTypes(true);
      const data = await getAssetTypesByCategory(categoryId);
      setTypes(data);
    } catch (error: any) {
      console.error('Error loading types:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile caricare i tipi. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => loadTypes(categoryId) },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    } finally {
      setLoadingTypes(false);
    }
  }

  function handleCategorySelect(category: AssetCategory) {
    setSelectedCategory(category);
  }

  function handleTypeSelect(type: AssetType) {
    if (selectedCategory) {
      onSelect(selectedCategory, type);
      onClose();
    }
  }

  function handleClose() {
    setSelectedCategory(null);
    setTypes([]);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {console.log('AssetCategoryTypeModal Modal component rendered, visible:', visible)}
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 24 
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700' }}>
              {selectedCategory ? 'Seleziona tipo' : 'Seleziona categoria'}
            </Text>
            <Pressable
              onPress={handleClose}
              style={{ 
                padding: 8,
                backgroundColor: '#f2f2f7',
                borderRadius: 8
              }}
            >
              <Ionicons name="close" size={18} color="#666" />
            </Pressable>
          </View>

          {selectedCategory && (
            <Pressable
              onPress={() => setSelectedCategory(null)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                backgroundColor: '#f2f2f7',
                borderRadius: 12,
                marginBottom: 16
              }}
            >
              <Ionicons name="arrow-back" size={16} color="#666" />
              <Text style={{ marginLeft: 8, color: '#666' }}>
                Torna alle categorie
              </Text>
            </Pressable>
          )}

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={{ marginTop: 16, color: '#666' }}>Caricamento categorie...</Text>
              </View>
            ) : selectedCategory ? (
              // Mostra i tipi della categoria selezionata
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
                  {selectedCategory.description || selectedCategory.name}
                </Text>
                
                {loadingTypes ? (
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.light.tint} />
                    <Text style={{ marginTop: 16, color: '#666' }}>Caricamento tipi...</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {types.map((type) => (
                      <Pressable
                        key={type.id}
                        onPress={() => handleTypeSelect(type)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 16,
                          backgroundColor: '#f2f2f7',
                          borderRadius: 12
                        }}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: Colors.light.tint,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12
                        }}>
                          <Ionicons name={type.icon as any} size={20} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600' }}>
                            {type.description || type.name}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#666" />
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            ) : (
              // Mostra le categorie
              <View style={{ gap: 12 }}>
                {categories.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => handleCategorySelect(category)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 16,
                      backgroundColor: '#f2f2f7',
                      borderRadius: 12
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: Colors.light.tint,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}>
                      <Ionicons name={category.icon as any} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '600' }}>
                        {category.description || category.name}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#666" />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
