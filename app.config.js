require('dotenv').config();

export default {
  expo: {
    name: 'Pratico',
    slug: 'pratico',
    version: '1.0.1',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/images/splash.png',
      backgroundColor: '#ffffff',
      resizeMode: 'contain'
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      userInterfaceStyle: 'light',
      bundleIdentifier: 'it.extendi.pratico',
      buildNumber: '3',
      infoPlist: {
        NSCameraUsageDescription: 'Questa app usa la fotocamera per scattare foto dei documenti da allegare.',
        NSPhotoLibraryUsageDescription: 'Questa app accede alla galleria foto per selezionare immagini da allegare ai documenti.',
        NSMicrophoneUsageDescription: 'Questa app potrebbe richiedere l\'accesso al microfono per funzionalità future.',
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff'
      },
      userInterfaceStyle: 'light',
      package: 'it.extendi.pratico',
      versionCode: 1,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE'
      ]
    },
    web: {
      favicon: './assets/images/favicon.png'
    },
    extra: {
      eas: {
        projectId: 'f9b5430b-d84b-4ac2-8b92-511f932c04bb'
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    },
    owner: 'pratico-app'
  }
};