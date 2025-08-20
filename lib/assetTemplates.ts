// Nuove categorie di beni con template predefiniti
export const ASSET_CATEGORIES = [
  'vehicle',
  'home', 
  'device',
  'appliance',
  'animal',
  'person',
  'subscription',
  'property',
  'investment',
  'other'
] as const;

export type AssetCategory = typeof ASSET_CATEGORIES[number];

// Template per ogni categoria con icone fisse
export const ASSET_TEMPLATES = {
  vehicle: {
    label: 'Veicolo',
    icon: 'car',
    items: [
      { key: 'car', name: 'Auto', icon: 'car' },
      { key: 'motorcycle', name: 'Moto', icon: 'bicycle' },
      { key: 'scooter', name: 'Scooter', icon: 'bicycle' },
      { key: 'bicycle', name: 'Bicicletta', icon: 'bicycle' },
      { key: 'scooter_electric', name: 'Monopattino', icon: 'walk' },
      { key: 'rv', name: 'Camper', icon: 'bus' },
      { key: 'boat', name: 'Barca', icon: 'boat' },
      { key: 'custom', name: 'Altro', icon: 'car' }
    ]
  },
  home: {
    label: 'Casa',
    icon: 'home',
    items: [
      { key: 'primary_home', name: 'Prima casa', icon: 'home' },
      { key: 'secondary_home', name: 'Seconda casa', icon: 'home' },
      { key: 'vacation_home', name: 'Casa vacanze', icon: 'home' },
      { key: 'rental_apartment', name: 'Appartamento in affitto', icon: 'business' },
      { key: 'garage', name: 'Garage', icon: 'storefront' },
      { key: 'cellar', name: 'Cantina', icon: 'storefront' },
      { key: 'custom', name: 'Altro', icon: 'home' }
    ]
  },
  device: {
    label: 'Dispositivo',
    icon: 'phone-portrait',
    items: [
      { key: 'smartphone', name: 'Smartphone', icon: 'phone-portrait' },
      { key: 'laptop', name: 'Laptop', icon: 'laptop' },
      { key: 'tablet', name: 'Tablet', icon: 'tablet-portrait' },
      { key: 'smartwatch', name: 'Smartwatch', icon: 'watch' },
      { key: 'console', name: 'Console', icon: 'game-controller' },
      { key: 'printer', name: 'Stampante', icon: 'print' },
      { key: 'custom', name: 'Altro', icon: 'phone-portrait' }
    ]
  },
  appliance: {
    label: 'Elettrodomestico',
    icon: 'tv',
    items: [
      { key: 'washing_machine', name: 'Lavatrice', icon: 'tv' },
      { key: 'refrigerator', name: 'Frigorifero', icon: 'tv' },
      { key: 'dishwasher', name: 'Lavastoviglie', icon: 'tv' },
      { key: 'oven', name: 'Forno', icon: 'tv' },
      { key: 'microwave', name: 'Microonde', icon: 'tv' },
      { key: 'television', name: 'Televisione', icon: 'tv' },
      { key: 'vacuum', name: 'Aspirapolvere', icon: 'tv' },
      { key: 'custom', name: 'Altro', icon: 'tv' }
    ]
  },
  animal: {
    label: 'Animale',
    icon: 'paw',
    items: [
      { key: 'dog', name: 'Cane', icon: 'paw' },
      { key: 'cat', name: 'Gatto', icon: 'paw' },
      { key: 'rabbit', name: 'Coniglio', icon: 'paw' },
      { key: 'horse', name: 'Cavallo', icon: 'paw' },
      { key: 'bird', name: 'Uccello', icon: 'paw' },
      { key: 'custom', name: 'Altro', icon: 'paw' }
    ]
  },
  person: {
    label: 'Persona',
    icon: 'person',
    items: [
      { key: 'child', name: 'Figlio', icon: 'person' },
      { key: 'partner', name: 'Partner', icon: 'people' },
      { key: 'parent', name: 'Genitore', icon: 'person' },
      { key: 'grandparent', name: 'Nonno/a', icon: 'person' },
      { key: 'care_person', name: 'Persona assistita', icon: 'person' },
      { key: 'custom', name: 'Altro', icon: 'person' }
    ]
  },
  subscription: {
    label: 'Abbonamento',
    icon: 'card',
    items: [
      { key: 'netflix', name: 'Netflix', icon: 'play' },
      { key: 'amazon_prime', name: 'Amazon Prime', icon: 'play' },
      { key: 'spotify', name: 'Spotify', icon: 'musical-notes' },
      { key: 'gym', name: 'Palestra', icon: 'fitness' },
      { key: 'transport', name: 'Trasporti', icon: 'bus' },
      { key: 'health_insurance', name: 'Assicurazione sanitaria privata', icon: 'medical' },
      { key: 'custom', name: 'Altro', icon: 'card' }
    ]
  },
  property: {
    label: 'Proprietà',
    icon: 'business',
    items: [
      { key: 'land', name: 'Terreno', icon: 'leaf' },
      { key: 'garage', name: 'Garage', icon: 'storefront' },
      { key: 'car_box', name: 'Box auto', icon: 'storefront' },
      { key: 'parking_spot', name: 'Posto auto', icon: 'storefront' },
      { key: 'cellar', name: 'Cantina', icon: 'storefront' },
      { key: 'property_share', name: 'Quota immobile', icon: 'business' },
      { key: 'custom', name: 'Altro', icon: 'business' }
    ]
  },
  investment: {
    label: 'Investimento',
    icon: 'trending-up',
    items: [
      { key: 'stocks', name: 'Azioni', icon: 'trending-up' },
      { key: 'etf', name: 'ETF', icon: 'stats-chart' },
      { key: 'crypto', name: 'Criptovalute', icon: 'logo-bitcoin' },
      { key: 'mutual_funds', name: 'Fondi comuni', icon: 'stats-chart' },
      { key: 'pension_plan', name: 'Piani pensionistici', icon: 'time' },
      { key: 'bonds', name: 'Obbligazioni', icon: 'document-text' },
      { key: 'custom', name: 'Altro', icon: 'trending-up' }
    ]
  },
  other: {
    label: 'Altro',
    icon: 'cube',
    items: [
      { key: 'custom', name: 'Personalizzato', icon: 'cube' }
    ]
  }
} as const;

