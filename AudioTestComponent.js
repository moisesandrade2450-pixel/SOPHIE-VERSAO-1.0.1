import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { COLORS } from './constants';
import { playNotificationSound, playWarningSound, speak, stopSpeech } from './audioService';
import { realtimeService } from './realtimeService';
import { useResponsiveStyles } from './responsiveness';

export default function AudioTestComponent({ user, onBack }) {
  const [testResults, setTestResults] = useState([]);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [messages, setMessages] = useState([]);
  const { getFontSize, getSpacing, getComponentSize, isMobile } = useResponsiveStyles();

  useEffect(() => {
    // Inicializar serviço de tempo real
    initializeRealtime();
    
    return () => {
      realtimeService.disconnect();
    };
  }, []);

  const initializeRealtime = async () => {
    try {
      await realtimeService.initialize({
        userId: user.id || user.usuario,
        userName: user.nome,
        userRole: user.role || 'aluno',
        roomId: user.salaId || 'test-room',
      });

      // Listeners
      realtimeService.on('connection', setConnectionStatus);
      realtimeService.on('message', (message) => {
        setMessages(prev => [...prev, message]);
        addTestResult('Mensagem recebida', message.message, 'success');
      });

      realtimeService.on('error', (error) => {
        addTestResult('Erro de conexão', error.message || 'Erro desconhecido', 'error');
      });

    } catch (error) {
      addTestResult('Falha na inicialização', error.message, 'error');
    }
  };

  const addTestResult = (test, result, status = 'info') => {
    setTestResults(prev => [{
      id: Date.now(),
      test,
      result,
      status,
      timestamp: new Date().toLocaleTimeString(),
    }, ...prev]);
  };

  const runAudioTests = async () => {
    setIsTesting(true);
    addTestResult('Iniciando testes de áudio', 'Testes começando...', 'info');

    try {
      // Teste 1: Som de notificação
      addTestResult('Teste 1: Som de notificação', 'Executando...', 'info');
      const notificationResult = await playNotificationSound();
      addTestResult('Som de notificação', notificationResult ? '✅ Sucesso' : '❌ Falha', notificationResult ? 'success' : 'error');

      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Teste 2: Som de aviso
      addTestResult('Teste 2: Som de aviso', 'Executando...', 'info');
      const warningResult = await playWarningSound();
      addTestResult('Som de aviso', warningResult ? '✅ Sucesso' : '❌ Falha', warningResult ? 'success' : 'error');

      // Pequena pausa
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Teste 3: Síntese de fala
      addTestResult('Teste 3: Síntese de fala', 'Executando...', 'info');
      const speechResult = await speak('Teste de síntese de voz do sistema SOPHIE', 'pt-BR');
      addTestResult('Síntese de fala', speechResult ? '✅ Sucesso' : '❌ Falha', speechResult ? 'success' : 'error');

      // Teste 4: Comunicação em tempo real
      addTestResult('Teste 4: Comunicação em tempo real', 'Executando...', 'info');
      const realtimeResult = await realtimeService.testAudioSystem('Mensagem de teste para múltiplos computadores');
      addTestResult('Comunicação em tempo real', realtimeResult.success ? '✅ Sucesso' : '❌ Falha', realtimeResult.success ? 'success' : 'error');

      addTestResult('Testes concluídos', 'Todos os testes foram executados', 'success');

    } catch (error) {
      addTestResult('Erro nos testes', error.message, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const sendTestMessage = async (type = 'normal') => {
    const testMessages = {
      normal: 'Esta é uma mensagem de teste normal',
      urgent: '🚨 MENSAGEM URGENTE: Teste de comunicação crítica',
      announcement: '📢 COMUNICADO: Teste do sistema de anúncios',
    };

    const message = testMessages[type];
    const priority = type === 'urgent' ? 'high' : 'normal';

    try {
      await realtimeService.sendAnnouncement(message, priority);
      addTestResult('Mensagem enviada', `${type}: ${message}`, 'success');
    } catch (error) {
      addTestResult('Falha ao enviar', error.message, 'error');
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setMessages([]);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return COLORS.success;
      case 'error': return COLORS.error;
      case 'warning': return COLORS.warning;
      default: return COLORS.dark;
    }
  };

  const buttonSize = getComponentSize('button');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🔊 Teste de Áudio e Comunicação</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status da Conexão */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Status da Conexão</Text>
          {connectionStatus ? (
            <View>
              <Text style={styles.statusText}>
                Método: {connectionStatus.method}
              </Text>
              <Text style={styles.statusText}>
                Status: {connectionStatus.type === 'connected' ? '🟢 Online' : '🔴 Offline'}
              </Text>
            </View>
          ) : (
            <Text style={styles.statusText}>Verificando...</Text>
          )}
        </View>

        {/* Controles de Teste */}
        <View style={styles.controlCard}>
          <Text style={styles.cardTitle}>Controles de Teste</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, { height: buttonSize.height, padding: buttonSize.padding }]}
            onPress={runAudioTests}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.testButtonText}>🧪 Executar Todos os Testes</Text>
            )}
          </TouchableOpacity>

          <View style={styles.messageButtons}>
            <TouchableOpacity 
              style={[styles.messageButton, styles.normalButton]}
              onPress={() => sendTestMessage('normal')}
            >
              <Text style={styles.messageButtonText}>Normal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.messageButton, styles.urgentButton]}
              onPress={() => sendTestMessage('urgent')}
            >
              <Text style={styles.messageButtonText}>Urgente</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.messageButton, styles.announcementButton]}
              onPress={() => sendTestMessage('announcement')}
            >
              <Text style={styles.messageButtonText}>Anúncio</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={clearResults}
          >
            <Text style={styles.clearButtonText}>🗑️ Limpar Resultados</Text>
          </TouchableOpacity>
        </View>

        {/* Resultados dos Testes */}
        <View style={styles.resultsCard}>
          <Text style={styles.cardTitle}>Resultados dos Testes</Text>
          {testResults.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum teste executado ainda</Text>
          ) : (
            testResults.map(result => (
              <View key={result.id} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultTest}>{result.test}</Text>
                  <Text style={styles.resultTime}>{result.timestamp}</Text>
                </View>
                <Text style={[styles.resultResult, { color: getStatusColor(result.status) }]}>
                  {result.result}
                </Text>
              </View>
            ))
          )}
        </View>

        {/* Mensagens Recebidas */}
        <View style={styles.messagesCard}>
          <Text style={styles.cardTitle}>Mensagens Recebidas</Text>
          {messages.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma mensagem recebida</Text>
          ) : (
            messages.map((message, index) => (
              <View key={index} style={styles.messageItem}>
                <Text style={styles.messageUser}>{message.userName} ({message.userRole})</Text>
                <Text style={styles.messageText}>{message.message}</Text>
                <Text style={styles.messageTime}>
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  controlCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  messagesCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  testButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  messageButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  normalButton: {
    backgroundColor: COLORS.success,
  },
  urgentButton: {
    backgroundColor: COLORS.error,
  },
  announcementButton: {
    backgroundColor: COLORS.warning,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.dark,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  resultItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultTest: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  resultTime: {
    fontSize: 12,
    color: '#999',
  },
  resultResult: {
    fontSize: 13,
    color: '#666',
  },
  messageItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  messageUser: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.dark,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
});
