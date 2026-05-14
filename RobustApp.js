import React, { useState, useEffect, useRef, Suspense } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './constants';

// Componente de fallback robusto
const FallbackComponent = ({ error, retry }) => (
  <View style={fallbackStyles.container}>
    <View style={fallbackStyles.errorContainer}>
      <Text style={fallbackStyles.errorIcon}>⚠️</Text>
      <Text style={fallbackStyles.errorTitle}>Erro de Carregamento</Text>
      <Text style={fallbackStyles.errorMessage}>
        {error?.message || 'Ocorreu um erro inesperado'}
      </Text>
      <TouchableOpacity style={fallbackStyles.retryButton} onPress={retry}>
        <Text style={fallbackStyles.retryText}>🔄 Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Componente de loading robusto
const LoadingComponent = () => (
  <View style={loadingStyles.container}>
    <View style={loadingStyles.loadingContainer}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={loadingStyles.loadingText}>Carregando SOPHIE...</Text>
      <Text style={loadingStyles.subText}>Sistema Educacional Profissional</Text>
    </View>
  </View>
);

// Componente de tela inicial robusto
const InitialScreen = ({ onReady }) => {
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReady();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onReady]);

  return (
    <View style={initialStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={initialStyles.logoContainer}>
        <View style={initialStyles.logo}>
          <Text style={initialStyles.logoText}>S</Text>
        </View>
        <Text style={initialStyles.title}>SOPHIE</Text>
        <Text style={initialStyles.subtitle}>Sistema Educacional Profissional</Text>
      </View>
      
      <View style={initialStyles.countdownContainer}>
        <Text style={initialStyles.countdownText}>
          {countdown > 0 ? `Iniciando em ${countdown}...` : 'Carregando sistema...'}
        </Text>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    </View>
  );
};

// Componente principal robusto
const RobustApp = () => {
  const [appState, setAppState] = useState('initializing'); // 'initializing', 'loading', 'ready', 'error'
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const appInitialized = useRef(false);
  const timeoutRef = useRef(null);
  
  // Sistema de auto-recuperação
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setAppState('initializing');
    
    // Limpar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Tentar novamente após delay progressivo
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff
    timeoutRef.current = setTimeout(() => {
      initializeApp();
    }, delay);
  };
  
  // Sistema de inicialização robusto
  const initializeApp = () => {
    try {
      setAppState('loading');
      
      // Timeout de segurança para evitar tela branca infinita
      const safetyTimeout = setTimeout(() => {
        if (!appInitialized.current) {
          console.warn('Timeout de inicialização - ativando fallback');
          setAppState('error');
          setError(new Error('Timeout de carregamento. Verifique sua conexão.'));
        }
      }, 15000); // 15 segundos max
      
      // Simular carregamento dos componentes principais
      setTimeout(() => {
        if (!appInitialized.current) {
          appInitialized.current = true;
          clearTimeout(safetyTimeout);
          setAppState('ready');
        }
      }, 2000); // 2 segundos para simulação
      
    } catch (err) {
      console.error('Erro na inicialização:', err);
      setAppState('error');
      setError(err);
    }
  };
  
  // Sistema de monitoramento de erros globais
  useEffect(() => {
    const handleError = (event) => {
      console.error('Erro global capturado:', event.error);
      setAppState('error');
      setError(event.error || new Error('Erro desconhecido'));
    };
    
    const handleUnhandledRejection = (event) => {
      console.error('Promise rejeitada:', event.reason);
      setAppState('error');
      setError(new Error(event.reason || 'Erro assíncrono'));
    };
    
    // Adicionar listeners globais
    if (typeof window !== 'undefined') {
      window.addEventListener('error', handleError);
      window.addEventListener('unhandledrejection', handleUnhandledRejection);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('error', handleError);
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      }
    };
  }, []);
  
  // Inicialização automática
  useEffect(() => {
    if (appState === 'initializing') {
      initializeApp();
    }
  }, [appState]);
  
  // Renderização baseada no estado
  const renderContent = () => {
    switch (appState) {
      case 'initializing':
        return <InitialScreen onReady={() => setAppState('loading')} />;
      
      case 'loading':
        return <LoadingComponent />;
      
      case 'ready':
        // Carregar componente principal dinamicamente
        try {
          const MainApp = require('./App').default;
          return (
            <Suspense fallback={<LoadingComponent />}>
              <MainApp />
            </Suspense>
          );
        } catch (err) {
          console.error('Erro ao carregar App principal:', err);
          setAppState('error');
          setError(err);
          return null;
        }
      
      case 'error':
        return <FallbackComponent error={error} retry={handleRetry} />;
      
      default:
        return <LoadingComponent />;
    }
  };
  
  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
  },
});

const fallbackStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  retryText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
  },
});

const initialStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  countdownContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  countdownText: {
    fontSize: 18,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
});

export default RobustApp;
