import { Colors } from '@/constants/Colors';
import { AVAILABLE_ICONS } from '@/lib/assetIcons';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface IconPickerModalProps {
  visible: boolean;
  currentIcon?: string | null;
  onSelect: (iconKey: string) => void;
  onClose: () => void;
}

export function IconPickerModal({ visible, currentIcon, onSelect, onClose }: IconPickerModalProps) {
  // Convertiamo la lista di icone in oggetti con key e name
  const iconsList = AVAILABLE_ICONS.map(icon => ({ key: icon, name: icon }));

  const renderIcon = ({ item }: { item: { key: string; name: string } }) => {
    const isSelected = currentIcon === item.key;
    
    return (
      <Pressable
        onPress={() => onSelect(item.key)}
        style={{
          width: 60,
          height: 60,
          margin: 8,
          borderRadius: 12,
          backgroundColor: isSelected ? Colors.light.tint : Colors.light.cardBackground,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? Colors.light.tint : Colors.light.border,
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Ionicons 
          name={item.key as any} 
          size={24} 
          color={isSelected ? '#fff' : Colors.light.text} 
        />
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        <View style={{ flex: 1, padding: 16 }}>
          {/* Header */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: 24 
          }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: Colors.light.text }}>
              Scegli Icona
            </Text>
            <Pressable
              onPress={onClose}
              style={{ 
                width: 36,
                height: 36,
                backgroundColor: Colors.light.cardBackground,
                borderRadius: 18,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="close" size={18} color={Colors.light.textSecondary} />
            </Pressable>
          </View>

          {/* Pulsante Reset */}
          <Pressable
            onPress={() => onSelect('')}
            style={{
              padding: 16,
              backgroundColor: currentIcon ? Colors.light.cardBackground : Colors.light.tint,
              borderRadius: 12,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Ionicons 
              name="refresh" 
              size={16} 
              color={currentIcon ? Colors.light.textSecondary : '#fff'} 
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: currentIcon ? Colors.light.textSecondary : '#fff'
            }}>
              Usa icona predefinita
            </Text>
          </Pressable>

          {/* Griglia Icone */}
          <FlatList
            data={iconsList}
            renderItem={renderIcon}
            keyExtractor={(item) => item.key}
            numColumns={4}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            columnWrapperStyle={{ justifyContent: 'space-around' }}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
} 