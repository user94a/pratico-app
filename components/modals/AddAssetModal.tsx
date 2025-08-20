import { IconPickerModal } from '@/components/IconPickerModal';
import { Colors } from '@/constants/Colors';
import { SF_SYMBOLS } from '@/constants/SFSymbols';
import { useCreateAssetWithTemplates } from '@/lib/hooks/useCreateAssetWithTemplates';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
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

export function AddAssetModal({ visible, onClose, onSubmit }: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: { asset: any; deadlines_created: number }) => void;
}) {
  const [type, setType] = useState<typeof ASSET_TYPES[number]>('vehicles');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [customIcon, setCustomIcon] = useState<string>('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const { createAsset, isLoading, error } = useCreateAssetWithTemplates();

  const handleSubmit = async () => {
    try {
      const result = await createAsset({
        type,
        name,
        identifier: identifier || undefined,
        custom_icon: customIcon || undefined
      });
      onSubmit(result);
      // Reset form
      setType('vehicles');
      setName('');
      setIdentifier('');
      setCustomIcon('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 28, fontWeight: '800', marginBottom: 24 }}>Aggiungi bene</Text>
            
            <View style={{ gap: 16, flex: 1 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Tipo di bene
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
                >
                  {ASSET_TYPES.map(t => (
                    <Pressable 
                      key={t} 
                      onPress={() => setType(t)} 
                      style={{ 
                        padding: 10, 
                        borderRadius: 999, 
                        backgroundColor: type === t ? '#0a84ff' : '#e5e5ea'
                      }}
                    >
                      <Text style={{ 
                        color: type === t ? '#fff' : '#000'
                      }}>
                        {ASSET_TYPE_LABELS[t]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              
              <View>
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Nome del bene
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
                <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                  Identificativo
                </Text>
                <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                  {type === 'vehicles' ? 'Targa (es: AB123CD)' : 
                   type === 'properties' ? 'Indirizzo' : 
                   type === 'animals' ? 'Codice microchip o nome' :
                   type === 'people' ? 'Codice fiscale o documento' :
                   type === 'devices' ? 'Numero di serie o IMEI' :
                   type === 'subscriptions' ? 'Codice abbonamento' :
                   'Codice o identificativo'} (opzionale)
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

              {error && (
                <Text style={{ color: 'red' }}>{error}</Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 12, paddingTop: 24 }}>
              <Pressable 
                onPress={onClose} 
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
                onPress={handleSubmit}
                disabled={isLoading || !name || !type} 
                style={{ 
                  flex: 1, 
                  padding: 16, 
                  borderRadius: 12, 
                  backgroundColor: !name || !type ? '#e5e5ea' : '#0a84ff',
                  alignItems: 'center',
                  opacity: isLoading ? 0.5 : 1
                }}
              >
                <Text style={{ 
                  fontWeight: '600',
                  color: !name || !type ? '#000' : '#fff' 
                }}>
                  {isLoading ? 'Creazione...' : 'Crea'}
                </Text>
          </Pressable>
        </View>
      </View>
        </ScrollView>

        {/* Modal per selezione icona */}
        <IconPickerModal
          visible={showIconPicker}
          category={type as keyof typeof SF_SYMBOLS}
          currentIcon={customIcon}
          onSelect={(iconKey: string) => {
            setCustomIcon(iconKey);
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      </SafeAreaView>
    </Modal>
  );
} 