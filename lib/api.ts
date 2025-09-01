// lib/api.ts
// API client for Rails backend with Cognito authentication
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configuration
const sanitize = (v?: string) => (v && !v.startsWith('@') ? v : undefined);

// Get API URL from environment variables or use default
const envUrl = process.env.EXPO_PUBLIC_API_URL;
const extraUrl = Constants.expoConfig?.extra?.apiUrl;
const API_URL = envUrl || extraUrl || 'http://localhost:3001/api';

// Recurrence templates for deadlines
export const RECURRENCE_TEMPLATES = {
  daily: { label: 'Ogni giorno', rule: 'RRULE:FREQ=DAILY' },
  weekly: { label: 'Ogni settimana', rule: 'RRULE:FREQ=WEEKLY' },
  monthly: { label: 'Ogni mese', rule: 'RRULE:FREQ=MONTHLY' },
  quarterly: { label: 'Ogni 3 mesi', rule: 'RRULE:FREQ=MONTHLY;INTERVAL=3' },
  semiannual: { label: 'Ogni 6 mesi', rule: 'RRULE:FREQ=MONTHLY;INTERVAL=6' },
  yearly: { label: 'Ogni anno', rule: 'RRULE:FREQ=YEARLY' },
  biennial: { label: 'Ogni 2 anni', rule: 'RRULE:FREQ=YEARLY;INTERVAL=2' }
};

// Function to get access token
export const getAccessToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    const tokenExpiry = await AsyncStorage.getItem('token_expiry');
    
    // Se il token è scaduto, prova a fare refresh
    if (token && tokenExpiry) {
      const expiryTime = new Date(tokenExpiry).getTime();
      const now = new Date().getTime();
      
      // Se il token scade tra meno di 5 minuti, fai refresh
      if (expiryTime - now < 5 * 60 * 1000) {
        console.log('Token in scadenza, tentativo di refresh...');
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return await AsyncStorage.getItem('access_token');
        }
      }
    }
    
    return token;
  } catch (error) {
    console.error('Error retrieving access token:', error);
    return null;
  }
};

// Function to set access token
export const setAccessToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('access_token', token);
    
    // Calcola e salva la scadenza del token (1 ora di default)
    const expiryTime = new Date();
    expiryTime.setHours(expiryTime.getHours() + 1);
    await AsyncStorage.setItem('token_expiry', expiryTime.toISOString());
  } catch (error) {
    console.error('Error setting access token:', error);
  }
};

// Function to remove access token (logout)
export const clearAccessToken = async () => {
  try {
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('token_expiry');
  } catch (error) {
    console.error('Error removing access token:', error);
  }
};

// Function to refresh access token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    if (!refreshToken) {
      console.log('No refresh token available');
      return false;
    }

    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      await setAccessToken(data.access_token);
      await AsyncStorage.setItem('refresh_token', data.refresh_token);
      
      // Calcola e salva la scadenza del token (1 ora di default)
      const expiryTime = new Date();
      expiryTime.setHours(expiryTime.getHours() + 1);
      await AsyncStorage.setItem('token_expiry', expiryTime.toISOString());
      
      console.log('Token refreshed successfully');
      return true;
    } else {
      console.log('Failed to refresh token');
      await clearAccessToken();
      return false;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    await clearAccessToken();
    return false;
  }
};

// Funzione per gestire le chiamate API con gestione errori di connessione
async function apiCall(endpoint: string, options: RequestInit = {}, timeoutMs: number = 30000) {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
  const url = `${baseUrl}${endpoint}`;
  
  console.log('API call to:', url);
  console.log('API call options:', options);
  console.log('API call timeout:', timeoutMs);
  
  try {
    const accessToken = await getAccessToken();
    const headers: Record<string, string> = {
      ...options.headers as Record<string, string>
    };
    
    // Imposta Content-Type solo se non è FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    console.log('API call headers:', headers);

    // Crea un AbortController per gestire il timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API call failed: ${response.status} - ${errorText}`);
      
      // Gestione specifica per errori di autenticazione
      if (response.status === 401) {
        // Rimuovi il token scaduto
        await clearAccessToken();
        throw new Error('Sessione scaduta. Effettua nuovamente il login.');
      }
      
      // Gestione specifica per errori di connessione
      if (response.status === 0 || response.status === 500) {
        throw new Error('Impossibile connettersi al server. Verifica la tua connessione internet o riprova più tardi.');
      }
      
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('API call error details:', error);
    
    // Gestione errori di rete
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Errore di connessione. Verifica la tua connessione internet e che il server sia attivo.');
    }
    
    // Gestione errori di timeout
    if (error.name === 'AbortError') {
      // Se è un endpoint di file upload, usa un messaggio più specifico
      if (endpoint.includes('/documents') || endpoint.includes('/assets')) {
        throw new Error('Timeout durante il caricamento dei file. I file potrebbero essere troppo grandi o la connessione troppo lenta. Riprova con file più piccoli.');
      }
      throw new Error('Timeout della richiesta. Il server potrebbe essere sovraccarico, riprova più tardi.');
    }
    
    // Rilancia l'errore originale se è già un errore personalizzato
    if (error.message.includes('Sessione scaduta') || 
        error.message.includes('Impossibile connettersi') || 
        error.message.includes('Errore di connessione') || 
        error.message.includes('Timeout')) {
      throw error;
    }
    
    // Per altri errori, mostra un messaggio generico
    throw new Error('Errore di connessione al server. Verifica la tua connessione internet.');
  }
}

