# Pratico 📱

**Pratico** è un'app mobile moderna e intuitiva per la gestione di beni, scadenze e documenti personali. Organizza la tua vita digitale con semplicità ed eleganza.

## ✨ Caratteristiche Principali

### 🏠 Gestione Beni
- **Catalogo completo**: Automobili, case e altri beni
- **Identificatori unici**: Targhe, indirizzi e codici personalizzati
- **Associazioni intelligenti**: Collega scadenze e documenti ai tuoi beni
- **Indicatori visivi**: Notifiche per scadenze prossime e scadute

### ⏰ Scadenze Intelligenti
- **Ricorrenze automatiche**: Supporto per scadenze mensili, annuali e personalizzate
- **Sistema di notifiche**: Indicatori colorati per urgenza (rosso/arancione/neutro)
- **Gestione completa**: Creazione, modifica ed eliminazione con conferme
- **Ricerca avanzata**: Trova rapidamente le scadenze che ti servono

### 📄 Documenti Digitali
- **Upload versatile**: Supporto per PDF, immagini e documenti vari
- **Preview integrata**: Visualizzazione diretta nell'app
- **Tag intelligenti**: Organizzazione tramite etichette personalizzate
- **Condivisione facile**: Scarica e condividi i tuoi documenti
- **Storage sicuro**: Archiviazione crittografata su AWS S3

### 🔗 Associazioni Avanzate
- **Collegamenti bidirezionali**: Documenti ↔ Scadenze, Beni → Scadenze/Documenti
- **Creazione rapida**: Crea elementi associati al volo durante l'inserimento
- **Navigazione fluida**: Passa facilmente tra elementi correlati
- **Flusso ottimizzato**: UX studiata per massima produttività

## 🛠 Tecnologie

### Frontend
- **React Native** con Expo
- **TypeScript** per type safety
- **React Navigation** per navigazione fluida
- **Expo Router** per routing avanzato
- **Ionicons** per iconografia coerente

### Backend
- **Ruby on Rails** API
- **PostgreSQL** database
- **AWS Cognito** per autenticazione
- **AWS S3** per file storage

### Funzionalità Avanzate
- **Ricorrenze RRULE**: Standard per eventi ricorrenti
- **Autenticazione JWT**: Login sicuro email/password
- **Upload robusto**: Gestione errori e retry automatici
- **Sincronizzazione real-time**: Aggiornamenti istantanei

## 🚀 Installazione

### Prerequisiti
- Node.js 18+
- Expo CLI
- Ruby 3.2+
- PostgreSQL
- Account AWS

### Setup del Progetto
```bash
# Clona il repository
git clone https://github.com/tuo-username/pratico.git
cd pratico

# Installa le dipendenze frontend
npm install

# Configura le variabili d'ambiente
cp .env.example .env
# Modifica .env con le tue chiavi AWS
```

### Setup Backend Rails
```bash
# Vai nella directory del backend
cd ../pratico-backend

# Installa le dipendenze Ruby
bundle install

# Configura il database
# Crea il file .env con le variabili d'ambiente

# Avvia il server Rails
rails server -p 3001
```

### Avvio dell'App
```bash
# Sviluppo
npm start

# iOS Simulator
npm run ios

# Android Emulator
npm run android
```

## 📱 Struttura del Progetto

```
pratico/                    # Frontend React Native
├── app/                    # Expo Router pages
│   ├── (auth)/            # Pagine di autenticazione
│   ├── (tabs)/            # Tab navigation
│   └── _layout.tsx        # Layout principale
├── components/            # Componenti riutilizzabili
│   ├── modals/           # Modali dell'app
│   └── FAB.tsx           # Floating Action Button
├── lib/                  # Logica business
│   ├── api.ts           # API calls e utilità
│   └── types.ts         # Definizioni TypeScript
└── assets/              # Risorse statiche

pratico-backend/          # Backend Rails
├── app/                 # Controllers, Models, Services
├── config/              # Configurazione Rails
└── db/                  # Migrazioni database
```

## 🗄 Schema Database

### Tabelle Principali
- **`users`**: Utenti del sistema
- **`user_profiles`**: Profili utente estesi
- **`assets`**: Beni dell'utente (auto, case, altro)
- **`deadlines`**: Scadenze con supporto ricorrenze
- **`documents`**: Documenti con metadata e storage
- **`deadline_assets`**: Associazione scadenze-beni
- **`deadline_documents`**: Associazione scadenze-documenti

### Funzionalità Database
- **Autenticazione Cognito**: Gestione utenti sicura
- **Trigger automatici**: Gestione ricorrenze
- **Storage policies**: Accesso sicuro ai file
- **API REST**: Endpoint per tutte le operazioni

## 🎨 Design System

### Palette Colori
- **Primario**: `#0a84ff` (iOS Blue)
- **Successo**: `#34c759` (iOS Green)  
- **Attenzione**: `#ff9500` (iOS Orange)
- **Errore**: `#ff3b30` (iOS Red)
- **Neutro**: `#f2f2f7` (iOS Gray)

### Principi UI/UX
- **Iconografia filled**: Coerenza visiva totale
- **Bottoni tondi**: Design moderno e accessibile
- **Input fillati**: Nessun placeholder, solo label
- **Feedback visivo**: Stati chiari per ogni azione
- **Navigazione intuitiva**: Flussi ottimizzati

## 🔒 Sicurezza

- **Autenticazione AWS Cognito**: JWT con refresh token
- **Isolamento dati**: Filtri per utente
- **Storage sicuro**: Crittografia file automatica
- **Validazione input**: Sanitizzazione dati
- **Gestione errori**: Logging e recovery

## 📊 Funzionalità in Evidenza

### Sistema di Ricorrenze
```ruby
# Controller Rails per gestione scadenze ricorrenti
class Api::DeadlinesController < ApplicationController
  def create
    deadline = current_user.deadlines.build(deadline_params)
    deadline.calculate_next_due_at if deadline.recurrence.present?
    deadline.save
  end
end
```

### Upload Intelligente
```typescript
// Sistema robusto di upload con retry
const uploadResult = await uploadFileWithProgress(
  file,
  'documents',
  (progress) => setUploadProgress(progress)
);
```

### UI Dinamica
```typescript
// Indicatori colorati basati su prossimità scadenza
const getDeadlineStatus = (deadline: Deadline) => {
  const diffDays = getDaysDiff(deadline.due_at);
  if (diffDays < 0) return { color: '#ff3b30' }; // Scaduta
  if (diffDays <= 7) return { color: '#ff9500' }; // Prossima
  return null; // Lontana
};
```

## 🤝 Contributi

I contributi sono benvenuti! Per contribuire:

1. **Fork** del progetto
2. **Crea** un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. **Push** al branch (`git push origin feature/AmazingFeature`)
5. **Apri** una Pull Request

---
**Pratico** - Organizza la tua vita digitale con stile! 🚀
