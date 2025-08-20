import { createDocument } from '@/lib/api';
import { Document } from '@/lib/types';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface QuickCreateDocumentModalProps {
  visible: boolean;
  onClose: () => void;
  onDocumentCreated: (document: Document) => void;
}

export function QuickCreateDocumentModal({ visible, onClose, onDocumentCreated }: QuickCreateDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);

  function reset() {
    setTitle('');
    setTags('');
    setSaving(false);
  }

  async function handleSave() {
    if (!title.trim()) {
      return Alert.alert('Errore', 'Il titolo del documento è richiesto');
    }

    try {
      setSaving(true);
      const newDocument = await createDocument({
        title: title.trim(),
        tags: tags.trim() || undefined,
        assetId: undefined,
        storagePath: undefined
      });
      
      // Ritorna il documento creato al parent
      onDocumentCreated(newDocument);
      reset();
    } catch (error: any) {
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
              Nuovo documento
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

          <View style={{ gap: 16, flex: 1 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                Titolo documento
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
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
                Tag
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                Aggiungi tag separati da virgola (opzionale)
              </Text>
              <TextInput
                value={tags}
                onChangeText={setTags}
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
      </SafeAreaView>
    </Modal>
  );
} 