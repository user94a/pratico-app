import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

// ASSETS
export type AssetInput = { 
  name: string; 
  type: string; 
  identifier?: string; 
  custom_icon?: string | null;
  template_key?: string;
};
export async function createAsset(input: AssetInput) {
  const payload = {
    name: input.name,
    type: input.type,
    identifier: input.identifier ?? null,
    custom_icon: input.custom_icon ?? null,
    template_key: input.template_key ?? null,
  };
  const { data, error } = await supabase.from('assets').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function getAssets() {
  const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAssetDeadlines(assetId: string) {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*')
    .eq('asset_id', assetId)
    .order('due_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getAssetDocuments(assetId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function deleteAsset(id: string) {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateAsset(id: string, updates: {
  type?: string;
  name?: string;
  identifier?: string | null;
  custom_icon?: string | null;
}) {
  const { error } = await supabase
    .from('assets')
    .update(updates)
    .eq('id', id);

  if (error) throw error;
}

// DEADLINES
export type DeadlineInput = { 
  title: string; 
  dueAt: string; 
  notes?: string; 
  assetId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
};

export async function createDeadline(input: DeadlineInput) {
  const payload: any = {
    title: input.title,
    due_at: input.dueAt,
    notes: input.notes ?? null,
    asset_id: input.assetId ?? null,
  };

  // Aggiungi campi ricorrenza se specificati
  if (input.isRecurring && input.recurrenceRule) {
    payload.recurrence_rrule = input.recurrenceRule;
    payload.base_due_at = input.dueAt;
  }

  const { data, error } = await supabase.from('deadlines').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

// Utility per generare RRULE comuni
export const RECURRENCE_TEMPLATES = {
  weekly: { label: 'Settimanale', rule: 'RRULE:FREQ=WEEKLY' },
  monthly: { label: 'Mensile', rule: 'RRULE:FREQ=MONTHLY' },
  quarterly: { label: 'Trimestrale', rule: 'RRULE:FREQ=MONTHLY;INTERVAL=3' },
  biannual: { label: 'Semestrale', rule: 'RRULE:FREQ=MONTHLY;INTERVAL=6' },
  yearly: { label: 'Annuale', rule: 'RRULE:FREQ=YEARLY' },
  biennial: { label: 'Biennale', rule: 'RRULE:FREQ=YEARLY;INTERVAL=2' },
} as const;

export async function getUpcomingDeadlines(days = 90) {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*, asset:assets(name)')
    .eq('status', 'pending')
    .gte('due_at', new Date().toISOString())
    .lte('due_at', new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString())
    .order('due_at');
  if (error) throw error;
  return data;
}

export async function getAllDeadlines() {
  const { data, error } = await supabase
    .from('deadlines')
    .select('*, asset:assets(name, type, custom_icon)')
    .order('due_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteDeadline(id: string) {
  const { error } = await supabase.from('deadlines').delete().eq('id', id);
  if (error) throw error;
}

export async function updateDeadlineStatus(id: string, status: 'pending' | 'done' | 'skipped') {
  const payload: any = { 
    status,
    updated_at: new Date().toISOString()
  };
  
  if (status === 'done') {
    payload.completed_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('deadlines')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateDeadline(id: string, input: DeadlineInput) {
  const payload: any = {
    title: input.title,
    due_at: input.dueAt,
    notes: input.notes ?? null,
    asset_id: input.assetId ?? null,
    updated_at: new Date().toISOString()
  };

  // Gestisci ricorrenza
  if (input.isRecurring && input.recurrenceRule) {
    payload.recurrence_rrule = input.recurrenceRule;
    payload.base_due_at = input.dueAt;
  } else {
    // Se non più ricorrente, rimuovi i campi ricorrenza
    payload.recurrence_rrule = null;
    payload.base_due_at = null;
  }

  const { data, error } = await supabase
    .from('deadlines')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// DOCUMENTS
export type DocumentInput = { title: string; tags?: string; assetId?: string; storagePath?: string };
export async function createDocument(input: DocumentInput) {
  const payload: any = {
    title: input.title,
    tags: input.tags ? input.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    asset_id: input.assetId ?? null,
    storage_path: input.storagePath ?? null,
  };
  const { data, error } = await supabase.from('documents').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function getDocuments() {
  const { data, error } = await supabase
    .from('documents')
    .select('*, asset:assets(name, type, custom_icon)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function searchDocuments(query: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .or(`title.ilike.%${query}%, tags.cs.{${query}}`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string) {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadDocumentFile(fileUri: string, fileName: string, mimeType: string) {
  console.log('📤 UPLOAD START:', { fileUri, fileName, mimeType });
  
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Utente non autenticato');
  
  console.log('📤 User authenticated:', user.id);
  
  const path = `${user.id}/${Date.now()}-${fileName}`;
  console.log('📤 Upload path:', path);
  
  try {
    // METODO 1: FileSystem + Uint8Array (più robusto)
    console.log('📤 Reading file as base64...');
    const base64 = await FileSystem.readAsStringAsync(fileUri, { 
      encoding: FileSystem.EncodingType.Base64 
    });
    
    console.log('📤 Base64 length:', base64.length);
    
    // Converti base64 in Uint8Array usando helper function
    const bytes = base64ToUint8Array(base64);
    
    console.log('📤 Uint8Array created:', {
      size: bytes.length,
      type: mimeType
    });
    
    if (bytes.length === 0) {
      throw new Error('File is empty (0 bytes)');
    }
    
    console.log('📤 Uploading to Supabase Storage (Uint8Array)...');
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(path, bytes, { 
        contentType: mimeType, 
        upsert: true
      });
      
    if (error) {
      console.error('📤 Uint8Array upload failed, trying FormData fallback...', error);
      
      // METODO 2: FormData fallback (React Native style)
      const file = { 
        uri: fileUri, 
        name: fileName, 
        type: mimeType 
      } as any;
      
      console.log('📤 Trying FormData upload...');
      const result2 = await supabase.storage
        .from('documents')
        .upload(`${path}-fd`, file, { 
          contentType: mimeType, 
          upsert: true
        });
        
      if (result2.error) {
        console.error('📤 FormData upload also failed:', result2.error);
        throw result2.error;
      }
      
      console.log('📤 FormData upload success:', result2.data);
      return `${path}-fd`;
    }
    
    console.log('📤 Upload success:', data);
    return path;
    
  } catch (e: any) {
    console.error('📤 Upload failed:', e);
    throw e;
  }
}

export async function createDocumentWithDeadline(documentInput: DocumentInput, deadlineInput?: DeadlineInput) {
  // Prima crea il documento
  const document = await createDocument(documentInput);
  
  // Se c'è una scadenza da creare, creala e collegala al documento
  if (deadlineInput) {
    await createDeadline({
      ...deadlineInput,
      assetId: documentInput.assetId // Usa lo stesso asset del documento
    });
  }
  
  return document;
}

export async function createDocumentWithAssociations(input: {
  title: string;
  tags?: string;
  assetId?: string;
  storagePath?: string;
  fileInfo?: {
    uri: string;
    name: string;
    type: string;
  };
  filesInfo?: Array<{
    uri: string;
    name: string;
    type: string;
  }>;
  associatedDeadline?: {
    title: string;
    dueAt: string;
    notes?: string;
    isRecurring?: boolean;
    recurrenceRule?: string;
  };
}) {
  let assetId = input.assetId;
  let storagePath = input.storagePath;

  // 1. Carica i file se presenti (supporta sia fileInfo che filesInfo)
  const filesToUpload = input.filesInfo || (input.fileInfo ? [input.fileInfo] : []);
  
  if (filesToUpload.length > 0) {
    try {
      const uploadPromises = filesToUpload.map(async (fileInfo) => {
        const fileArrayBuffer = await FileSystem.readAsStringAsync(fileInfo.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const uint8Array = new Uint8Array(
          atob(fileArrayBuffer)
            .split('')
            .map(char => char.charCodeAt(0))
        );

        const { data: user } = await supabase.auth.getUser();
        if (!user.user) throw new Error('User not authenticated');

        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${fileInfo.name}`;
        const filePath = `${user.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, uint8Array, {
            contentType: fileInfo.type,
            upsert: true
          });

        if (uploadError) throw uploadError;
        return filePath;
      });

      const uploadedPaths = await Promise.all(uploadPromises);
      
      // Salva file multipli come JSON array, singolo file come stringa
      if (uploadedPaths.length > 1) {
        storagePath = JSON.stringify(uploadedPaths);
      } else if (uploadedPaths.length === 1) {
        storagePath = uploadedPaths[0];
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      throw new Error('Errore durante l\'upload dei file');
    }
  }

  // 3. Crea il documento
  const document = await createDocument({
    title: input.title,
    tags: input.tags,
    assetId,
    storagePath
  });

  // 4. Crea la scadenza associata se richiesta
  if (input.associatedDeadline) {
    await createDeadline({
      title: input.associatedDeadline.title,
      dueAt: input.associatedDeadline.dueAt,
      notes: input.associatedDeadline.notes,
      assetId, // Usa lo stesso asset del documento
      isRecurring: input.associatedDeadline.isRecurring,
      recurrenceRule: input.associatedDeadline.recurrenceRule
    });
  }

  return document;
}

export async function createDeadlineWithAssociations(input: {
  title: string;
  dueAt: string;
  notes?: string;
  assetId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  selectedAssets?: any[];
  selectedDocuments?: any[];

  associatedDocument?: {
    title: string;
    tags?: string;
  } | { existingDocumentId: string };
}) {
  let assetId = input.assetId;

  // 1. Crea la scadenza
  const deadline = await createDeadline({
    title: input.title,
    dueAt: input.dueAt,
    notes: input.notes,
    assetId,
    isRecurring: input.isRecurring,
    recurrenceRule: input.recurrenceRule
  });

  // 3. Collega i beni selezionati
  if (input.selectedAssets && input.selectedAssets.length > 0) {
    const assetAssociations = input.selectedAssets.map(asset => ({
      deadline_id: deadline.id,
      asset_id: asset.id
    }));
    
    const { error: assetError } = await supabase
      .from('deadline_assets')
      .insert(assetAssociations);
    
    if (assetError) throw assetError;
  }

  // 4. Collega i documenti selezionati
  if (input.selectedDocuments && input.selectedDocuments.length > 0) {
    const documentAssociations = input.selectedDocuments.map(document => ({
      deadline_id: deadline.id,
      document_id: document.id
    }));
    
    const { error: documentError } = await supabase
      .from('deadline_documents')
      .insert(documentAssociations);
    
    if (documentError) throw documentError;
  }

  // 5. Crea o collega il documento se richiesto (per retrocompatibilità)
  if (input.associatedDocument) {
    if ('existingDocumentId' in input.associatedDocument) {
      // Documento esistente - non facciamo nulla qui, il collegamento è implicito attraverso l'asset
    } else {
      // Crea nuovo documento
      await createDocument({
        title: input.associatedDocument.title,
        tags: input.associatedDocument.tags,
        assetId // Usa lo stesso asset della scadenza
      });
    }
  }

  return deadline;
}

// Helper function for base64 decode (React Native compatible)
function base64ToUint8Array(base64: string): Uint8Array {
  // Decodifica base64 compatibile con React Native
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes;
}

// Implementazione atob per React Native (se non disponibile)
function atob(base64: string): string {
  // React Native ha atob nativo, ma per sicurezza implementiamo manualmente
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let i = 0;
  
  base64 = base64.replace(/[^A-Za-z0-9+/]/g, '');
  
  while (i < base64.length) {
    const a = chars.indexOf(base64.charAt(i++));
    const b = chars.indexOf(base64.charAt(i++));
    const c = chars.indexOf(base64.charAt(i++));
    const d = chars.indexOf(base64.charAt(i++));
    
    const bitmap = (a << 18) | (b << 12) | (c << 6) | d;
    
    result += String.fromCharCode((bitmap >> 16) & 255);
    if (c !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
    if (d !== 64) result += String.fromCharCode(bitmap & 255);
  }
  
  return result;
} 