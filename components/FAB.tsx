import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

export function FAB({ onAddBene, onAddScadenza, onAddDocumento }: {
  onAddBene: () => void;
  onAddScadenza: () => void;
  onAddDocumento: () => void;
}) {
  const [open, setOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      // Animazione di apertura
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animazione di chiusura
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [open]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  return (
    <>
      <View style={{ position: 'absolute', right: 16, bottom: 24, alignItems: 'flex-end', gap: 8 }}>
        {/* Menu azioni */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: '#e5e5ea',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
          pointerEvents={open ? 'auto' : 'none'}
        >
          <Pressable 
            onPress={() => { setOpen(false); onAddBene(); }}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 12, 
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              minWidth: 160
            }}
          >
            <Ionicons name="home" size={20} color="#0a84ff" />
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Aggiungi bene</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#f2f2f7', marginVertical: 4 }} />

          <Pressable 
            onPress={() => { setOpen(false); onAddScadenza(); }}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 12, 
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              minWidth: 160
            }}
          >
            <Ionicons name="time" size={20} color="#0a84ff" />
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Aggiungi scadenza</Text>
          </Pressable>

          <View style={{ height: 1, backgroundColor: '#f2f2f7', marginVertical: 4 }} />

          <Pressable 
            onPress={() => { setOpen(false); onAddDocumento(); }}
            style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              gap: 12, 
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              minWidth: 160
            }}
          >
            <Ionicons name="document-text" size={20} color="#0a84ff" />
            <Text style={{ fontSize: 16, fontWeight: '600' }}>Aggiungi documento</Text>
          </Pressable>
        </Animated.View>

        {/* Bottone principale */}
        <Pressable
          onPress={() => setOpen(!open)}
          style={{ 
            backgroundColor: '#0a84ff', 
            width: 56, 
            height: 56, 
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowOpacity: 0,
            shadowRadius: 0,
            shadowOffset: { width: 0, height: 0 },
            elevation: 0,
          }}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 24 }}>+</Text>
          </Animated.View>
        </Pressable>
      </View>
    </>
  );
} 