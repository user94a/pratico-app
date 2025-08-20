import { getAssetIconFromTemplate, type AssetCategory } from './assetTemplates';
import { Asset } from './types';

// Lista di tutte le icone disponibili (mantenuta per compatibilità)
export const AVAILABLE_ICONS = [
  // Vehicles
  'car', 'bicycle', 'bus', 'boat', 'airplane', 'train', 'rocket', 'walk',
  // Properties  
  'home', 'business', 'storefront', 'library', 'school', 'medical', 'restaurant', 'cafe',
  // Animals
  'paw', 'fish', 'bug', 'leaf',
  // Devices
  'phone-portrait', 'tablet-portrait', 'laptop', 'desktop', 'tv', 'watch', 
  'camera', 'headset', 'game-controller', 'print',
  // People
  'person', 'people', 'person-circle', 'happy',
  // Subscriptions
  'card', 'play', 'musical-notes', 'newspaper', 'fitness', 'cloud', 'wifi', 'call', 'mail',
  // Investments
  'trending-up', 'stats-chart', 'logo-bitcoin', 'document-text', 'time',
  // Other
  'cube', 'bag', 'briefcase', 'gift', 'book', 'hammer', 'brush', 'heart', 
  'star', 'key', 'diamond', 'shirt'
] as const;

/**
 * Funzione principale per ottenere l'icona di un asset.
 * Usa il nuovo sistema basato su categoria e template.
 */
export function getAssetIcon(asset: Asset | any): string {
  if (!asset?.type) return 'cube';
  
  // Usa il nuovo sistema basato su template
  return getAssetIconFromTemplate(
    asset.type as AssetCategory,
    asset.template_key || undefined,
    asset.custom_icon || undefined
  );
}

/**
 * Verifica se un'icona è valida (mantenuta per compatibilità)
 */
export function isValidIcon(iconKey: string): boolean {
  return AVAILABLE_ICONS.includes(iconKey as any);
}
