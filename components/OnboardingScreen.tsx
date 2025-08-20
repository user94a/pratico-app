import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Pressable, SafeAreaView, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    icon: 'home',
    title: 'Gestisci i tuoi Beni',
    description: 'Organizza auto, case e tutti i tuoi beni importanti in un unico posto sicuro e accessibile.',
    color: Colors.light.tint
  },
  {
    icon: 'time',
    title: 'Non perdere mai una Scadenza',
    description: 'Ricevi notifiche per assicurazioni, revisioni, documenti e tutte le date importanti.',
    color: Colors.light.warning
  },
  {
    icon: 'document-text',
    title: 'Documenti sempre a portata di mano',
    description: 'Carica, organizza e accedi istantaneamente a tutti i tuoi documenti digitali.',
    color: Colors.light.success
  }
];

export function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const currentSlide = onboardingData[currentIndex];

  return (
    <SafeAreaView style={{ 
      flex: 1, 
      backgroundColor: Colors.light.background 
    }}>
      <View style={{ flex: 1 }}>
        {/* Skip Button */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'flex-end', 
          paddingHorizontal: 20, 
          paddingTop: 20 
        }}>
          <Pressable onPress={handleSkip}>
            <Text style={{ 
              color: Colors.light.textSecondary, 
              fontSize: 16,
              fontWeight: '500'
            }}>
              Salta
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ 
          flex: 1, 
          alignItems: 'center', 
          justifyContent: 'center',
          paddingHorizontal: 40
        }}>
          {/* Icon */}
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: Colors.light.cardBackground,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
            shadowColor: currentSlide.color,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 24,
            elevation: 8
          }}>
            <Ionicons 
              name={currentSlide.icon as any} 
              size={60} 
              color={currentSlide.color} 
            />
          </View>

          {/* Title */}
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: Colors.light.text,
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 34
          }}>
            {currentSlide.title}
          </Text>

          {/* Description */}
          <Text style={{
            fontSize: 17,
            color: Colors.light.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
            marginBottom: 60
          }}>
            {currentSlide.description}
          </Text>
        </View>

        {/* Bottom Navigation */}
        <View style={{ 
          paddingHorizontal: 20, 
          paddingBottom: 40 
        }}>
          {/* Page Indicators */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center', 
            marginBottom: 40 
          }}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={{
                  width: currentIndex === index ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentIndex === index 
                    ? Colors.light.tint 
                    : Colors.light.border,
                  marginHorizontal: 4,
                }}
              />
            ))}
          </View>

          {/* Next Button */}
          <Pressable
            onPress={handleNext}
            style={{
              backgroundColor: Colors.light.tint,
              paddingVertical: 16,
              paddingHorizontal: 32,
              borderRadius: 16,
              alignItems: 'center',
              shadowColor: Colors.light.tint,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Text style={{
              color: '#ffffff',
              fontSize: 17,
              fontWeight: '600'
            }}>
              {currentIndex === onboardingData.length - 1 ? 'Inizia' : 'Continua'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
} 