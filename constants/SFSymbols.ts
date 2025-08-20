// Set di icone Ionicons organizzate per categoria
export const SF_SYMBOLS = {
  vehicles: [
    { key: 'car', name: 'Auto' },
    { key: 'bicycle', name: 'Bicicletta' },
    { key: 'bus', name: 'Autobus' },
    { key: 'boat', name: 'Barca' },
    { key: 'airplane', name: 'Aereo' },
    { key: 'train', name: 'Treno' },
    { key: 'rocket', name: 'Razzo' },
    { key: 'walk', name: 'A piedi' }
  ],
  properties: [
    { key: 'home', name: 'Casa' },
    { key: 'business', name: 'Ufficio' },
    { key: 'storefront', name: 'Negozio' },
    { key: 'library', name: 'Biblioteca' },
    { key: 'school', name: 'Scuola' },
    { key: 'medical', name: 'Ospedale' },
    { key: 'restaurant', name: 'Ristorante' },
    { key: 'cafe', name: 'Bar/Caffè' }
  ],
  animals: [
    { key: 'paw', name: 'Animale' },
    { key: 'fish', name: 'Pesce' },
    { key: 'bug', name: 'Insetto' },
    { key: 'leaf', name: 'Pianta' }
  ],
  devices: [
    { key: 'phone-portrait', name: 'Telefono' },
    { key: 'tablet-portrait', name: 'Tablet' },
    { key: 'laptop', name: 'Laptop' },
    { key: 'desktop', name: 'Desktop' },
    { key: 'tv', name: 'TV' },
    { key: 'watch', name: 'Orologio' },
    { key: 'camera', name: 'Fotocamera' },
    { key: 'headset', name: 'Cuffie' },
    { key: 'game-controller', name: 'Console' },
    { key: 'print', name: 'Stampante' }
  ],
  people: [
    { key: 'person', name: 'Persona' },
    { key: 'people', name: 'Gruppo' },
    { key: 'person-circle', name: 'Contatto' },
    { key: 'happy', name: 'Famiglia' }
  ],
  subscriptions: [
    { key: 'card', name: 'Carta' },
    { key: 'play', name: 'Streaming' },
    { key: 'musical-notes', name: 'Musica' },
    { key: 'newspaper', name: 'Giornale' },
    { key: 'fitness', name: 'Palestra' },
    { key: 'cloud', name: 'Cloud' },
    { key: 'wifi', name: 'Internet' },
    { key: 'call', name: 'Telefonia' },
    { key: 'mail', name: 'Email' }
  ],
  other: [
    { key: 'cube', name: 'Generico' },
    { key: 'bag', name: 'Borsa' },
    { key: 'briefcase', name: 'Valigetta' },
    { key: 'gift', name: 'Regalo' },
    { key: 'book', name: 'Libro' },
    { key: 'school', name: 'Educazione' },
    { key: 'hammer', name: 'Attrezzo' },
    { key: 'brush', name: 'Arte' },
    { key: 'heart', name: 'Salute' },
    { key: 'leaf', name: 'Natura' },
    { key: 'star', name: 'Preferito' },
    { key: 'time', name: 'Tempo' },
    { key: 'key', name: 'Chiave' },
    { key: 'diamond', name: 'Gioiello' },
    { key: 'shirt', name: 'Abbigliamento' }
  ]
} as const;

// Helper per ottenere le icone di una categoria
export function getIconsForCategory(category: keyof typeof SF_SYMBOLS): typeof SF_SYMBOLS[keyof typeof SF_SYMBOLS] {
  return SF_SYMBOLS[category] || SF_SYMBOLS.other;
}

// Helper per ottenere il nome di un'icona
export function getIconName(iconKey: string, category: keyof typeof SF_SYMBOLS): string {
  const icons = getIconsForCategory(category);
  return icons.find(icon => icon.key === iconKey)?.name || 'Personalizzata';
} 