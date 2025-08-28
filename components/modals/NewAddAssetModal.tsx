import { Colors } from '@/constants/Colors';
import { createAsset } from '@/lib/api';
import { ASSET_TEMPLATES, type AssetCategory, getTemplatesForCategory } from '@/lib/assetTemplates';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NewAddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (asset: any) => void;
}

const { width: screenWidth } = Dimensions.get('window');

export function NewAddAssetModal({ visible, onClose, onSubmit }: NewAddAssetModalProps) {
  const [step, setStep] = useState<'category' | 'template' | 'details'>('category');
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;

  function reset() {
    setStep('category');
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setName('');
    setIdentifier('');
    setIsLoading(false);
    slideAnim.setValue(0);
  }

  function animateToStep(stepIndex: number) {
    Animated.timing(slideAnim, {
      toValue: -stepIndex * screenWidth,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function handleCategorySelect(category: AssetCategory) {
    setSelectedCategory(category);
    setStep('template');
    animateToStep(1);
  }

  function handleTemplateSelect(templateKey: string) {
    setSelectedTemplate(templateKey);
    
    // Se non è "custom", pre-popola il nome
    if (templateKey !== 'custom' && selectedCategory) {
      const templates = getTemplatesForCategory(selectedCategory);
      const template = templates?.items?.find(item => item.key === templateKey);
      if (template) {
        setName(template.name);
      }
    } else {
      setName('');
    }
    
    setStep('details');
    animateToStep(2);
  }

  async function handleSubmit() {
    if (!selectedCategory || !selectedTemplate || !name.trim()) {
      Alert.alert('Errore', 'Tutti i campi obbligatori devono essere compilati');
      return;
    }

    try {
      setIsLoading(true);
      const asset = await createAsset({
        asset_type: selectedCategory,
        name: name.trim(),
        identifier: identifier.trim() || null,
        template_key: selectedTemplate
      });
      
      Alert.alert('Successo', 'Bene creato con successo');
      onSubmit(asset);
      reset();
      onClose();
    } catch (error: any) {
      Alert.alert('Errore', error.message || 'Errore durante la creazione del bene');
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  function getIdentifierPlaceholder(): string {
    if (!selectedCategory || !selectedTemplate) return '';
    
    const placeholders: Record<AssetCategory, Record<string, string>> = {
      vehicle: {
        car: 'Targa (es: AB123CD)',
        motorcycle: 'Targa (es: AB123CD)',
        scooter: 'Targa (es: AB123CD)',
        bicycle: 'Numero telaio',
        scooter_electric: 'Numero serie',
        rv: 'Targa (es: AB123CD)',
        boat: 'Numero matricola',
        custom: 'Identificativo'
      },
      home: {
        primary_home: 'Indirizzo',
        secondary_home: 'Indirizzo',
        vacation_home: 'Indirizzo',
        rental_apartment: 'Indirizzo',
        garage: 'Indirizzo',
        cellar: 'Indirizzo',
        custom: 'Identificativo'
      },
      device: {
        smartphone: 'IMEI o numero serie',
        laptop: 'Numero serie',
        tablet: 'Numero serie',
        smartwatch: 'Numero serie',
        console: 'Numero serie',
        printer: 'Numero serie',
        custom: 'Numero serie'
      },
      appliance: {
        custom: 'Numero serie'
      },
      animal: {
        dog: 'Microchip o pedigree',
        cat: 'Microchip o pedigree',
        rabbit: 'Microchip',
        horse: 'Passaporto equino',
        bird: 'Anello identificativo',
        custom: 'Identificativo'
      },
      person: {
        child: 'Codice fiscale',
        partner: 'Codice fiscale',
        parent: 'Codice fiscale',
        grandparent: 'Codice fiscale',
        care_person: 'Codice fiscale',
        custom: 'Codice fiscale'
      },
      subscription: {
        custom: 'Numero abbonamento'
      },
      property: {
        land: 'Particella catastale',
        garage: 'Indirizzo',
        car_box: 'Indirizzo',
        parking_spot: 'Indirizzo',
        cellar: 'Indirizzo',
        property_share: 'Riferimento quota',
        custom: 'Identificativo'
      },
      investment: {
        stocks: 'Codice ISIN',
        etf: 'Codice ISIN',
        crypto: 'Wallet address',
        mutual_funds: 'Codice fondo',
        pension_plan: 'Numero piano',
        bonds: 'Codice ISIN',
        custom: 'Identificativo'
      },
      other: {
        custom: 'Identificativo'
      }
    };

    return placeholders[selectedCategory]?.[selectedTemplate] || 'Identificativo';
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
        {/* Fixed Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
          backgroundColor: Colors.light.background,
          zIndex: 1
        }}>
          <Text style={{ 
            fontSize: 32, 
            fontWeight: '800',
            color: Colors.light.text
          }}>
            {step === 'category' && 'Aggiungi bene'}
            {step === 'template' && 'Scegli tipo'}
            {step === 'details' && 'Dettagli bene'}
          </Text>
          <Pressable 
            onPress={handleClose}
            style={{
              backgroundColor: Colors.light.tint,
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <MaterialCommunityIcons name="close" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Navigation breadcrumb for non-category steps */}
        {step !== 'category' && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center',
            paddingHorizontal: 16,
            marginBottom: 16,
            gap: 8,
            backgroundColor: Colors.light.background,
            zIndex: 1
          }}>
            <Pressable
              onPress={() => {
                if (step === 'template') {
                  setStep('category');
                  setSelectedCategory(null);
                  animateToStep(0);
                } else if (step === 'details') {
                  setStep('template');
                  setSelectedTemplate(null);
                  setName('');
                  setIdentifier('');
                  animateToStep(1);
                }
              }}
              style={{ 
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 8,
                paddingRight: 12,
                backgroundColor: 'rgba(0, 122, 255, 0.1)',
                borderRadius: 8,
                gap: 4
              }}
            >
              <MaterialCommunityIcons name="chevron-left" size={16} color={Colors.light.tint} />
              <Text style={{ 
                fontSize: 16, 
                color: Colors.light.tint,
                fontWeight: '600'
              }}>
                {step === 'template' ? 'Categorie' : 'Tipi di bene'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Animated Content Container */}
        <View style={{ flex: 1, overflow: 'hidden' }}>
          <Animated.View style={{
            flexDirection: 'row',
            width: screenWidth * 3,
            flex: 1,
            transform: [{ translateX: slideAnim }]
          }}>
            {/* Panel 1: Category Selection */}
            <ScrollView 
              style={{ width: screenWidth, flex: 1 }} 
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            >
              <View style={{
                backgroundColor: Colors.light.cardBackground,
                borderRadius: 16,
                marginBottom: 24
              }}>
                {Object.entries(ASSET_TEMPLATES).map(([key, category], index) => {
                  const isLast = index === Object.entries(ASSET_TEMPLATES).length - 1;
                  return (
                    <View key={key}>
                      <Pressable
                        onPress={() => handleCategorySelect(key as AssetCategory)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          justifyContent: 'space-between',
                          minHeight: 44
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <View style={{
                            width: 29,
                            height: 29,
                            borderRadius: 6,
                            backgroundColor: Colors.light.tint,
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <MaterialCommunityIcons 
                              name={category.icon as any} 
                              size={18} 
                              color="#fff" 
                            />
                          </View>
                          <Text style={{
                            fontSize: 17,
                            fontWeight: '400',
                            color: Colors.light.text
                          }}>
                            {category.label}
                          </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
                      </Pressable>
                      {!isLast && (
                        <View style={{
                          height: 0.33,
                          backgroundColor: Colors.light.border,
                          marginLeft: 57
                        }} />
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            {/* Panel 2: Template Selection */}
            <ScrollView 
              style={{ width: screenWidth, flex: 1 }} 
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            >
              {selectedCategory && (
                <View style={{
                  backgroundColor: Colors.light.cardBackground,
                  borderRadius: 16,
                  marginBottom: 24
                }}>
                  {getTemplatesForCategory(selectedCategory)?.items?.map((template, index) => {
                    const templates = getTemplatesForCategory(selectedCategory);
                    const isLast = index === (templates?.items?.length || 0) - 1;
                    return (
                      <View key={template.key}>
                        <Pressable
                          onPress={() => handleTemplateSelect(template.key)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: template.key === 'custom' ? 10 : 12,
                            paddingHorizontal: 16,
                            justifyContent: 'space-between',
                            minHeight: template.key === 'custom' ? 50 : 44
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                            <View style={{
                              width: 29,
                              height: 29,
                              borderRadius: 6,
                              backgroundColor: Colors.light.tint,
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <MaterialCommunityIcons 
                                name={template.icon as any} 
                                size={18} 
                                color="#fff" 
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontSize: 17,
                                fontWeight: '400',
                                color: Colors.light.text,
                                marginBottom: template.key === 'custom' ? 3 : 0
                              }}>
                                {template.name}
                              </Text>
                              {template.key === 'custom' && (
                                <View style={{
                                  backgroundColor: Colors.light.warning + '15',
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                  borderRadius: 8,
                                  alignSelf: 'flex-start'
                                }}>
                                  <Text style={{
                                    fontSize: 10,
                                    fontWeight: '600',
                                    color: Colors.light.warning
                                  }}>
                                    PERSONALIZZABILE
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                          <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.light.textSecondary} />
                        </Pressable>
                        {!isLast && (
                          <View style={{
                            height: 0.33,
                            backgroundColor: Colors.light.border,
                            marginLeft: 57
                          }} />
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>

            {/* Panel 3: Details */}
            <ScrollView 
              style={{ width: screenWidth, flex: 1 }} 
              contentContainerStyle={{ flexGrow: 1, padding: 16 }}
            >
              <View style={{ gap: 16, flex: 1 }}>
                {/* Nome */}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                    Nome bene
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder={selectedTemplate === 'custom' ? 'Inserisci nome del bene' : 'Modifica nome se necessario'}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e1e1e6'
                    }}
                  />
                </View>

                {/* Identificativo */}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#333' }}>
                    Identificativo
                  </Text>
                  <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
                    {getIdentifierPlaceholder()} (opzionale)
                  </Text>
                  <TextInput
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder={getIdentifierPlaceholder()}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 12,
                      padding: 16,
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#e1e1e6'
                    }}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <View style={{ flexDirection: 'row', gap: 12, paddingTop: 24 }}>
                <Pressable 
                  onPress={() => {
                    setStep('template');
                    setSelectedTemplate(null);
                    setName('');
                    setIdentifier('');
                    animateToStep(1);
                  }}
                  disabled={isLoading}
                  style={{ 
                    flex: 1, 
                    padding: 16, 
                    borderRadius: 12, 
                    backgroundColor: isLoading ? '#f8f8f8' : '#f2f2f7', 
                    alignItems: 'center',
                    opacity: isLoading ? 0.5 : 1
                  }}
                >
                  <Text style={{ fontWeight: '600', color: isLoading ? '#999' : '#000' }}>Indietro</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmit}
                  disabled={isLoading || !name.trim()}
                  style={{
                    flex: 1,
                    padding: 16,
                    borderRadius: 12,
                    backgroundColor: isLoading || !name.trim() ? '#80a8ff' : '#0a84ff',
                    alignItems: 'center',
                    opacity: isLoading || !name.trim() ? 0.8 : 1
                  }}
                >
                  <Text style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: '600'
                  }}>
                    {isLoading ? 'Creazione...' : 'Crea bene'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
