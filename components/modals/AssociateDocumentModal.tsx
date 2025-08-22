import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Document } from '@/lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AssociateDocumentModalProps {
  visible: boolean;
  deadlineId: string;
  onClose: () => void;
  onAssociate: (documentId: string) => void;
}

export function AssociateDocumentModal({ visible, deadlineId, onClose, onAssociate }: AssociateDocumentModalProps) {
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [associating, setAssociating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (visible) {
      loadAvailableDocuments();
    }
  }, [visible]);

  const loadAvailableDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('title');

      if (error) throw error;
      setAvailableDocuments(data || []);
      setFilteredDocuments(data || []);
    } catch (error) {
      console.error('Error loading documents:', error);
      Alert.alert('Errore', 'Impossibile caricare i documenti');
    } finally {
      setLoading(false);
    }
  };

  // Filtra i documenti in base alla ricerca
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDocuments(availableDocuments);
    } else {
      const filtered = availableDocuments.filter(document =>
        document.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (document.description && document.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDocuments(filtered);
    }
  }, [searchQuery, availableDocuments]);

  const handleAssociateDocument = async (document: Document) => {
    try {
      setAssociating(true);
      const { error } = await supabase
        .from('deadline_documents')
        .insert({
          deadline_id: deadlineId,
          document_id: document.id
        });

      if (error) throw error;

      onAssociate(document.id);
      onClose();
      Alert.alert('Successo', `Documento "${document.title}" associato con successo`);
    } catch (error) {
      console.error('Error associating document:', error);
      Alert.alert('Errore', 'Impossibile associare il documento');
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
            Associa Documento
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
              placeholder="Cerca documenti..."
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
                Caricamento documenti...
              </Text>
            </View>
          ) : filteredDocuments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{
                fontSize: 16,
                color: Colors.light.textSecondary
              }}>
                {searchQuery.trim() === '' ? 'Nessun documento disponibile' : 'Nessun documento trovato'}
              </Text>
            </View>
          ) : (
            filteredDocuments.map((document) => (
              <Pressable
                key={document.id}
                onPress={() => handleAssociateDocument(document)}
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
                  <MaterialCommunityIcons name="file-document" size={18} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: Colors.light.text
                  }}>
                    {document.title}
                  </Text>
                  {document.description && (
                    <Text style={{
                      fontSize: 14,
                      color: Colors.light.textSecondary,
                      marginTop: 2
                    }}>
                      {document.description}
                    </Text>
                  )}
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
