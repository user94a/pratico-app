export const createThemedStyles = (isDark: boolean) => ({
  // Colori di base
  colors: {
    background: isDark ? '#000' : '#fff',
    backgroundSecondary: isDark ? '#111' : '#f2f2f7',
    backgroundTertiary: isDark ? '#222' : '#fff',
    border: isDark ? '#333' : '#d1d1d6',
    borderLight: isDark ? '#444' : '#e5e5ea',
    
    text: isDark ? '#fff' : '#000',
    textSecondary: isDark ? '#ccc' : '#666',
    textTertiary: isDark ? '#999' : '#999',
    
    primary: '#0a84ff',
    success: '#34c759',
    danger: '#ff3b30',
    warning: '#ff9500',
    
    overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)',
  },

  // Container comuni
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#fff',
  },

  safeArea: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#fff',
  },

  // Sezioni
  section: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: isDark ? '#111' : '#f2f2f7',
    marginBottom: 16,
  },

  // Card per elementi lista
  card: {
    backgroundColor: isDark ? '#111' : '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#e5e5ea',
  },

  // Input fields
  input: {
    borderWidth: 1,
    borderColor: isDark ? '#333' : '#d1d1d6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: isDark ? '#111' : '#fff',
    color: isDark ? '#fff' : '#000',
  },

  // Pulsanti
  button: {
    primary: {
      backgroundColor: '#0a84ff',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center' as const,
    },
    secondary: {
      backgroundColor: isDark ? '#333' : '#f2f2f7',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center' as const,
    },
    danger: {
      backgroundColor: '#ff3b30',
      padding: 16,
      borderRadius: 12,
      alignItems: 'center' as const,
    },
  },

  // Testi
  text: {
    title: {
      fontSize: 34,
      fontWeight: '800' as const,
      color: isDark ? '#fff' : '#000',
      marginBottom: 16,
    },
    heading: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: isDark ? '#fff' : '#000',
      marginBottom: 12,
    },
    subheading: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: isDark ? '#fff' : '#000',
    },
    body: {
      fontSize: 14,
      color: isDark ? '#fff' : '#000',
    },
    caption: {
      fontSize: 12,
      color: isDark ? '#ccc' : '#666',
    },
  },

  // Icone di stato per le scadenze
  deadlineStatus: {
    pending: '#ff9500',
    done: '#34c759',
    skipped: '#8e8e93',
    overdue: '#ff3b30',
  },

  // Layout comuni
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  spaceBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },

  // FAB (Floating Action Button)
  fab: {
    position: 'absolute' as const,
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a84ff',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  // Modal
  modal: {
    background: {
      flex: 1,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    content: {
      flex: 1,
      padding: 16,
    },
  },
}); 