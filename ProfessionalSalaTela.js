import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions, Animated, StatusBar, FlatList } from 'react-native';
import { COLORS } from './constants';

const { width, height } = Dimensions.get('window');

export default function ProfessionalSalaTela({ user, onLogout }) {
  const [avisos, setAvisos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Simular carregamento de avisos
    setCarregando(true);
    setTimeout(() => {
      setAvisos([
        {
          id: 1,
          titulo: '📚 Atividade Nova',
          mensagem: 'Nova atividade postada: "Matemática - Frações"',
          tempo: 'há 5 minutos',
          tipo: 'atividade',
          lida: false
        },
        {
          id: 2,
          titulo: '📝 Prova Agendada',
          mensagem: 'Prova de Português sexta-feira 14h',
          tempo: 'em 2 dias',
          tipo: 'prova',
          lida: false
        },
        {
          id: 3,
          titulo: '📢 Aviso Importante',
          mensagem: 'Lembrem de trazer material de geometria',
          tempo: 'amanhã',
          tipo: 'aviso',
          lida: false
        }
      ]);
      setCarregando(false);
    }, 1500);
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair da sala?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: () => onLogout() }
      ]
    );
  };

  const marcarComoLido = (id) => {
    setAvisos(avisos.map(aviso => 
      aviso.id === id ? { ...aviso, lida: true } : aviso
    ));
  };

  const renderAviso = ({ item }) => (
    <TouchableOpacity 
      style={[styles.avisoCard, item.lida && styles.avisoLido]}
      onPress={() => !item.lida && marcarComoLido(item.id)}
    >
      <View style={styles.avisoHeader}>
        <Text style={styles.avisoTitulo}>{item.titulo}</Text>
        <Text style={styles.avisoTempo}>{item.tempo}</Text>
      </View>
      <Text style={styles.avisoMensagem}>{item.mensagem}</Text>
      {!item.lida && (
        <View style={styles.avisoBadge}>
          <Text style={styles.avisoBadgeText}>NOVO</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.nome.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user.nome}</Text>
            <Text style={styles.userRole}>Aluno</Text>
            <Text style={styles.salaInfo}>Sala: {user.salaId}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>🚪 Sair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>📢 Quadro de Avisos</Text>
        
        {carregando ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando avisos...</Text>
          </View>
        ) : (
          <FlatList
            data={avisos}
            renderItem={renderAviso}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avisosList}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: COLORS.lighter,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  salaInfo: {
    fontSize: 14,
    color: COLORS.lighter,
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  avisosList: {
    gap: 12,
  },
  avisoCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  avisoLido: {
    opacity: 0.6,
    borderLeftColor: COLORS.secondary,
  },
  avisoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avisoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  avisoTempo: {
    fontSize: 14,
    color: COLORS.secondary,
    backgroundColor: COLORS.lighter,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  avisoMensagem: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    flex: 1,
  },
  avisoBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  avisoBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
});
