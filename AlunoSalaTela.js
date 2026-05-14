/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, StatusBar } from 'react-native';
import { COLORS, SALAS } from './constants';
import { realtimeService } from './realtimeService';
import { playNotificationSound, speak } from './audioService';

export default function AlunoSalaTela({ user, onLogout }) {
  const [salaAtual, setSalaAtual] = useState(null);
  const [avisos, setAvisos] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animação de entrada
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Encontrar sala do aluno
    const sala = SALAS.find(s => s.id === user.salaId);
    setSalaAtual(sala);

    // Carregar avisos da sala
    setTimeout(() => {
      setAvisos([
        {
          id: 1,
          titulo: '📚 Nova Atividade',
          mensagem: 'Matemática - Exercícios de frações',
          tempo: 'há 30 minutos',
          tipo: 'atividade'
        },
        {
          id: 2,
          titulo: '📝 Prova Agendada',
          mensagem: 'Português - Interpretação de textos',
          tempo: 'amanhã 14h',
          tipo: 'prova'
        },
        {
          id: 3,
          titulo: '📢 Aviso da Diretora',
          mensagem: 'Reunião de pais sexta-feira',
          tempo: 'em 2 dias',
          tipo: 'aviso'
        }
      ]);
    }, 1000);
  }, [user.salaId, fadeAnim]);

  useEffect(() => {
    const handleRealtimeMessage = (data) => {
      if (data.type !== 'announcement' && data.type !== 'message') {
        return;
      }

      if (data.roomId && data.roomId !== user.salaId) {
        return;
      }

      const novoAviso = {
        id: data.id || Date.now(),
        titulo: data.title || (data.type === 'announcement' ? '📢 Aviso da Coordenação' : '💬 Mensagem recebida'),
        mensagem: data.message || '',
        tempo: 'agora',
        tipo: data.type === 'announcement' ? 'aviso' : 'mensagem',
        lida: false,
      };

      setAvisos((prev) => {
        if (prev.some((item) => item.id === novoAviso.id)) {
          return prev;
        }
        return [novoAviso, ...prev];
      });

      playNotificationSound();
      if (data.type === 'announcement') {
        speak(`Atenção ${user.nome}, ${novoAviso.mensagem}`);
      }
    };

    const initializeRealtime = async () => {
      try {
        await realtimeService.initialize({
          userId: user.id || user.usuario,
          userName: user.nome,
          userRole: user.role,
          roomId: user.salaId,
        });

        realtimeService.on('connection', setConnectionStatus);
        realtimeService.on('message', handleRealtimeMessage);

        await realtimeService.joinRoom(user.salaId);
      } catch (error) {
        console.warn('Erro ao inicializar realtime:', error);
      }
    };

    initializeRealtime();

    return () => {
      realtimeService.off('connection', setConnectionStatus);
      realtimeService.off('message', handleRealtimeMessage);
      realtimeService.leaveRoom();
      realtimeService.disconnect();
    };
  }, [user]);

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

  if (!salaAtual) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Sala não encontrada</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor={salaAtual.cor} />
      
      {/* Header da Sala */}
      <View style={[styles.header, { backgroundColor: salaAtual.cor }]}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.nome.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user.nome}</Text>
              <Text style={styles.userRole}>Aluno</Text>
              <Text style={styles.connectionText}>
                {connectionStatus?.type === 'connected'
                  ? `Conectado via ${connectionStatus.method}`
                  : 'Conectando...'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutButtonText}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Informações da Sala */}
      <View style={styles.salaInfo}>
        <View style={[styles.salaCard, { borderLeftColor: salaAtual.cor }]}>
          <View style={styles.salaHeader}>
            <Text style={styles.salaNome}>{salaAtual.nome}</Text>
            <View style={[styles.salaBadge, { backgroundColor: salaAtual.cor }]}>
              <Text style={styles.salaBadgeText}>{salaAtual.curso}</Text>
            </View>
          </View>
          <Text style={styles.salaDescricao}>
            Bem-vindo à sua sala! Aqui você encontrará todas as atividades, avisos e materiais.
          </Text>
        </View>
      </View>

      {/* Avisos e Atividades */}
      <View style={styles.avisosSection}>
        <Text style={styles.sectionTitle}>📋 Avisos e Atividades</Text>
        <ScrollView 
          style={styles.avisosList}
          showsVerticalScrollIndicator={false}
        >
          {avisos.map(aviso => (
            <View key={aviso.id}>
              {renderAviso({ item: aviso })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Ações Rápidas */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>⚡ Ações Rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionText}>Materiais</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>Atividades</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Notas</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>Calendário</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  connectionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  salaInfo: {
    padding: 20,
  },
  salaCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  salaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  salaNome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  salaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  salaBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  salaDescricao: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  avisosSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 15,
  },
  avisosList: {
    maxHeight: 300,
  },
  avisoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avisoLido: {
    opacity: 0.7,
    borderLeftColor: '#ddd',
  },
  avisoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avisoTitulo: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
  },
  avisoTempo: {
    fontSize: 12,
    color: '#999',
  },
  avisoMensagem: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  avisoBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  avisoBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 0,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.error,
    textAlign: 'center',
    marginTop: 50,
  },
});