// Authentication API that mirrors the Rails/Cognito backend
export const auth = {
  // User registration
  signUp: async (email: string, password: string) => {
    try {
      const result = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ 
          email: {
            email,
            password
          }
        })
      });
      
      return { data: { user: { email } }, error: null };
    } catch (error: any) {
      return { data: { user: null }, error: { message: error.message } };
    }
  },

  // User login
  signIn: async (email: string, password: string) => {
    try {
      const result = await apiCall('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ 
          email: {
            email,
            password
          }
        })
      });
      
      await setAccessToken(result.access_token);
      await AsyncStorage.setItem('refresh_token', result.refresh_token);
      
      return { data: { user: result.user }, error: null };
    } catch (error: any) {
      return { data: { user: null }, error: { message: error.message } };
    }
  },

  // Login with object format (for compatibility)
  signInWithPassword: 
  async ({ email, password }: { email: string; password: string }) => {
    return auth.signIn(email, password);
  },

  // Email confirmation (for registration)
  confirmSignUp: async (email: string, confirmationCode: string) => {
    try {
      const result = await apiCall('/auth/confirm_signup', {
        method: 'POST',
        body: JSON.stringify({ 
          email: {
            email,
            confirmation_code: confirmationCode
          }
        })
      });
      
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },

  // OTP verification for email confirmation (for compatibility)
  verifyOtp: async ({ email, token, type }: { email: string; token: string; type: string }) => {
    if (type === 'signup') {
      return auth.confirmSignUp(email, token);
    }
    // For other OTP types (recovery, etc.) implement in the future
    throw new Error('OTP type not supported yet');
  },

  // Reset password
  resetPasswordForEmail: async (email: string) => {
    try {
      const result = await apiCall('/auth/forgot_password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },

  // Confirm forgot password
  confirmForgotPassword: async (email: string, confirmationCode: string, newPassword: string) => {
    try {
      const result = await apiCall('/auth/confirm_forgot_password', {
        method: 'POST',
        body: JSON.stringify({ 
          email,
          confirmation_code: confirmationCode,
          new_password: newPassword
        })
      });
      
      return { data: result, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },

  // Update user
  updateUser: async (attributes: any) => {
    try {
      const result = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(attributes)
      });
      
      return { data: { user: result }, error: null };
    } catch (error: any) {
      return { data: null, error: { message: error.message } };
    }
  },

  // Logout
  signOut: async () => {
    try {
      await apiCall('/auth/signout', {
        method: 'POST'
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      await clearAccessToken();
    }
    return { error: null };
  },

  // Refresh token
  refreshToken: async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const result = await apiCall('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      await setAccessToken(result.access_token);
      return { data: { user: result.user }, error: null };
    } catch (error: any) {
      return { data: { user: null }, error: { message: error.message } };
    }
  },

  // Get current user
  getUser: async () => {
    const accessToken = await getAccessToken();
    if (!accessToken) return { data: { user: null }, error: null };
    
    // Temporarily return user data from token without making API call
    // In the future, we'll implement a proper /users/me endpoint
    return {
      data: { 
        user: { 
          id: 'temp-user-id',
          email: 'test3@example.com' // This should come from the token in the future
        } 
      }, 
      error: null 
    };
  }
};

// API for CRUD operations on data
export const from = (table: string) => {
  return {
    select: (columns?: string) => {
      return {
        eq: (column: string, value: any) => ({
          async then(resolve: Function) {
            try {
              const params = new URLSearchParams();
              params.append(column, value);
              
              const data = await apiCall(`/${table}?${params.toString()}`);
              resolve({ data: Array.isArray(data) ? data : [data], error: null });
            } catch (error: any) {
              resolve({ data: null, error: { message: error.message } });
            }
          },
          
          single: () => ({
            async then(resolve: Function) {
              try {
                const params = new URLSearchParams();
                params.append(column, value);
                
                const data = await apiCall(`/${table}?${params.toString()}`);
                resolve({ data: Array.isArray(data) ? data[0] || null : data, error: null });
              } catch (error: any) {
                resolve({ data: null, error: { message: error.message } });
              }
            }
          })
        }),
        
        async then(resolve: Function) {
          try {
            const data = await apiCall(`/${table}`);
            resolve({ data: Array.isArray(data) ? data : [data], error: null });
          } catch (error: any) {
            resolve({ data: null, error: { message: error.message } });
          }
        },
        
        order: (column: string) => ({
          async then(resolve: Function) {
            try {
              const params = new URLSearchParams();
              params.append('order_by', column);
              
              const data = await apiCall(`/${table}?${params.toString()}`);
              resolve({ data: Array.isArray(data) ? data : [data], error: null });
            } catch (error: any) {
              resolve({ data: null, error: { message: error.message } });
            }
          }
        })
      };
    },
    
    insert: (data: any) => ({
      async then(resolve: Function) {
        try {
          const result = await apiCall(`/${table}`, {
            method: 'POST',
            body: JSON.stringify(data)
          });
          
          resolve({ data: result, error: null });
        } catch (error: any) {
          resolve({ data: null, error: { message: error.message } });
        }
      }
    }),
    
    update: (data: any) => ({
      eq: (column: string, value: any) => ({
        async then(resolve: Function) {
          try {
            const result = await apiCall(`/${table}/${column}/${value}`, {
              method: 'PUT',
              body: JSON.stringify(data)
            });
            
            resolve({ data: result, error: null });
          } catch (error: any) {
            resolve({ data: null, error: { message: error.message } });
          }
        }
      })
    }),
    
    delete: () => ({
      eq: (column: string, value: any) => ({
        async then(resolve: Function) {
          try {
            const result = await apiCall(`/${table}/${column}/${value}`, {
              method: 'DELETE'
            });
            
            resolve({ data: result, error: null });
          } catch (error: any) {
            resolve({ data: null, error: { message: error.message } });
          }
        }
      })
    })
  };
};

// Export everything as 'api' for the existing code
export const api = {
  auth,
  from
};

// Legacy export for backward compatibility
export const supabase = api;

// CRUD functions for deadlines
export const getAllDeadlines = async () => {
  try {
    const data = await apiCall('/deadlines');
    return data;
  } catch (error: any) {
    console.error('Error fetching deadlines:', error);
    throw error;
  }
};

export const getDeadline = async (id: string) => {
  try {
    const data = await apiCall(`/deadlines/${id}`);
    return data;
  } catch (error: any) {
    console.error('Error fetching deadline:', error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const data = await apiCall('/user_profiles');
    return data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: { name?: string; surname?: string }) => {
  try {
    const data = await apiCall('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return data;
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const createDeadline = async (deadlineData: any) => {
  try {
    const result = await apiCall('/deadlines', {
      method: 'POST',
      body: JSON.stringify({ deadline: deadlineData })
    });
    return result;
  } catch (error: any) {
    console.error('Error creating deadline:', error);
    throw error;
  }
};

export const createDeadlineWithAssociations = async (deadlineData: any) => {
  try {
    const result = await apiCall('/deadlines', {
      method: 'POST',
      body: JSON.stringify({ deadline: deadlineData })
    });
    return result;
  } catch (error: any) {
    console.error('Error creating deadline:', error);
    throw error;
  }
};

export const updateDeadlineStatus = async (id: string, status: string) => {
  try {
    let endpoint: string;
    if (status === 'done') {
      endpoint = `/deadlines/${id}/complete`;
    } else if (status === 'pending') {
      endpoint = `/deadlines/${id}/reopen`;
    } else {
      endpoint = `/deadlines/${id}`;
    }
    
    const result = await apiCall(endpoint, {
      method: 'PUT',
      body: status === 'done' || status === 'pending' ? '{}' : JSON.stringify({ deadline: { status } })
    });
    return result;
  } catch (error: any) {
    console.error('Error updating deadline status:', error);
    throw error;
  }
};

export const deleteDeadline = async (id: string) => {
  try {
    const result = await apiCall(`/deadlines/${id}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error: any) {
    console.error('Error deleting deadline:', error);
    throw error;
  }
};

// CRUD functions for assets
export const getAssets = async () => {
  try {
    const data = await apiCall('/assets');
    return data;
  } catch (error: any) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

export const getAsset = async (id: string) => {
  try {
    const data = await apiCall(`/assets/${id}`);
    return data;
  } catch (error: any) {
    console.error('Error fetching asset:', error);
    throw error;
  }
};

export const createAsset = async (assetData: any) => {
  try {
    console.log('Frontend sending asset data:', assetData);
    const result = await apiCall('/assets', {
      method: 'POST',
      body: JSON.stringify({ asset: assetData })
    });
    return result;
  } catch (error: any) {
    console.error('Error creating asset:', error);
    throw error;
  }
};

export const updateAsset = async (id: string, assetData: any) => {
  try {
    const result = await apiCall(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ asset: assetData })
    });
    return result;
  } catch (error: any) {
    console.error('Error updating asset:', error);
    throw error;
  }
};

export const deleteAsset = async (id: string) => {
  try {
    const result = await apiCall(`/assets/${id}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    throw error;
  }
};

// Asset-related functions
export const getAssetDeadlines = async (assetId: string) => {
  try {
    const data = await apiCall(`/assets/${assetId}/deadlines`);
    return data;
  } catch (error: any) {
    console.error('Error fetching asset deadlines:', error);
    throw error;
  }
};

export const getAssetDocuments = async (assetId: string) => {
  try {
    const data = await apiCall(`/assets/${assetId}/documents`);
    return data;
  } catch (error: any) {
    console.error('Error fetching asset documents:', error);
    throw error;
  }
};

// CRUD functions for documents
export const getDocuments = async () => {
  try {
    const data = await apiCall('/documents');
    return data;
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const getDocument = async (id: string) => {
  try {
    const data = await apiCall(`/documents/${id}`);
    return data;
  } catch (error: any) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

export const createDocument = async (documentData: FormData | any) => {
  try {
    let body: FormData;
    
    // Se è già un FormData, usalo direttamente
    if (documentData instanceof FormData) {
      body = documentData;
    } else {
      // Altrimenti, crea FormData dall'oggetto
      const formData = new FormData();
      formData.append('title', documentData.title);
      if (documentData.tags) {
        formData.append('tags', documentData.tags);
      }
      if (documentData.assetId) {
        formData.append('asset_id', documentData.assetId);
      }
      
      // Aggiungi i file
      const filesToUpload = documentData.filesInfo || (documentData.fileInfo ? [documentData.fileInfo] : []);
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        
        // Crea l'oggetto file per FormData
        const fileData = {
          uri: file.uri,
          name: file.name,
          type: file.type
        } as any;
        
        console.log('🔍 DEBUG - Appending file to FormData:', fileData);
        formData.append('files[]', fileData);
      }
      
      body = formData;
    }

    console.log('🔍 DEBUG - Sending FormData to documents endpoint');

    // Usa apiCall con timeout esteso per file upload (2 minuti)
    const result = await apiCall('/documents', {
      method: 'POST',
      body: body
    }, 120000); // 2 minuti di timeout

    return result;
  } catch (error: any) {
    console.error('Error creating document:', error);
    throw error;
  }
};

export const updateDocument = async (id: string, documentData: any) => {
  try {
    const result = await apiCall(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(documentData)
    });
    return result;
  } catch (error: any) {
    console.error('Error updating document:', error);
    throw error;
  }
};

export const deleteDocument = async (id: string) => {
  try {
    const result = await apiCall(`/documents/${id}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error: any) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Asset categories and types functions
export const getAssetCategories = async () => {
  try {
    const data = await apiCall('/asset_categories');
    return data;
  } catch (error: any) {
    console.error('Error fetching asset categories:', error);
    throw error;
  }
};

export const getAssetTypes = async () => {
  try {
    const data = await apiCall('/asset_types');
    return data;
  } catch (error: any) {
    console.error('Error fetching asset types:', error);
    throw error;
  }
};

export const getAssetTypesByCategory = async (categoryId: string) => {
  try {
    const data = await apiCall(`/asset_types/by_category/${categoryId}`);
    return data;
  } catch (error: any) {
    console.error('Error fetching asset types by category:', error);
    throw error;
  }
};
