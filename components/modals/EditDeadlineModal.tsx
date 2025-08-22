import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import { Deadline } from '@/lib/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface EditDeadlineModalProps {
  visible: boolean;
  deadline: Deadline | null;
  onClose: () => void;
  onSave: (updatedDeadline: Deadline) => void;
}

export function EditDeadlineModal({ visible, deadline, onClose, onSave }: EditDeadlineModalProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentDeadline, setCurrentDeadline] = useState<Deadline | null>(null);

    useEffect(() => {
    if (visible && deadline) {
      setTitle(deadline.title);
      setNotes(deadline.notes || '');
      setDueDate(deadline.due_at);
      setCurrentDeadline(deadline);
    }
  }, [visible, deadline]);



  const handleSave = async () => {
    if (!deadline || !title.trim()) {
      Alert.alert('Errore', 'Il titolo è obbligatorio');
      return;
    }

    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('deadlines')
        .update({
          title: title.trim(),
          notes: notes.trim() || null,
          due_at: dueDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', deadline.id)
        .select(`
          *,
          asset:assets(id, name, type)
        `)
        .single();

      if (error) throw error;

      onSave(data);
      onClose();
      Alert.alert('Successo', 'Scadenza aggiornata con successo');
    } catch (error) {
      console.error('Error updating deadline:', error);
      Alert.alert('Errore', 'Impossibile salvare le modifiche');
    } finally {
      setSaving(false);
    }
  };

    const handleCancel = () => {
    // Ripristina i valori originali
    if (deadline) {
      setTitle(deadline.title);
      setNotes(deadline.notes || '');
      setDueDate(deadline.due_at);
    }
    onClose();
  };

  const handleDateSelection = () => {
    // Imposta la data corrente se non c'è già una data selezionata
    if (dueDate) {
      setSelectedDate(new Date(dueDate));
    }
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (date) {
      setSelectedDate(date);
      if (Platform.OS === 'android') {
        setDueDate(date.toISOString().split('T')[0]);
      }
    }
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const parseDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  if (!deadline) return null;

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
            onPress={handleCancel}
            style={{ opacity: saving ? 0.5 : 1 }}
            disabled={saving}
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
            Modifica Scadenza
          </Text>

          <Pressable
            onPress={handleSave}
            disabled={saving || !title.trim()}
            style={{ opacity: (saving || !title.trim()) ? 0.5 : 1 }}
          >
            <Text style={{ 
              fontSize: 16, 
              color: Colors.light.tint, 
              fontWeight: '600' 
            }}>
              {saving ? 'Salva...' : 'Salva'}
            </Text>
          </Pressable>
        </View>

        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Titolo */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8
            }}>
              Titolo *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={{
                backgroundColor: Colors.light.cardBackground,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.border
              }}
              placeholder="Inserisci il titolo della scadenza"
              placeholderTextColor={Colors.light.textSecondary}
            />
          </View>

          {/* Data Scadenza */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8
            }}>
              Data Scadenza *
            </Text>
            <Pressable
              onPress={handleDateSelection}
              style={{
                backgroundColor: Colors.light.cardBackground,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: Colors.light.border,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={{
                  width: 29,
                  height: 29,
                  borderRadius: 6,
                  backgroundColor: Colors.light.tint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <MaterialCommunityIcons name="calendar" size={18} color="#fff" />
                </View>
                <Text style={{
                  fontSize: 16,
                  color: dueDate ? Colors.light.text : Colors.light.textSecondary
                }}>
                  {dueDate ? new Date(dueDate).toLocaleDateString('it-IT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Seleziona data'}
                </Text>
              </View>
              <MaterialCommunityIcons 
                name="chevron-down" 
                size={20} 
                color={Colors.light.textSecondary} 
              />
            </Pressable>
          </View>



          {/* Note */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: Colors.light.text,
              marginBottom: 8
            }}>
              Note
            </Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              style={{
                backgroundColor: Colors.light.cardBackground,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: Colors.light.text,
                borderWidth: 1,
                borderColor: Colors.light.border,
                textAlignVertical: 'top',
                minHeight: 100
              }}
              placeholder="Aggiungi note..."
              placeholderTextColor={Colors.light.textSecondary}
              multiline
            />
          </View>


        </ScrollView>



        {/* Date Picker nativo */}
        {showDatePicker && (
          <View style={{
            backgroundColor: Colors.light.cardBackground,
            borderTopWidth: 1,
            borderTopColor: Colors.light.border,
            paddingTop: 20,
            paddingBottom: Platform.OS === 'ios' ? 40 : 20
          }}>
            {Platform.OS === 'ios' && (
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                paddingBottom: 10
              }}>
                <Pressable onPress={() => setShowDatePicker(false)}>
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
                  Seleziona Data
                </Text>
                <Pressable onPress={() => {
                  setDueDate(selectedDate.toISOString().split('T')[0]);
                  setShowDatePicker(false);
                }}>
                  <Text style={{
                    fontSize: 16,
                    color: Colors.light.tint,
                    fontWeight: '600'
                  }}>
                    Fatto
                  </Text>
                </Pressable>
              </View>
            )}
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date(2100, 11, 31)}
              minimumDate={new Date(2020, 0, 1)}
              locale="it-IT"
              textColor={Colors.light.text}
              style={{
                backgroundColor: Colors.light.cardBackground,
                height: Platform.OS === 'ios' ? 200 : 'auto'
              }}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
} 