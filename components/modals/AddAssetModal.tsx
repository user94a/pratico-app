import { Colors } from '@/constants/Colors';
import { createAsset, getAssetCategories, getAssetTypesByCategory } from '@/lib/api';
import { Asset, AssetCategory, AssetType } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (asset: Asset) => void;
}

export function AddAssetModal({ visible, onClose, onSubmit }: AddAssetModalProps) {
  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [selectedType, setSelectedType] = useState<AssetType | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Stati per le categorie e i tipi
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [types, setTypes] = useState<AssetType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Carica le categorie quando il modal si apre
  useEffect(() => {
    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // Carica i tipi quando viene selezionata una categoria
  useEffect(() => {
    if (selectedCategory) {
      loadTypes(selectedCategory.id);
    }
  }, [selectedCategory]);

  async function loadCategories() {
    try {
      setLoadingCategories(true);
      const data = await getAssetCategories();
      setCategories(data);
    } catch (error: any) {
      console.error('Error loading categories:', error);
      Alert.alert('Errore', 'Impossibile caricare le categorie');
    } finally {
      setLoadingCategories(false);
    }
  }

  async function loadTypes(categoryId: string) {
    try {
      setLoadingTypes(true);
      const data = await getAssetTypesByCategory(categoryId);
      setTypes(data);
    } catch (error: any) {
      console.error('Error loading types:', error);
      Alert.alert('Errore', 'Impossibile caricare i tipi');
    } finally {
      setLoadingTypes(false);
    }
  }

  function reset() {
    setName('');
    setSelectedCategory(null);
    setSelectedType(null);
    setIdentifier('');
    setCustomIcon(null);
    setSaving(false);
    setShowCategorySelection(false);
    setShowTypeSelection(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      return Alert.alert('Errore', 'Il nome del bene è richiesto');
    }

    if (!selectedCategory || !selectedType) {
      return Alert.alert('Errore', 'Seleziona una categoria e un tipo di bene');
    }

    const assetData = {
      name: name.trim(),
      asset_category_id: selectedCategory.id,
      asset_type_id: selectedType.id,
      identifier: identifier.trim() || null,
      custom_icon: customIcon
    };

    try {
      setSaving(true);
      const newAsset = await createAsset(assetData);
      onSubmit(newAsset);
      reset();
      onClose();
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      Alert.alert(
        'Errore di connessione', 
        error.message || 'Impossibile creare il bene. Verifica la tua connessione internet.',
        [
          { text: 'Riprova', onPress: () => handleSave() },
          { text: 'Annulla', style: 'cancel' }
        ]
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCategorySelect(category: AssetCategory) {
    setSelectedCategory(category);
    setSelectedType(null);
    setShowCategorySelection(false);
    setShowTypeSelection(true);
  }

  function handleTypeSelect(type: AssetType) {
    setSelectedType(type);
    setShowTypeSelection(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function getIdentifierPlaceholder(): string {
    if (!selectedType) return 'Identificativo (opzionale)';
    
    const placeholders: Record<string, string> = {
      car: 'Targa (es: AB123CD)',
      motorcycle: 'Targa (es: AB123CD)',
      scooter: 'Targa (es: AB123CD)',
      bicycle: 'Numero telaio',
      boat: 'Numero matricola',
      rv: 'Targa (es: AB123CD)',
      primary_home: 'Indirizzo',
      secondary_home: 'Indirizzo',
      vacation_home: 'Indirizzo',
      rental_apartment: 'Indirizzo',
      garage: 'Indirizzo',
      cellar: 'Indirizzo',
      smartphone: 'IMEI o numero serie',
      laptop: 'Numero serie',
      tablet: 'Numero serie',
      smartwatch: 'Numero serie',
      console: 'Numero serie',
      printer: 'Numero serie',
      dog: 'Microchip o pedigree',
      cat: 'Microchip o pedigree',
      rabbit: 'Microchip',
      horse: 'Passaporto equino',
      bird: 'Anello identificativo',
      child: 'Codice fiscale',
      partner: 'Codice fiscale',
      parent: 'Codice fiscale',
      grandparent: 'Codice fiscale',
      care_person: 'Codice fiscale',
      gym: 'Numero abbonamento',
      streaming: 'Numero abbonamento',
      software: 'Numero licenza',
      insurance: 'Numero polizza',
      furniture: 'Numero inventario',
      jewelry: 'Numero inventario',
      art: 'Numero inventario',
      collectibles: 'Numero inventario'
    };

    return placeholders[selectedType.name] || 'Identificativo (opzionale)';
  }

  // Se stiamo mostrando la selezione delle categorie
  if (showCategorySelection) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24 
            }}>
              <Text style={{ fontSize: 24, fontWeight: '700' }}>
                Seleziona categoria
              </Text>
              <Pressable
                onPress={() => setShowCategorySelection(false)}
                style={{ 
                  padding: 8,
                  backgroundColor: '#f2f2f7',
                  borderRadius: 8
                }}
              >
                <Ionicons name="close" size={18} color="#666" />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {loadingCategories ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={Colors.light.tint} />
                  <Text style={{ marginTop: 16, color: '#666' }}>Caricamento categorie...</Text>
                </View>
              ) : (
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

  // Se stiamo mostrando la selezione dei tipi
  if (showTypeSelection) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={{ flex: 1, padding: 16 }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: 24 
            }}>
              <Text style={{ fontSize: 24, fontWeight: '700' }}>
                Seleziona tipo
              </Text>
              <Pressable
                onPress={() => setShowTypeSelection(false)}
                style={{ 
                  padding: 8,
                  backgroundColor: '#f2f2f7',
                  borderRadius: 8
                }}
              >
                <Ionicons name="close" size={18} color="#666" />
              </Pressable>
            </View>

            <Pressable
              onPress={() => setShowTypeSelection(false)}
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

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
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
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  // Modal principale per l'aggiunta del bene
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 24 
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700' }}>
              Nuovo bene
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

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Nome bene
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={{ 
                    backgroundColor: '#f2f2f7',
                    borderRadius: 12, 
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 0
                  }}
                  placeholder="Inserisci il nome del bene"
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Categoria e tipo
                </Text>
                <Pressable
                  onPress={() => setShowCategorySelection(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    backgroundColor: '#f2f2f7',
                    borderRadius: 12,
                    justifyContent: 'space-between'
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    {selectedCategory && selectedType ? (
                      <>
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: Colors.light.tint,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12
                        }}>
                          <Ionicons name={selectedType.icon as any} size={16} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '600' }}>
                            {selectedType.description || selectedType.name}
                          </Text>
                          <Text style={{ fontSize: 14, color: '#666' }}>
                            {selectedCategory.description || selectedCategory.name}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          backgroundColor: '#e5e5ea',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12
                        }}>
                          <Ionicons name="add" size={16} color="#666" />
                        </View>
                        <Text style={{ color: '#666' }}>
                          Seleziona categoria e tipo
                        </Text>
                      </>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </Pressable>
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Identificativo
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  {getIdentifierPlaceholder()}
                </Text>
                <TextInput
                  value={identifier}
                  onChangeText={setIdentifier}
                  style={{ 
                    backgroundColor: '#f2f2f7',
                    borderRadius: 12, 
                    padding: 16,
                    fontSize: 16,
                    borderWidth: 0
                  }}
                  placeholder={getIdentifierPlaceholder()}
                />
              </View>
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 12, paddingTop: 24 }}>
            <Pressable 
              onPress={handleClose}
              style={{ 
                flex: 1, 
                padding: 16, 
                borderRadius: 12,
                backgroundColor: '#f2f2f7',
                alignItems: 'center'
              }}
            >
              <Text style={{ fontWeight: '600' }}>Annulla</Text>
            </Pressable>
            
            <Pressable 
              onPress={handleSave}
              disabled={saving || !name.trim() || !selectedCategory || !selectedType}
              style={{ 
                flex: 1, 
                padding: 16, 
                borderRadius: 12,
                backgroundColor: '#0a84ff',
                alignItems: 'center',
                opacity: (saving || !name.trim() || !selectedCategory || !selectedType) ? 0.5 : 1
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {saving ? 'Salvo...' : 'Salva'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
} 