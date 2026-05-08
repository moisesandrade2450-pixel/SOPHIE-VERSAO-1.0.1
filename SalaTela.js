import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Animated } from 'react-native';
import { database } from './firebaseConfig';
import { playNotificationSound, speak, stopSpeech } from './audioService';
import { COLORS, SALAS } from './constants';

export default function SalaTela({ user, onLogout }) {
  const [avisos, setAvisos] = useState([]);
  const [ledAceso, setLedAceso] = useState(false);
  const [salaInfo, setSalaInfo] = useState(null);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(10);
  const [historicoMensagens, setHistoricoMensagens] = useState([]);
  const ledAnimation = new Animated.Value(0);

  useEffect(() => {
    if (!user || !user.salaId) {
      console.warn('Usuário ou salaId não encontrado');
      return;
    }

    const sala = SALAS.find(s => s.id === user.salaId);
    setSalaInfo(sala);

    // Escutar avisos em tempo real
    const avisoRef = database.ref(`avisos/${user.salaId}`);
    database.onValue(avisoRef, async (snapshot) => {
      const data = snapshot.val();
      if (data && typeof data === 'object') {
        const avisosList = Object.entries(data)
          .map(([key, value]) => ({
            id: key,
            ...value,
            recebidoEm: new Date().toLocaleTimeString('pt-BR'),
          }))
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        setAvisos(avisosList);

        // Se houver novo aviso, acender LED, tocar som e iniciar timer
        if (avisosList.length > 0) {
          const primeiroAviso = avisosList[0];
          
          // Adicionar ao histórico
          setHistoricoMensagens(prev => [{
            id: Date.now(),
            ...primeiroAviso,
            recebidoEm: new Date().toLocaleString('pt-BR'),
            lido: false
          }, ...prev]);
          
          ativarLED();
          tocarSom();
          iniciarTimer();
          
          // Falar a mensagem
          falarMensagem(primeiroAviso.pessoas, primeiroAviso.mensagem, primeiroAviso.remetente);
        }
      }
    });
  }, [user.salaId]);

  const ativarLED = () => {
    setLedAceso(true);
    Animated.sequence([
      Animated.timing(ledAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(ledAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(ledAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setTimeout(() => setLedAceso(false), 3000);
    });
  };

  const tocarSom = async () => {
    try {
      await playNotificationSound();
    } catch (error) {
      console.log('Erro ao tocar som:', error);
    }
  };

  const falarMensagem = async (pessoas, mensagem, remetente) => {
    try {
      const textoFalar = `${pessoas} está sendo chamado. Aviso de ${remetente}. ${mensagem ? `Mensagem: ${mensagem}` : 'Por favor compareça.'}`;
      await speak(textoFalar, 'pt-BR');
    } catch (error) {
      console.log('Erro ao falar:', error);
    }
  };

  const iniciarTimer = () => {
    setTimerAtivo(true);
    setTempoRestante(10);
    
    const countdown = setInterval(() => {
      setTempoRestante(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          pararAviso();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Salvar referência para limpar depois
    window.currentTimer = countdown;
  };

  const pararAviso = () => {
    setTimerAtivo(false);
    setTempoRestante(0);
    stopSpeech();
    if (window.currentTimer) {
      clearInterval(window.currentTimer);
    }
  };

  const limparAvisos = () => {
    setAvisos([]);
    pararAviso();
  };

  const marcarComoLida = (mensagemId) => {
    setHistoricoMensagens(prev => 
      prev.map(msg => 
        msg.id === mensagemId ? { ...msg, lido: true } : msg
      )
    );
  };

  const ledBackgroundColor = ledAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.light, '#FF6B6B'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Sala Conectada</Text>
          <Text style={styles.headerSubtitle}>{salaInfo?.nome}</Text>
          <Text style={styles.usuario}>�‍🏫 Sala de Aula</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>Sair</Text>
        </TouchableOpacity>
      </View>

      {/* TIMER INDICATOR */}
      {timerAtivo && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>
            ⏱️ Aviso termina em: {tempoRestante}s
          </Text>
          <TouchableOpacity 
            style={styles.stopButton} 
            onPress={pararAviso}
          >
            <Text style={styles.stopButtonText}>⏹️ Parar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* LED INDICATOR */}
      <View style={styles.ledContainer}>
        <Animated.View
          style={[
            styles.led,
            {
              backgroundColor: ledBackgroundColor,
            },
          ]}
        />
        <Text style={styles.ledText}>
          {ledAceso ? '🔴 Chamada recebida!' : '🟢 Aguardando avisos'}
        </Text>
      </View>

      {avisos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>Nenhum aviso ainda</Text>
          <Text style={styles.emptySubtext}>Você receberá notificações aqui</Text>
        </View>
      ) : (
        <View style={styles.avisosContainer}>
          <Text style={styles.sectionTitle}>📬 Avisos Recebidos</Text>
          <FlatList
            data={avisos}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            renderItem={({ item }) => (
              <View style={styles.avisoCard}>
                <View style={styles.avisoHeader}>
                  <Text style={styles.avisoTitulo}>
                    👤 Chamada de: {item.pessoas}
                  </Text>
                  <Text style={styles.avisoHora}>{item.recebidoEm}</Text>
                </View>
                <Text style={styles.avisoRemetente}>
                  Enviado por: {item.remetente}
                </Text>
                {item.mensagem && (
                  <View style={styles.avisoMensagemContainer}>
                    <Text style={styles.avisoMensagem}>💬 "{item.mensagem}"</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.botaoRepetir}
                  onPress={() => falarMensagem(item.pessoas, item.mensagem, item.remetente)}
                >
                  <Text style={styles.botaoRepetirText}>🔊 Repetir</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      )}

      {/* STATUS BAR */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>
          Total de avisos: {avisos.length}
        </Text>
      </View>

      {/* HISTÓRICO DE MENSAGENS */}
      {historicoMensagens.length > 0 && (
        <View style={styles.historicoContainer}>
          <Text style={styles.historicoTitle}>📜 Histórico de Mensagens</Text>
          <FlatList
            data={historicoMensagens}
            keyExtractor={(item) => item.id}
            scrollEnabled={true}
            style={styles.historicoList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.historicoItem, item.lido && styles.historicoItemLido]}
                onPress={() => marcarComoLida(item.id)}
              >
                <View style={styles.historicoHeader}>
                  <Text style={styles.historicoPessoas}>👤 {item.pessoas}</Text>
                  <Text style={styles.historicoData}>{item.recebidoEm}</Text>
                </View>
                <Text style={styles.historicoRemetente}>De: {item.remetente}</Text>
                {item.mensagem && (
                  <Text style={styles.historicoMensagem}>💬 "{item.mensagem}"</Text>
                )}
                <Text style={styles.historicoStatus}>
                  {item.lido ? '✅ Lida' : '🔴 Não lida'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lighter,
  },
  header: {
    backgroundColor: COLORS.secondary,
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.light,
    marginTop: 4,
    fontWeight: '500',
  },
  usuario: {
    fontSize: 12,
    color: COLORS.white,
    marginTop: 6,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  ledContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: COLORS.white,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    gap: 12,
  },
  led: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ledText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.dark,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.light,
  },
  avisosContainer: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 12,
  },
  avisoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avisoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avisoTitulo: {
    fontWeight: '700',
    color: COLORS.primary,
    fontSize: 14,
    flex: 1,
  },
  avisoHora: {
    fontSize: 11,
    color: COLORS.light,
    fontWeight: '500',
  },
  avisoRemetente: {
    fontSize: 12,
    color: COLORS.dark,
    marginBottom: 8,
    fontWeight: '500',
  },
  avisoMensagemContainer: {
    backgroundColor: COLORS.lighter,
    borderRadius: 6,
    padding: 10,
    marginTop: 6,
  },
  avisoMensagem: {
    fontSize: 13,
    color: COLORS.dark,
    fontStyle: 'italic',
  },
  botaoRepetir: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.secondary,
    borderRadius: 6,
    alignItems: 'center',
  },
  botaoRepetirText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
  statusBar: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
  },
  statusText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 12,
  },
});
