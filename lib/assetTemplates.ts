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
      { key: 'motorcycle', name: 'Moto', icon: 'bike' },
      { key: 'scooter', name: 'Scooter', icon: 'moped' },
      { key: 'bicycle', name: 'Bicicletta', icon: 'bicycle-basket' },
      { key: 'scooter_electric', name: 'Monopattino', icon: 'scooter' },
      { key: 'rv', name: 'Camper', icon: 'caravan' },
      { key: 'boat', name: 'Barca', icon: 'ferry' },
      { key: 'custom', name: 'Altro', icon: 'car' }
    ]
  },
  home: {
    label: 'Casa',
    icon: 'home',
    items: [
      { key: 'primary_home', name: 'Prima casa', icon: 'home' },
      { key: 'secondary_home', name: 'Seconda casa', icon: 'home-variant' },
      { key: 'vacation_home', name: 'Casa vacanze', icon: 'home-heart' },
      { key: 'rental_apartment', name: 'Appartamento in affitto', icon: 'domain' },
      { key: 'garage', name: 'Garage', icon: 'garage' },
      { key: 'cellar', name: 'Cantina', icon: 'archive' },
      { key: 'custom', name: 'Altro', icon: 'home' }
    ]
  },
  device: {
    label: 'Dispositivo',
    icon: 'cellphone',
    items: [
      { key: 'smartphone', name: 'Smartphone', icon: 'cellphone' },
      { key: 'laptop', name: 'Laptop', icon: 'laptop' },
      { key: 'tablet', name: 'Tablet', icon: 'tablet' },
      { key: 'smartwatch', name: 'Smartwatch', icon: 'watch' },
      { key: 'console', name: 'Console', icon: 'gamepad-variant' },
      { key: 'printer', name: 'Stampante', icon: 'printer' },
      { key: 'custom', name: 'Altro', icon: 'cellphone' }
    ]
  },
  appliance: {
    label: 'Elettrodomestico',
    icon: 'television',
    items: [
      { key: 'washing_machine', name: 'Lavatrice', icon: 'washing-machine' },
      { key: 'refrigerator', name: 'Frigorifero', icon: 'fridge' },
      { key: 'dishwasher', name: 'Lavastoviglie', icon: 'dishwasher' },
      { key: 'oven', name: 'Forno', icon: 'stove' },
      { key: 'microwave', name: 'Microonde', icon: 'microwave' },
      { key: 'television', name: 'Televisione', icon: 'television' },
      { key: 'vacuum', name: 'Aspirapolvere', icon: 'vacuum' },
      { key: 'custom', name: 'Altro', icon: 'television' }
    ]
  },
  animal: {
    label: 'Animale',
    icon: 'paw',
    items: [
      { key: 'dog', name: 'Cane', icon: 'dog-side' },
      { key: 'cat', name: 'Gatto', icon: 'cat' },
      { key: 'rabbit', name: 'Coniglio', icon: 'rabbit' },
      { key: 'horse', name: 'Cavallo', icon: 'horse-variant' },
      { key: 'bird', name: 'Uccello', icon: 'bird' },
      { key: 'custom', name: 'Altro', icon: 'paw' }
    ]
  },
  person: {
    label: 'Persona',
    icon: 'account',
    items: [
      { key: 'child', name: 'Figlio', icon: 'human-male-child' },
      { key: 'partner', name: 'Partner', icon: 'account-heart' },
      { key: 'parent', name: 'Genitore', icon: 'account-supervisor' },
      { key: 'grandparent', name: 'Nonno/a', icon: 'account-multiple' },
      { key: 'care_person', name: 'Persona assistita', icon: 'account-injury' },
      { key: 'custom', name: 'Altro', icon: 'account' }
    ]
  },
  subscription: {
    label: 'Abbonamento',
    icon: 'credit-card',
    items: [
      { key: 'netflix', name: 'Netflix', icon: 'netflix' },
      { key: 'amazon_prime', name: 'Amazon Prime', icon: 'package' },
      { key: 'spotify', name: 'Spotify', icon: 'spotify' },
      { key: 'gym', name: 'Palestra', icon: 'dumbbell' },
      { key: 'transport', name: 'Trasporti', icon: 'bus' },
      { key: 'health_insurance', name: 'Assicurazione sanitaria privata', icon: 'medical-bag' },
      { key: 'custom', name: 'Altro', icon: 'credit-card' }
    ]
  },
  property: {
    label: 'Proprietà',
    icon: 'office-building',
    items: [
      { key: 'land', name: 'Terreno', icon: 'grass' },
      { key: 'garage', name: 'Garage', icon: 'garage' },
      { key: 'car_box', name: 'Box auto', icon: 'garage-open' },
      { key: 'parking_spot', name: 'Posto auto', icon: 'parking' },
      { key: 'cellar', name: 'Cantina', icon: 'archive' },
      { key: 'property_share', name: 'Quota immobile', icon: 'office-building' },
      { key: 'custom', name: 'Altro', icon: 'office-building' }
    ]
  },
  investment: {
    label: 'Investimento',
    icon: 'trending-up',
    items: [
      { key: 'stocks', name: 'Azioni', icon: 'chart-line' },
      { key: 'etf', name: 'ETF', icon: 'chart-areaspline' },
      { key: 'crypto', name: 'Criptovalute', icon: 'bitcoin' },
      { key: 'mutual_funds', name: 'Fondi comuni', icon: 'chart-pie' },
      { key: 'pension_plan', name: 'Piani pensionistici', icon: 'clock-time-four' },
      { key: 'bonds', name: 'Obbligazioni', icon: 'file-document' },
      { key: 'custom', name: 'Altro', icon: 'trending-up' }
    ]
  },
  other: {
    label: 'Altro',
    icon: 'package-variant',
    items: [
      { key: 'custom', name: 'Personalizzato', icon: 'package-variant' }
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
