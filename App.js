import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import LoginScreen from './LoginScreen';
import DiretoraTela from './DiretoraTela';
import SalaTela from './SalaTela';
import AdminRoute from './AdminRoute';
import AdminPanelScreen from './AdminPanelScreen';
import { COLORS } from './constants';

// Capturar erros globais
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error('Erro global:', event.error);
  });
}

// Hook para detectar dispositivo
const useDeviceDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isWeb, setIsWeb] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const web = Platform.OS === 'web';
      setIsWeb(web);
      
      if (web) {
        // Detectar mobile no browser
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        setIsMobile(mobile);
      } else {
        setIsMobile(true); // React Native é sempre mobile
      }
    };

    checkDevice();
    
    if (Platform.OS === 'web') {
      window.addEventListener('resize', checkDevice);
      return () => window.removeEventListener('resize', checkDevice);
    }
  }, []);

  return { isMobile, isWeb };
};

export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null); // 'aluno', 'diretora', 'admin'
  const { isMobile, isWeb } = useDeviceDetection();

  const handleLogin = (userData) => {
    try {
      console.log('Login:', userData);
      
      // Garantir que alunos tenham salaId
      if (userData.role !== 'admin' && userData.role !== 'diretora' && !userData.salaId) {
        // Atribuir sala padrão para alunos se não tiver
        userData.salaId = 'sala1'; // Sala padrão
      }
      
      setUser(userData);
      setError(null);
      
      // Determinar tipo de usuário baseado no role
      if (userData.role === 'admin') {
        setUserType('admin');
      } else if (userData.role === 'diretora') {
        setUserType('diretora');
      } else {
        setUserType('aluno');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message);
    }
  };

  const handleLogout = () => {
    try {
      setUser(null);
      setUserType(null);
      setError(null);
    } catch (err) {
      console.error('Erro no logout:', err);
    }
  };

  const handleUserTypeSelect = (type) => {
    setUserType(type);
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>❌ Erro na aplicação</Text>
        <Text style={styles.errorDetails}>{error}</Text>
      </View>
    );
  }

  // Se não há usuário logado, mostrar seleção de tipo ou login
  if (!user) {
    if (!userType) {
      // Tela de seleção de tipo de usuário
      return (
        <View style={styles.container}>
          <View style={styles.selectionContainer}>
            <Text style={styles.title}>SOPHIE</Text>
            <Text style={styles.subtitle}>Selecione seu tipo de acesso:</Text>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.userTypeButton} 
                onPress={() => handleUserTypeSelect('aluno')}
              >
                <Text style={styles.userTypeButtonText}>👨‍🎓 Aluno</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.userTypeButton} 
                onPress={() => handleUserTypeSelect('diretora')}
              >
                <Text style={styles.userTypeButtonText}>👩‍🏫 Diretora</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.userTypeButton} 
                onPress={() => handleUserTypeSelect('admin')}
              >
                <Text style={styles.userTypeButtonText}>⚙️ Administração</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.deviceInfo}>
              📱 {isMobile ? 'Modo Mobile' : 'Modo Desktop'} | 🌐 {isWeb ? 'Web' : 'Native'}
            </Text>
          </View>
          <StatusBar style="auto" />
        </View>
      );
    }

    // Mostrar tela de login específica para o tipo de usuário
    return (
      <View style={styles.container}>
        {userType === 'admin' ? (
          <AdminRoute onAdminLogin={handleLogin} />
        ) : (
          <LoginScreen onLogin={handleLogin} userType={userType} />
        )}
        <StatusBar style="auto" />
      </View>
    );
  }

  // Usuário logado - mostrar interface específica
  return (
    <View style={styles.container}>
      {userType === 'admin' ? (
        <AdminPanelScreen adminUser={user} onLogout={handleLogout} />
      ) : userType === 'diretora' ? (
        <DiretoraTela user={user} onLogout={handleLogout} />
      ) : (
        <SalaTela user={user} onLogout={handleLogout} />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 12,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#7f8c8d',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  userTypeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    width: '100%',
    maxWidth: 280,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userTypeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  deviceInfo: {
    marginTop: 40,
    fontSize: 12,
    color: '#95a5a6',
    textAlign: 'center',
  },
});
