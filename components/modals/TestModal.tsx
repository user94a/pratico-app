import React from 'react';
import { Modal, Text, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface TestModalProps {
  visible: boolean;
  onClose: () => void;
}

export function TestModal({ visible, onClose }: TestModalProps) {
  console.log('TestModal rendered, visible:', visible);
  
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ flex: 1, padding: 16, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 24, marginBottom: 20 }}>Modal di Test</Text>
          <Text style={{ fontSize: 16, marginBottom: 20 }}>Se vedi questo, il modal funziona!</Text>
          <Pressable
            onPress={onClose}
            style={{
              padding: 16,
              backgroundColor: '#0a84ff',
              borderRadius: 8
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16 }}>Chiudi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