// Helper per ottenere i template di una categoria
export function getTemplatesForCategory(category: AssetCategory) {
  if (!category || !ASSET_TEMPLATES[category]) {
    return ASSET_TEMPLATES.other;
  }
  return ASSET_TEMPLATES[category];
}

// Helper per ottenere l'icona di un template specifico
export function getTemplateIcon(category: AssetCategory, templateKey: string): string {
  if (!category || !templateKey || !ASSET_TEMPLATES[category]) {
    return 'cube';
  }
  const templates = ASSET_TEMPLATES[category];
  if (!templates || !templates.items) {
    return 'cube';
  }
  const template = templates.items.find(item => item.key === templateKey);
  return template?.icon || templates.icon || 'cube';
}

// Helper per ottenere il nome di un template
export function getTemplateName(category: AssetCategory, templateKey: string): string {
  if (!category || !templateKey || !ASSET_TEMPLATES[category]) {
    return 'Personalizzato';
  }
  const templates = ASSET_TEMPLATES[category];
  if (!templates || !templates.items) {
    return 'Personalizzato';
  }
  const template = templates.items.find(item => item.key === templateKey);
  return template?.name || 'Personalizzato';
}

// Funzione per ottenere l'icona finale di un asset (basata su categoria e template)
export function getAssetIconFromTemplate(category: AssetCategory, templateKey?: string, customIcon?: string): string {
  // Controlli di sicurezza
  if (!category) {
    return 'cube';
  }
  
  // Se ha un'icona personalizzata (solo per template custom), usala
  if (templateKey === 'custom' && customIcon) {
    return customIcon;
  }
  
  // Altrimenti usa l'icona del template
  return getTemplateIcon(category, templateKey || 'custom');
}
