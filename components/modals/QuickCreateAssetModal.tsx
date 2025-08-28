import { IconPickerModal } from '@/components/IconPickerModal';
import { Colors } from '@/constants/Colors';
import { createAsset } from '@/lib/api';
import { Asset } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ASSET_TYPES = ['vehicles', 'properties', 'animals', 'people', 'devices', 'subscriptions', 'other'] as const;
const ASSET_TYPE_LABELS: Record<typeof ASSET_TYPES[number], string> = {
  vehicles: 'Veicoli',
  properties: 'Immobili',
  animals: 'Animali',
  people: 'Persone',
  devices: 'Dispositivi',
  subscriptions: 'Abbonamenti',
  other: 'Altro'
};

interface QuickCreateAssetModalProps {
  visible: boolean;
  onClose: () => void;
  onAssetCreated: (asset: Asset) => void;
}

export function QuickCreateAssetModal({ visible, onClose, onAssetCreated }: QuickCreateAssetModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<typeof ASSET_TYPES[number]>('vehicles');
  const [identifier, setIdentifier] = useState('');
  const [customIcon, setCustomIcon] = useState<string | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setName('');
    setType('vehicles');
    setIdentifier('');
    setCustomIcon(null);
    setSaving(false);
  }

  async function handleSave() {
    if (!name.trim()) {
      return Alert.alert('Errore', 'Il nome del bene è richiesto');
    }

    console.log('=== DEBUG ASSET CREATION ===');
    console.log('Current type state:', type);
    console.log('Type is defined:', typeof type !== 'undefined');
    console.log('Type is not null:', type !== null);
    console.log('Type is not empty:', type !== '');

    // Mappa i tipi del frontend ai tipi del backend
    const typeMapping: Record<string, string> = {
      vehicles: 'auto',
      properties: 'casa',
      animals: 'altro',
      people: 'persona',
      devices: 'altro',
      subscriptions: 'altro',
      other: 'altro'
    };

    const mappedType = typeMapping[type] || 'altro';
    console.log('Mapped type:', mappedType);

    const assetData = {
      name: name.trim(),
      asset_type: mappedType,
      identifier: identifier.trim() || null,
      custom_icon: customIcon
    };

    console.log('Final asset data:', assetData);
    console.log('Asset type in data:', assetData.asset_type);
    console.log('=== END DEBUG ===');

    try {
      setSaving(true);
      const newAsset = await createAsset(assetData);
      
      // Ritorna l'asset creato al parent
      onAssetCreated(newAsset);
      reset();
    } catch (error: any) {
      console.error('Error in handleSave:', error);
      Alert.alert('Errore', error.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

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
                />
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12, color: '#333' }}>
                  Tipo bene
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  {ASSET_TYPES.map((assetType) => {
                    const typeIcons = {
                      vehicles: 'car',
                      properties: 'home',
                      animals: 'paw',
                      people: 'person',
                      devices: 'phone-portrait',
                      subscriptions: 'card',
                      other: 'cube'
                    };

                    return (
                      <Pressable
                        key={assetType}
                        onPress={() => setType(assetType)}
                        style={{
                          minWidth: 80,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: type === assetType ? '#0a84ff' : '#fff',
                          borderWidth: 1,
                          borderColor: type === assetType ? '#0a84ff' : '#e5e5ea',
                          alignItems: 'center'
                        }}
                      >
                        <Ionicons 
                          name={typeIcons[assetType] as any} 
                          size={24} 
                          color={type === assetType ? '#fff' : '#0a84ff'} 
                        />
                        <Text style={{
                          color: type === assetType ? '#fff' : '#000',
                          fontSize: 12,
                          fontWeight: '600',
                          marginTop: 4,
                          textAlign: 'center'
                        }}>
                          {ASSET_TYPE_LABELS[assetType]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Icona (opzionale)
                </Text>
                
                <Pressable
                  onPress={() => setShowIconPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 12,
                    backgroundColor: '#f2f2f7',
                    borderRadius: 12,
                    justifyContent: 'space-between'
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: Colors.light.tint,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Ionicons 
                        name={(customIcon || (type === 'vehicles' ? 'car' : type === 'properties' ? 'home' : type === 'animals' ? 'paw' : type === 'people' ? 'person' : type === 'devices' ? 'phone-portrait' : type === 'subscriptions' ? 'card' : 'cube')) as any} 
                        size={18} 
                        color="#fff" 
                      />
                    </View>
                    <Text style={{ color: '#333' }}>
                      {customIcon ? 'Icona personalizzata' : 'Icona predefinita'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </Pressable>
              </View>

              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Identificativo
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  {type === 'vehicles' ? 'Targa (es: AB123CD)' : type === 'properties' ? 'Indirizzo' : 'Codice o identificativo'} (opzionale)
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
              disabled={saving}
              style={{ 
                flex: 1, 
                padding: 16, 
                borderRadius: 12,
                backgroundColor: '#0a84ff',
                alignItems: 'center',
                opacity: saving ? 0.5 : 1
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {saving ? 'Salvo...' : 'Salva'}
              </Text>
            </Pressable>
          </View>
        </View>

        <IconPickerModal
          visible={showIconPicker}
          onClose={() => setShowIconPicker(false)}
          onSelect={(icon: string) => {
            setCustomIcon(icon);
            setShowIconPicker(false);
          }}
          currentIcon={customIcon}
        />
      </SafeAreaView>
    </Modal>
  );
} 